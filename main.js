const fs = require('fs');
const request = require("request");
const Gpio = require('onoff').Gpio;
const player = require('play-sound')(opts = {player: "mplayer"})
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');

const buttonA = new Gpio(17, 'in', 'rising', {debounceTimeout: 30});
const buttonB = new Gpio(27, 'in', 'rising', {debounceTimeout: 30});
const buttonC = new Gpio(22, 'in', 'rising', {debounceTimeout: 30});
const buttonD = new Gpio(10, 'in', 'both', {debounceTimeout: 30});
const buttonE = new Gpio(3, 'in', 'both', {debounceTimeout: 30});
const led = new Gpio(23, "out");

let process = {pro: false, spawn: false};

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

playFile("start")
console.log("\n\n ! Press a button !\n\n")
ledMode("idle")

buttonA.watch((err, value) => {
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

buttonB.watch((err, value) => {
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

buttonC.watch((err, value) => {
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

buttonD.watch((err, value) => {
    d_state = !d_state;

    if(!d_state){
	if(recording){
            stopRec();
	}
    }
});

buttonE.watch((err, value) => {
    shutDownState = !shutDownState;

    if(!shutDownState){
	clearTimeout(shutDownTimer);
	console.log(" > Shutdown stopped");
    } else {
	console.log(" > Shutting down in 5s...");
	shutDownTimer = setTimeout(function(){
	    console.log(" > Shutting down");
            shutdown(function(output){
    	        console.log(output);
            });
	    }, 3000);
    }
});

function startRec(){
    ledMode("recording")
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

function stopRec(){
    process.pro.kill('SIGTERM');
    process.pro = false;
    process.spawn = false;-
    console.log(" > Recording on " + recording + " finished! \n      - Length: " + ((Date.now() - recordTime) / 1000).toFixed(1) + " second(s)\n      - Name: " + recording + "_rec.wav");
    readSpeech();
}

function readSpeech(){
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
      config: config,
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
	    gcloudVoice(transcription)
        } else {
            console.log(" > Done: " + "Nothing to recognize..." + "\n");
            ledMode("error")
            recording = false;
        }
      })
      .catch(err => {
        console.error('ERROR:', err);
        recording = false;
        ledMode("error")
      });

}


function gcloudVoice(text){
  console.log(" > Converting to audio")
  let newFileName = recording + "_voice.mp3"
  let preset = {languageCode: 'de-DE', name: "de-DE-Wavenet-B", ssmlGender: 'NEUTRAL'}

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
    }
    fs.writeFile("./recordings/" + newFileName, response.audioContent, 'binary', err => {
      if (err) {
        console.log('ERROR:', err);
        recording = false;
        ledMode("error")
      }
      console.log(' > Content written to file: ' + newFileName + "\n\n");
      recording = false;
      ledMode("idle")
    });
  });
}

function playFile(channel){
  let soundName;
  if(channel.indexOf("channel") >= 0){
      soundName = "./recordings/" + channel + "_voice.mp3"
  } else {
	    soundName = "./system/" + channel + ".mp3"
  }

  ledMode("playing")
  playing = true;
  console.log(" > Playing on " + channel);
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
       console.log(" > Channel finished\n");
       playing = false;
       audio = false;
       ledMode("idle")
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
	}, 2000);
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
   }
}

function shutdown(callback){
    ledMode("shutdown");
    playFile("stop")
    setTimeout(function(){
        exec('sudo shutdown now', function(error, stdout, stderr){ callback(stdout); });
    }, 1000);
}
