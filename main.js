let process = {pro: false, spawn: false};

const fs = require('fs');
const request = require("request");
const Gpio = require('onoff').Gpio;
const player = require('play-sound')(opts = {player: "mpg123"})
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');

let volJob = require('child_process').exec;

const b1 = new Gpio(23, 'in', 'falling', {debounceTimeout: 300}); //Cap button
const b2 = new Gpio(24, 'in', 'falling', {debounceTimeout: 300}); //Cap button
const b3 = new Gpio(25, 'in', 'falling', {debounceTimeout: 300}); //Cap button
const b4 = new Gpio(8, 'in', 'falling', {debounceTimeout: 300}); //Cap button
const b5 = new Gpio(7, 'in', 'falling', {debounceTimeout: 300}); //Cap button

const hw = new Gpio(22, 'in', 'both', {debounceTimeout: 50}); //Controller button

const capEn = new Gpio(2, "out"); //Enable capacitive buttons
const led = new Gpio(26, "out"); //LED output

let activeButtons = ["b1", "b5", "b3"];

let msgVolume = 95;
let toneVolume = 75;

let speechTimeout = 10000;
let apiTimeout = false;

let d_state = false;

let recording = false;
let playing = false;
let recordTime = 0;
let audio = false;
let lastRec;

let ledInterval;
let ledTimeout;
let autoSwitch;

let shutDownState;
let shutDownTimer;

let reactTimeout = false;
let react = false;

let commands = ["abschalten", "stimme", "laut", "mittel", "leise"]

let voices = {
    male_de: {languageCode: 'de-DE', name: "de-DE-Wavenet-B", ssmlGender: 'NEUTRAL'},
    female_de: {languageCode: 'de-DE', name: "de-DE-Wavenet-A", ssmlGender: 'NEUTRAL'}
}

let connection = true;

let currentVoice = "male_de";

var exec = require('child_process').exec;

//Google clients
const voiceClient = new textToSpeech.TextToSpeechClient({
      keyFilename: './key.json',
      projectId: 'reader-234408'
});

const speechClient = new speech.SpeechClient({
      keyFilename: './key.json',
      projectId: 'reader-234408'
});

resetCap()
playFile("stop")
console.log("\n\n ! Press a button !\n\n")
ledMode("idle")

b1.watch((err, value) => {
    if(react){
	resetCap()
    }  
    if(activeButtons.indexOf("b1") == -1){
	console.log("b1 is not active");
	return;
    }
    if(audio){
	audio.kill();
	playing = false;
        audio = false;
    } else if(!recording){
        if(d_state){
	    recording = "channel_1";
	    startRec();
        } else {
	    playFile("channel_1")
        }
    }

});

b2.watch((err, value) => {
    if(react){
	resetCap()
    }  
    if(activeButtons.indexOf("b2") == -1){
	console.log("b2 is not active");
	return;
    }
    if(audio){
	audio.kill();
	playing = false;
        audio = false;
    } else if(!recording){
        if(d_state){
	    recording = "channel_2";
	    startRec();
        } else {
	    playFile("channel_2")
        }
    }
});

b3.watch((err, value) => {
    if(react){
	resetCap()
    }  
    if(activeButtons.indexOf("b3") == -1){
	console.log("b3 is not active");
	return;
    }
    if(audio){
	audio.kill();
	playing = false;
        audio = false;
    } else if(!recording){
        if(d_state){
	    recording = "channel_3";
	    startRec();
        } else {
	    playFile("channel_3")
        }
    } 
});

b4.watch((err, value) => {
    if(react){
	resetCap()
    }  
    if(activeButtons.indexOf("b4") == -1){
	console.log("b4 is not active");
	return;
    }
    if(audio){
	audio.kill();
	playing = false;
        audio = false;
    } else if(!recording){
        if(d_state){
	    recording = "channel_4";
	    startRec();
        } else {
	    playFile("channel_4")
        }
    } 
});

b5.watch((err, value) => {
    if(react){
	resetCap()
    }  
    if(activeButtons.indexOf("b5") == -1){
	console.log("b5 is not active");
	return;
    }
    if(audio){
	audio.kill();
	playing = false;
        audio = false;
    } else if(!recording){
        if(d_state){
	    recording = "channel_5";
	    startRec();
        } else {
	    playFile("channel_5")
        }
    } 
});

