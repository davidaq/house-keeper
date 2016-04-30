const shortid = require('shortid').generate;
const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');
const splitargs = require('splitargs');
const allocPort = require('./alloc-port');
const processCheck = require('../process-check');

var gitRepos, pendingApps, pendingPromise, pendingResolve;

fs.readFile('git-repos.json').then(content => {
    var repos = JSON.parse(content);
    for (var k in repos) {
        if (!repos.hasOwnProperty(k))
            continue;
        repos[k] = new Repo(repos[k]);
    }
    return repos;
}).catch(err => {
    return {};
}).then(repos => {
    gitRepos = repos;
    if (pendingApps) {
        exports.update(pendingApps);
    }
});

exports.update = function(apps) {
    if (!gitRepos) {
        pendingApps = apps;
        if (!pendingPromise) {
            pendingPromise = new Promise(resolve => {
                pendingResolve = resolve;
            });
        }
        return pendingPromise;
    }
    pendingApps = null;
    pendingPromise = null;
    var backends = {};
    var hash = shortid();
    for (var k in apps) {
        if (!apps.hasOwnProperty(k))
            continue;
        var app = apps[k];
        var backend = {};
        if (app.type == 'proxy') {
            backend.url = app.url.split(';');
            backend.host = app.host;
            backend.cookie = app.cookie;
        } else if (app.type == 'git') {
            var repo = gitRepos[app._id];
            if (!repo) {
                gitRepos[app._id] = repo = new Repo(app);
            } else {
                repo.setOpt(app);
                backend = repo.backend;
            }
            repo.hash = hash;
        }
        backends[k] = backend;
    }
    for (var k in gitRepos) {
        if (!gitRepos.hasOwnProperty(k))
            continue;
        var repo = gitRepos[k];
        if (repo.hash != hash) {
            repo.uninstall();
        }
    }
    if (pendingResolve) {
        pendingResolve(backends);
        pendingResolve = null;
    }
    return fs.writeFile('git-repos.json', JSON.stringify(gitRepos))
        .then(() => backends);
};

exports.getStatus = function() {
    var ret = {};
    for (var k in gitRepos) {
        if (!gitRepos.hasOwnProperty(k))
            continue;
        ret[k] = gitRepos[k].state;
    }
    return ret;
};

exports.updateApp = function(id) {
    var repo = gitRepos[id];
    if (repo) {
        repo.update();
    }
};

function Repo(opt) {
    this.backend = {};
    this.state = 'initialize';
    this.setOpt(opt);
    if (opt.isUninstalling) {
        this.uninstall();
    } else {
        this.startup = this.startup.bind(this);
        fs.exists(path.join(this.dir('app', '.git'))).then(exists => {
            if (exists) {
                return this.update();
            } else {
                return this.install();
            }
        }).catch(e => console.error(e.stack));
    }
}

Repo.prototype.setOpt = function(opt) {
    this._id = opt._id;
    this.repo = opt.repo;
    this.branch = opt.branch;
    this.run = opt.run;
    this.args = opt.args;
};

Repo.prototype.toJSON = function() {
    return {
        _id: this._id,
        repo: this.repo,
        branch: this.branch,
        run: this.run,
        args: this.args,
        isUninstalling: this.isUninstalling
    }
}

Repo.prototype.install = function() {
    this.state = 'clone from remote';
    return fs.mkdirs(this.dir('log')).catch(err => null)
        .then(() => fs.mkdirs(this.dir('cwd')).catch(err => null))
        .then(() => fs.remove(this.dir('app')).catch(err => null))
        .then(() => exec(this.dir(), 'git -c http.sslVerify=false clone $ $ --single-branch -b $ --depth 1 --quiet', this.repo, 'app', this.branch))
        .then(() => this.installDep())
        .then(() => this.startup())
};

Repo.prototype.update = function() {
    this.state = 'fetch branch from remote';
    return Promise.resolve()
        .then(() => exec(this.dir('app'), 'git -c http.sslVerify=false fetch --quiet origin $', this.branch))
        .then(() => exec(this.dir('app'), 'git reset --hard origin/$', this.branch))
        .then(() => this.installDep())
        .then(() => this.startup())
};

