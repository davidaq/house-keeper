const shortid = require('shortid').generate;
const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');

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
    return Promise.resolve(backends);
}

function Repo(opt) {
    this._id = opt._id;
    this.repo = opt.repo;
    this.branch = opt.branch;
    this.run = opt.run;
    fs.exists(this._id + '.app/.git/').then(exists => {
        if (exists) {
            return this.update();
        } else {
            return this.install();
        }
    }).catch(e => console.error(e.stack));
}

Repo.prototype.toJSON = function() {
    return {
        _id: this._id,
        repo: this.repo,
        branch: this.branch,
        run: this.run
    }
}

Repo.prototype.install = function() {
    this.state = 'clone from remote';
    return fs.remove(this._id + '.app').catch(err => null)
        .then(() => exec('./', 'git clone $ $ --single-branch -b $ --depth 1', this.repo, this._id + '.app', this.branch))
        .then(() => {
            this.state = 'install dependencies';
            return exec(this._id + '.app', 'npm install');
        })
        .then(() => {
            return this.startup();
        })
};

Repo.prototype.update = function() {
    this.state = 'pull from remote';
    return exec(this._id + '.app', 'git pull')
        .then(() => {
            this.state = 'install dependencies';
            return exec(this._id + '.app', 'npm install');
        })
        .then(() => {
            return this.startup();
        })
};

Repo.prototype.startup = function() {
    
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
