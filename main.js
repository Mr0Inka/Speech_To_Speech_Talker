let process = {pro: false, spawn: false, file: false};

const fs = require('fs');
const Gpio = require('onoff').Gpio;

const button = new Gpio(17, 'in', 'both', {debounceTimeout: 10});
let recording = false;

button.watch((err, value) => {
  if (err) {
    throw err;
  }
  if(recording){
  	recording = false;
  	stopRec();
  } else {
  	recording = true;
  	startRec("recording.voc");
  }
});

function startRec(fileName){
    console.log("Started: " + fileName)
    process.file = fileName;
	process.spawn = require('child_process').spawn;
	process.pro = process.spawn('arecord', ['-D', 'sysdefault:CARD=1', '-f', 'dat', '-t', 'voc'].concat(fileName), {cwd: "./recordings"});
	process.pro.on('exit', function(code, sig) {
	    if (code !== null && sig === null) {
	    }
	});
	process.pro.stderr.on('data', function(data) {
	});

}

function stopRec(){
    process.pro.kill('SIGTERM');
    process.pro = false;
    process.spawn = false;
    console.log("Stopped: " + process.file);
    process.file = false;
}


