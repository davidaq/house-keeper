const shortid = require('shortid').generate;
const cp = require('child_process');
const fs = require('fs-promise');

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
                repo.install();
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
    this.url = opt.url;
    this.branch = opt.branch;
    this.buildScript = opt.build;
    this.setupScript = opt.setup;
    this.state = 'ready';
}

Repo.prototype.toJSON = function() {
    return {
        _id: this._id,
        url: this.url,
        branch: this.branch,
        buildScript: this.buildScript,
        setupScript: this.setupScript
    }
}

Repo.prototype.install = function() {
    this.state = 'cloning';
    return exec('./', 'git clone -b $ $ $', this.branch, url, this._id + '.app')
        .then(() => {
            return this.update();
        })
        
};

Repo.prototype.update = function() {
    return exec(this._id + '.app', 'git pull')
        .then(() => {
            return exec(this._id + '.app', this.buildScript);
        })
        .then(() => {
            return this.startup();
        })
};

Repo.prototype.startup = function() {
    
};

Repo.prototype.uninstall = function() {
    
};

function exec() {
    var dir = arguments[0];
    var cmd = arguments[1];
    var args = Array.prototype.slice.call(arguments, 2);
    var i = 0;
    var cmd = cmd.replace('$', function() {
        var ret = args[i++];
        return '"' + ret.replace(/([\\"])/g, '\\$1') + '"';
    });
}