Repo.prototype.installDep = function() {
    this.state = 'install dependencies';
    return exec('.', 'which cnpm')
        .then(cnpm => exec(this.dir('app'), (cnpm.out ? 'cnpm' : 'npm') + ' install --loglevel win'));
};

Repo.prototype.startup = function() {
    if (this.isUninstalling)
        return;
    this.state = 'startup';
    return fs.mkdirs(this.dir('log')).catch(err => null)
        .then(() => fs.mkdirs(this.dir('cwd')).catch(err => null))
        .then(() => {
            if (this.child) {
                this.child.restart = false;
                this.child.kill();
            }
            var portNum = allocPort();
            this.backend.url = 'http://127.0.0.1:' + portNum + '/';
            const args = [path.resolve(this._id + '.app', this.run), '--port', portNum].concat(
                splitargs(this.args
                    .replace(/\$\{app_dir\}/g, this.dir('app'))
                    .replace(/\$\{run_dir\}/g, this.dir('cwd'))
                    .replace(/\$\{log_dir\}/g, this.dir('log'))
                    .replace(/\$\{conf_dir\}/g, path.resolve('conf.d'))
                )
            );
            console.log('>> [', path.resolve(this._id + '.cwd'), ']');
            console.log('>>', args.map(v => '"' + v + '"').join(' '));
            const child = this.child = cp.spawn(
                process.execPath,
                args,
                { cwd: this.dir('cwd'), stdio: ['inherit','inherit','inherit'] }
            );
            processCheck.autoKill(child);
            this.state = 'running' + ' on port ' + portNum;
            child.startupTime = Date.now();
            child.on('error', err => {
                console.error(err.stack || err.message || err);
            });
            child.on('close', (code, signal) => {
                this.child = null;
                if (child.restart) {
                    this.state = 'down';
                    var delay = 10000 - (Date.now() - child.startupTime);
                    if (delay < 100)
                        delay = 100;
                    setTimeout(this.startup, delay);
                }
            });
        })
};

Repo.prototype.shutdown = function() {
    if (this.child) {
        return new Promise(resolve => {
            this.child.on('close', () => setTimeout(resolve, 1000));
            this.child.restart = false;
            this.child.kill();
        });
    }
    return Promise.resolve();
};

Repo.prototype.uninstall = function() {
    if (this.isUninstalling)
        return;
    this.isUninstalling = true;
    this.state = 'shuting down';
    return this.shutdown()
        .then(() => {
            this.state = 'removing files';
            return Promise.all([
                fs.remove(this._id + '.app').catch(err => null),
                fs.writeFile(
                    path.join(this._id + '.cwd', 'housekeeper-app-info.log'),
                    JSON.stringify(this.toJSON(), null, '  ')
                )
                .catch(err => null),
                fs.remove(this._id + '.log').catch(err => null)
            ]);
        })
        .then(() => {
            delete gitRepos[this._id];
            return fs.writeFile('git-repos.json', JSON.stringify(gitRepos))
        })
};

Repo.prototype.dir = function(sub) {
    return path.resolve(path.join('runtime', this._id, sub || ''));
};

function exec() {
    var dir = path.resolve(arguments[0] || '.');
    var cmd = arguments[1];
    var args = Array.prototype.slice.call(arguments, 2);
    var i = 0;
    var cmd = cmd.replace(/\$/g, function() {
        var ret = args[i++];
        return '"' + ret.replace(/([\\"])/g, '\\$1') + '"';
    });
    console.log('>> [', dir, ']');
    console.log('>> ', cmd);
    return new Promise((resolve, reject) => {
        cp.exec(cmd, {
            cwd: dir
        }, (error, stdout, stderr) => {
            if (error)
                reject(error);
            else
                resolve({out:stdout || '', err:stderr || ''});
        });
    });
}
