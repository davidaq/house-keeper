const fs = require('fs-promise');
const path = require('path');
const daemon = require('../lib/daemon');
const os = require('os');

const isInnerCall = process.argv[3] === '--inner-call';


Promise.resolve()
	.then(() => {
		if (isInnerCall)
			return;
		var housekeeperPath;
		return fs.readFile(path.join(os.homedir(), '.housekeeper_path'), 'utf-8')
			.catch(err => 'housekeeper')
			.then(dirPath => {
				dirPath = dirPath.trim();
				if (dirPath == '~') {
					dirPath = os.homedir();
				} else if (dirPath.match(/^\~[\\\/]/)) {
					dirPath = path.resolve(os.homedir(), dirPath.substr(2));
				}
				housekeeperPath = path.resolve(os.homedir(), dirPath);
				return fs.mkdirs(path.join(housekeeperPath, 'conf.d')).catch(err => null);;
			})
			.then(() => fs.exists(path.join(housekeeperPath, 'conf.d')))
			.then(exists => {
				if (!exists) {
					console.error('Unable to setup working directory in ' + housekeeperPath);
					process.exit(2);
				}
				process.chdir(housekeeperPath);
			})
	})
	.then(() => {
		switch(process.argv[2]) {
		case 'start':
			daemon.start();
			break;
		case 'stop':
			daemon.stop();
			break;
		case 'restart':
			daemon.stop().then(() => daemon.start());
			break;
		case 'guard':
			daemon.guard();
			break;
		case 'run':
			if (isInnerCall)
				require('../lib/startup')
			else
				daemon.check().then(() => require('../lib/startup'));
			break;
		default:
			console.log('Run with the following command:');
			console.log('\tstart:    start the daemon server');
			console.log('\tstop:     stop the daemon server');
			console.log('\trestart:  restart the daemon server');
			console.log('\trun:      run directly');
		}
	})
	.catch(err => {
		console.log(err.stack || err.message || err);
	});