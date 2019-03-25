let process = {pro: false, spawn: false, file: false, time: 0};

const fs = require('fs');
const Gpio = require('onoff').Gpio;
const player = require('play-sound')(opts = {player: "mplayer"})

const button = new Gpio(17, 'in', 'both', {debounceTimeout: 10});
let recording = false;
let audio;
let lastRec;

console.log("\n\n ! Press a button !\n\n")

button.watch((err, value) => {
  if (err) {
    throw err;
  }
  if(recording){
  	recording = false;
  	stopRec();
  } else {
  	recording = true;
  	startRec("button1.wav");
  }
});

function startRec(fileName){
    console.log(" > Recording  " + fileName)
    process.time = Date.now();
    process.file = fileName;
	process.spawn = require('child_process').spawn;
	process.pro = process.spawn('arecord', ['-D', 'sysdefault:CARD=1', '-f', 'dat'].concat(fileName), {cwd: "./recordings"});
	process.pro.on('exit', function(code, sig) {
	    if (code !== null && sig === null) {
	    }
	});
	process.pro.stderr.on('data', function(data) {
	});

}

function stopRec(){
	lastRec = process.file;
    process.pro.kill('SIGTERM');
    process.pro = false;
    process.spawn = false;-
    console.log("  - Recording finished! \n      - Length: " + ((Date.now() - process.time) / 1000).toFixed(1) + " second(s)\n      - Name: " + process.file + "\n");
    process.file = false;
    process.time = 0;
    playFile(lastRec)
}

function playFile(name){
  console.log(" > Playing file " + name);
  if(audio){
    audio.kill()
  }
  audio = player.play("./recordings/" + name, function (err) {
     if (err) {
       console.log("Error: " + err);
     }
       console.log("  - File finished\n");
  });
}
