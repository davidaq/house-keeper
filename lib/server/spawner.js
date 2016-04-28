const shortid = require('shortid').generate;
const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');
const splitargs = require('splitargs');
const allocPort = require('./alloc-port');

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

function Repo(opt) {
    this.backend = {};
    this.state = 'initialize';
    this.setOpt(opt);
    this.startup = this.startup.bind(this);
    fs.exists(this._id + '.app/.git/').then(exists => {
        if (exists) {
            this.startup();
            return this.update();
        } else {
            return this.install();
        }
    }).catch(e => console.error(e.stack));
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
        args: this.args
    }
}

Repo.prototype.install = function() {
    this.state = 'clone from remote';
    return fs.remove(this._id + '.app').catch(err => null)
        .then(() => exec('./', 'git clone $ $ --single-branch -b $ --depth 1 --quiet', this.repo, this._id + '.app', this.branch))
        .then(() => {
            this.state = 'install dependencies';
            return exec(this._id + '.app', 'npm install --loglevel win');
        })
        .then(() => {
            return this.startup();
        })
};

Repo.prototype.update = function() {
    this.state = 'pull from remote';
    return Promise.resolve()
        .then(() => exec(this._id + '.app', 'git reset --hard HEAD'))
        .then(() => exec(this._id + '.app', 'git pull --quiet'))
        .then(() => {
            this.state = 'install dependencies';
            return exec(this._id + '.app', 'npm install --loglevel win');
        })
        .then(() => {
            return this.startup();
        })
};

Repo.prototype.startup = function() {
    this.state = 'startup';
    return fs.mkdir(this._id + '.log').catch(err => null)
        .then(() => fs.mkdir(this._id + '.cwd').catch(err => null))
        .then(() => {
            if (this.child) {
                this.child.restart = false;
                this.child.kill();
            }
            var portNum = allocPort();
            this.backend.url = 'http://localhost:' + portNum + '/';
            const child = this.child = cp.fork(
                path.resolve(this._id + '.app', this.run), 
                ['--port', portNum].concat(splitargs(this.args)),
                { cwd: path.resolve(this._id + '.cwd') }
            );
            this.state = 'running';
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

Repo.prototype.uninstall = function() {
    this.state = 'removing files';
    return Promise.all([
        fs.remove(this._id + '.app').catch(err => null),
        fs.remove(this._id + '.cwd').catch(err => null),
        fs.remove(this._id + '.log').catch(err => null)
    ]);
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
                resolve({out:stdout, err:stderr});
        });
    });
}
