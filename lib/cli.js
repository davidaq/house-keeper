const fs = require('fs-promise');
const path = require('path');
const daemon = require('../lib/daemon');
const os = require('os');

const isInnerCall = process.argv[3] === '--inner-call';

Promise.resolve()
	.then(() => {
		if (!isInnerCall) {
			process.chdir(os.homedir());
			return fs.mkdirs(path.join('housekeeper', 'conf.d')).catch(err => null);
		}
	})
	.then(() => {
		if (!isInnerCall)
			process.chdir('housekeeper');
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