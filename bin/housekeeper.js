#!/usr/bin/env node
const fs = require('fs-promise');
const path = require('path');

fs.exists('package.json').then(exists => {
	if (exists) {
		throw 'This is not supposed to run in a project directory, run this in a dedicated directory';
	}
	return fs.exists(path.join('housekeeper', 'package.json'));
}).then(exists => {
	if (exists) {
		throw 'This is not supposed to run in a project directory, run this in a dedicated directory';
	}
	return fs.mkdir('housekeeper').catch(err => null);
}).then(() => {
	process.chdir('housekeeper');
	switch(process.argv[2] || 'run') {
	case 'start':
		require('../lib/daemon-cli');
		break;
	case 'stop':
		stop();
		break;
	case 'restart':
		stop().then(() => require('../lib/daemon-cli'));
		break;
	case 'run':
		if (!process.argv[2]) {
			console.log('You may run `housekeeper start` to start daemonized.');
			console.log('Run `housekeeper help` for more information.\n\n');
		}
		require('../lib/cli');
		break;
	default:
		console.log('Run with the following command:');
		console.log('\tstart:    start the daemon server');
		console.log('\tstop:     stop the daemon server');
		console.log('\trestart:  restart the daemon server');
		console.log('\trun:      run directly');
	}
}).catch(err => {
	console.log(err.stack || err.message || err);
});

function stop() {
	return fs.readFile('pid', 'utf-8')
		.then(pid => {
			try {
           		process.kill(pid - 0, 'SIGINT');
				console.log('Process ' + pid + ' killed');
			} catch(err) {
				console.log('Process ' + pid + ' may not exist anymore');
			}
            return fs.unlink('pid').catch(err => null)
		})
		.catch(err => {
			console.log('No pid file found');
		})
}