let lastClick = 0;

hw.watch((err, value) => {
    d_state = (hw.readSync() === 1) ? true : false;

    if(!d_state){
        let timePassed = Date.now() - lastClick;
            lastClick = Date.now();
	if(recording){
            stopRec();
	} else {
	    if(timePassed < 500){
		console.log(" > Double press! Toggling!");
                //toggleVoice()
	    }
        }
    }
});



//buttonE.watch((err, value) => {
//    shutDownState = !shutDownState;
//    
//
//    if(!shutDownState){
//	clearTimeout(shutDownTimer);
//	console.log(" > Shutdown stopped");
//    } else {
//	console.log(" > Shutting down in 5s...");
//	shutDownTimer = setTimeout(function(){
//	    console.log(" > Shutting down");
//            shutdown(function(output){
//    	        console.log(output);
//            });
//	}, 3000);
//    }
//});

function enableCap(state){
    if(state){
	capEn.writeSync(1);
    } else {
	capEn.writeSync(0);
    }
}

function resetCap(){
    clearTimeout(reactTimeout)
    reactTimeout = false
    react = false
    enableCap(false)
    reactTimeout = setTimeout(function(){
	enableCap(true)
	react = true;
    }, 500)
}


function startRec(){
    ledMode("recording")
    playFile("recon")
    console.log(" > Recording on " + recording + "...")
    recordTime = Date.now();
    process.spawn = require('child_process').spawn;
    process.pro = process.spawn('arecord', ['-D', 'sysdefault:CARD=1', '-f', 'dat', '-c', '1'].concat(recording + "_rec.wav"), {cwd: "./recordings"});
    process.pro.on('exit', function(code, sig) {
	if (code !== null && sig === null) {
        }
    });
    process.pro.stderr.on('data', function(data) {
    });

}

function toggleVoice(){
    for(let key in voices){
	if(key != currentVoice){
	    currentVoice = key;
	    console.log(currentVoice);
            playFile(currentVoice);
	    return;
	}
    }
}

function stopRec(){
    if(process.pro){
        process.pro.kill('SIGTERM');
        process.pro = false;
	process.spawn = false;
        console.log(" > Recording on " + recording + " finished! \n      - Length: " + ((Date.now() - recordTime) / 1000).toFixed(1) + " second(s)\n      - Name: " + recording + "_rec.wav");
        playFile("recoff")
	setTimeout(function(){
	    readSpeech();
	}, 500);
    }
}

function readSpeech(){
    apiTimeout = setTimeout(function(){
	forceStop();
    }, speechTimeout);
    ledMode("processing")
    console.log(" > Analyzing voice")
    const file = fs.readFileSync("./recordings/" + recording + "_rec.wav");
    const audioBytes = file.toString('base64');

    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 48000,
      languageCode: 'de-DE',
      enableAutomaticPunctuation: true,
      model: "default"
    };

    const request = {
      audio: audio,
      config: config
    };
    
    speechClient
      .recognize(request)
      .then(data => {
        const response = data[0];
        const transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
        if(transcription.length > 0){
            console.log(" > Done: " + transcription + "\n\n");
	    if(isCommand(transcription)){
		processCommand(transcription)
		recording = false;
	    } else {
		if(transcription.toLowerCase().indexOf("männlich") == 0) {
		    currentVoice = "male_de"
		} else if(transcription.toLowerCase().indexOf("weiblich") == 0){
		    currentVoice = "female_de"
		}
	        gcloudVoice(transcription.replace("männlich", "").replace("weiblich", "").replace("Männlich", "").replace("Weiblich", ""))
	    }
        } else {
            console.log(" > Done: " + "Nothing to recognize..." + "\n");
	    clearTimeout(apiTimeout);
            ledMode("error")
            recording = false;
	    playFile("error");
        }
      })
      .catch(err => {
        console.error('ERROR:', err);
        recording = false;
        ledMode("error")
	clearTimeout(apiTimeout);
      });

}


