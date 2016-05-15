const shortid = require('shortid').generate;
const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');
const splitargs = require('splitargs');
const allocPort = require('./alloc-port');
const processCheck = require('../process-check');

var repositories, pendingApps, pendingPromise, pendingResolve;

fs.exists('repos.json').then(exists => {
    if (exists)
        return fs.readFile('repos.json');
    return fs.readFile('git-repos.json');
}).then(content => {
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
    repositories = repos;
    if (pendingApps) {
        exports.update(pendingApps);
    }
});

exports.update = function(apps) {
    if (!repositories) {
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
        } else if (app.type == 'git' || app.type == 'svn') {
            var repo = repositories[app._id];
            if (!repo) {
                repositories[app._id] = repo = new Repo(app);
            } else {
                repo.setOpt(app);
                backend = repo.backend;
            }
            repo.hash = hash;
        }
        backends[k] = backend;
    }
    for (var k in repositories) {
        if (!repositories.hasOwnProperty(k))
            continue;
        var repo = repositories[k];
        if (repo.hash != hash) {
            repo.uninstall();
        }
    }
    if (pendingResolve) {
        pendingResolve(backends);
        pendingResolve = null;
    }
    return fs.writeFile('git-repos.json', JSON.stringify(repositories))
        .then(() => backends);
};

exports.getStatus = function() {
    var ret = {};
    for (var k in repositories) {
        if (!repositories.hasOwnProperty(k))
            continue;
        ret[k] = repositories[k].state;
    }
    return ret;
};

exports.updateApp = function(id) {
    var repo = repositories[id];
    if (repo) {
        repo.installOrUpdate();
    }
};

const svnArgs = ' --force -q --trust-server-cert-failures unknown-ca,cn-mismatch,expired,not-yet-valid,other --non-interactive ';

function Repo(opt) {
    this.backend = {};
    this.state = 'initialize';
    this.setOpt(opt);
    if (opt.isUninstalling) {
        this.uninstall();
    } else {
        this.startup = this.startup.bind(this);
        this.installOrUpdate();
    }
}

Repo.prototype.setOpt = function(opt) {
    this._id = opt._id;
    this.repo = opt.repo;
    this.branch = opt.branch;
    this.run = opt.run;
    this.args = opt.args;
    this.type = opt.type;
    this.username = opt.username;
    this.password = opt.password;
};

Repo.prototype.toJSON = function() {
    return {
        _id: this._id,
        repo: this.repo,
        branch: this.branch,
        run: this.run,
        args: this.args,
        type: this.type,
        username: this.username,
        password: this.password,
        isUninstalling: this.isUninstalling
    }
};

Repo.prototype.installOrUpdate = function() {
    return fs.exists(path.join(this.dir('app', '.' + this.type))).then(exists => {
        if (exists) {
            return this.update();
        } else {
            return this.install();
        }
    }).catch(e => console.error(e.stack));
};

Repo.prototype.install = function() {
    switch(this.type) {
    case 'git':
        this.state = 'clone from remote';
        return fs.mkdirs(this.dir('log')).catch(err => null)
            .then(() => fs.mkdirs(this.dir('cwd')).catch(err => null))
            .then(() => fs.remove(this.dir('app')).catch(err => null))
            .then(() => exec(this.dir(), 'git -c http.sslVerify=false clone $ $ -b $ --quiet', this.repo, 'app', this.branch))
            .then(() => this.installDep())
            .catch(err => null)
            .then(() => this.startup());
    case 'svn':
        this.state = 'checkout from server';
        return fs.mkdirs(this.dir('log')).catch(err => null)
            .then(() => fs.mkdirs(this.dir('cwd')).catch(err => null))
            .then(() => fs.remove(this.dir('app')).catch(err => null))
            .then(() => {
                if (this.username && this.password) {
                    return exec(this.dir(), 'svn co $ app' + svnArgs + '--username $ --password $', this.repo, this.username, this.password);
                } else if (this.username) {
                    return exec(this.dir(), 'svn co $ app' + svnArgs + '--username $', this.repo, this.username);
                } else {
                    return exec(this.dir(), 'svn co $ app' + svnArgs, this.repo);
                }
            })
            .then(() => this.installDep())
            .catch(err => null)
            .then(() => this.startup());
    }
};

Repo.prototype.update = function() {
    switch(this.type) {
    case 'git':
        this.state = 'fetch branch from remote';
        return Promise.resolve()
            .then(() => exec(this.dir('app'), 'git -c http.sslVerify=false fetch origin --quiet'))
            .then(() => exec(this.dir('app'), 'git reset --hard origin/$', this.branch))
            .then(() => this.installDep())
            .catch(err => null)
            .then(() => this.startup());
    case 'svn':
        this.state = 'update from server';
        return Promise.resolve()
            .then(() => exec(this.dir('app'), 'svn cleanup'))
            .then(() => {
                if (this.username && this.password) {
                    return exec(this.dir('app'), 'svn up' + svnArgs + '--username $ --password $', this.repo, this.username, this.password);
                } else if (this.username) {
                    return exec(this.dir('app'), 'svn up' + svnArgs + '--username $', this.repo, this.username);
                } else {
                    return exec(this.dir('app'), 'svn up' + svnArgs, this.repo);
                }
            })
            .then(() => this.installDep())
            .catch(err => null)
            .then(() => this.startup());
    }
};

Repo.prototype.installDep = function() {
    this.state = 'install dependencies';
    if (!this.run) {
        return Promise.resolve();
    }
    return exec(this.dir('app'), 'npm install --only=prod --loglevel win');
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
            if (!this.run) {
                this.backend.url = ((CFG.ssl && CFG.ssl.key && CFG.ssl.crt) ? 'https' : 'http') + '://127.0.0.1:' + CFG.manager.port + '/serve-static/' + this._id + '/';
                this.state = 'serving static';
            } else {
                var portNum = allocPort();
                this.backend.url = 'http://127.0.0.1:' + portNum + '/';
                const args = [path.join(this.dir('app'), this.run), '--port', portNum].concat(
                    splitargs(this.args
                        .replace(/\$\{app_dir\}/g, this.dir('app'))
                        .replace(/\$\{run_dir\}/g, this.dir('cwd'))
                        .replace(/\$\{log_dir\}/g, this.dir('log'))
                        .replace(/\$\{conf_dir\}/g, path.resolve('conf.d'))
                    )
                );
                console.log('>> [', this.dir('cwd'), ']');
                console.log('>>', args.map(v => '"' + v + '"').join(' '));
                const child = this.child = cp.spawn(
                    process.execPath,
                    args,
                    { cwd: this.dir('cwd'), stdio: ['inherit','inherit','inherit'] }
                );
                processCheck.autoKill(child);
                this.state = 'running on port ' + portNum;
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
            }
        })
};

Repo.prototype.shutdown = function() {
    if (this.child) {
        return new Promise(resolve => {
            this.child.on('close', () => setTimeout(resolve, 1000));
            this.child.restart = false;
            this.child.kill('SIGINT');
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
                fs.remove(this.dir('app')).catch(err => null),
                fs.writeFile(
                    path.join(this.dir('cwd'), 'housekeeper-app-info.log'),
                    JSON.stringify(this.toJSON(), null, '  ')
                )
                .catch(err => null),
                fs.remove(this.dir('log')).catch(err => null)
            ]);
        })
        .then(() => {
            delete repositories[this._id];
            return fs.writeFile('git-repos.json', JSON.stringify(repositories))
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
