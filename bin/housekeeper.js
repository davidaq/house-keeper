#!/usr/bin/env node

require('../lib/cli');

// var cp = require('child_process');

// var child;

// function startProcess() {
//     child = cp.fork('../lib/cli');
//     child.on('close', code => {
//         if (code) {
//             setTimeout(startProcess, 500);
//         }
//     });
// }

// startProcess();