function gcloudVoice(text){
  console.log(" > Converting to audio")
  let newFileName = recording + "_voice.mp3"
  let preset = voices[currentVoice];

  const request = {
    input: {text: text},
    voice: preset,
    audioConfig: {audioEncoding: 'MP3'},
  };
  
  voiceClient.synthesizeSpeech(request, (err, response) => {
    if (err) {
      console.log('ERROR:', err);
      recording = false;
      ledMode("error")
      clearTimeout(apiTimeout);
    }
    fs.writeFile("./recordings/" + newFileName, response.audioContent, 'binary', err => {
      if (err) {
        console.log('ERROR:', err);
        recording = false;
        ledMode("error")
	clearTimeout(apiTimeout);
      }
      console.log(' > Content written to file: ' + newFileName + "\n\n");
      recording = false;
      ledMode("idle")
      clearTimeout(apiTimeout);
      playFile("success")
    });
  });
}

function playFile(channel){

  let soundName;

  if(channel.indexOf("channel") >= 0){
        setVol(msgVolume)
        soundName = "./recordings/" + channel + "_voice.mp3"
	ledMode("playing")
  } else {
        setVol(toneVolume)
	soundName = "./system/" + channel + ".mp3"
  }
  playing = true;
  console.log(" > Playing " + channel);
  if(audio){
    audio.kill()
  }
  audio = player.play(soundName, function (err) {
     if (err) {
       console.log("Error: " + err);
       playing = false;
       audio = false;
       ledMode("error")
     }
       //console.log(" > Channel finished\n");
       playing = false;
       audio = false;
       if(channel.indexOf("channel") >= 0){
          ledMode("idle")
       }
  });
}



function ledMode(mode){
   clearInterval(ledInterval);
   clearTimeout(ledTimeout);
   clearTimeout(autoSwitch);
   led.writeSync(0);

   if(mode =="recording"){
	led.writeSync(1);
   } else if(mode == "idle"){
	ledInterval = setInterval(function(){
	    led.writeSync(1);
	    ledTimeout = setTimeout(function(){
		led.writeSync(0);
	    }, 200);
	}, 2000);
   } else if(mode == "processing"){
	ledInterval = setInterval(function(){
	    led.writeSync(1);
	    ledTimeout = setTimeout(function(){
		led.writeSync(0);
	    }, 250);
	}, 500);
   } else if(mode == "error"){
	autoSwitch = setTimeout(function(){
	    ledMode("idle");
	}, 1000);
	ledInterval = setInterval(function(){
	    led.writeSync(1);
	    ledTimeout = setTimeout(function(){
		led.writeSync(0);
	    }, 50);
	}, 100);
   } else if(mode = "playing"){
	ledInterval = setInterval(function(){
	    led.writeSync(1);
	    ledTimeout = setTimeout(function(){
		led.writeSync(0);
	    }, 500);
	}, 1000);
   } else if(mode = "shutdown"){
	ledInterval = setInterval(function(){
	    led.writeSync(1);
	    ledTimeout = setTimeout(function(){
		led.writeSync(0);
	    }, 120);
	}, 100);
   } else if(mode = "connection"){
	ledInterval = setInterval(function(){
	    led.writeSync(1);
	    ledTimeout = setTimeout(function(){
		led.writeSync(0);
	    }, 25);
	}, 50);
   }
}

function shutdown(callback){
    ledMode("shutdown");
    playFile("stop")
    setTimeout(function(){
        exec('sudo shutdown now', function(error, stdout, stderr){ callback(stdout); });
    }, 1000);

}


function setVol(value){
    if(value > 0 && value <= 100){
        volJob("sudo amixer sset 'PCM' " + value + "%");   
    }
}

function isCommand(command){
    if(commands.indexOf(command.toLowerCase()) >= 0){
	return true;
    } else {
	return false;
    }
}

function processCommand(command){
    if(command.toLowerCase() == "abschalten"){
	console.log("ABSCHALTEN");
        shutdown(function(output){
	    console.log(output);
        });
    } else if(command.toLowerCase() == "stimme"){
        toggleVoice()
    } else if(command.toLowerCase() == "laut"){
	console.log("LAUT")
	msgVolume = 100;
        toneVolume = 75;
	playFile("success");
    } else if(command.toLowerCase() == "mittel"){
	console.log("MITTEL")
	msgVolume = 75;
        toneVolume = 50;
	playFile("success");
    } else if(command.toLowerCase() == "leise"){
	console.log("LEISE")
	msgVolume = 50;
        toneVolume = 30;
	playFile("success");
    } 
}

function forceStop(){
    console.log(" > Request timed out");
    playFile("error");
    ledMode("error");
    //recording = false;
}
