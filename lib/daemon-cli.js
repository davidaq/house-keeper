const cp = require('child_process');
const fs = require('fs');
const path = require('path');

if(!process.env.daemonized) {
    if(fs.existsSync('pid')) {
        console.warn('Found existing pid, please stop first');
        return;
    }
    var child = cp.fork(path.join(__dirname, 'daemon-cli.js'), [], {
        // silent:true,
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore', 'ignore'],
        env: {daemonized:true}
    });
    child.unref();
    fs.writeFile('pid', child.pid + '', function() {
        console.log('Daemon started: pid =', child.pid);
        process.exit();
    });
} else {
	var child;

	function startProcess() {
	    child = cp.fork(path.join(__dirname, 'cli.js'));
	    child.on('close', code => {
	        if (code) {
	            setTimeout(startProcess, 500);
	        }
	    });
	}

	startProcess();
}