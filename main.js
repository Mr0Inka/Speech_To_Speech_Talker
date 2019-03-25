//Require libraries
const fs = require('fs');
const Gpio = require('onoff').Gpio;
const player = require('play-sound')(opts = {player: "mplayer"})
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');

//Set variables
const button = new Gpio(17, 'in', 'both', {debounceTimeout: 10}); //Attach interrupt for the button
let process = {pro: false, spawn: false, file: false, time: 0};
let recording = false;
let audio;
let lastRec;

//Google clients
const voiceClient = new textToSpeech.TextToSpeechClient({
      keyFilename: './key.json',
      projectId: 'reader-234408'
});

const speechClient = new speech.SpeechClient({
      keyFilename: './key.json',
      projectId: 'reader-234408'
});



console.log("\n\n ! Press a button !\n\n")

button.watch((err, value) => { //Set up interrupt events
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


function startRec(fileName){ //Start recording
    console.log(" > Recording  " + fileName)
    process.time = Date.now();
    process.file = fileName;
	process.spawn = require('child_process').spawn;
	process.pro = process.spawn('arecord', ['-D', 'sysdefault:CARD=1', '-f', 'dat', '-c', '1'].concat(fileName), {cwd: "./recordings"});
	process.pro.on('exit', function(code, sig) {
	    if (code !== null && sig === null) {
	    }
	});
	process.pro.stderr.on('data', function(data) {
	});

}


function stopRec(){ //Stop recording
	lastRec = process.file;
    process.pro.kill('SIGTERM');
    process.pro = false;
    process.spawn = false;-
    console.log("  - Recording finished! \n      - Length: " + ((Date.now() - process.time) / 1000).toFixed(1) + " second(s)\n      - Name: " + process.file + "\n");
    process.file = false;
    process.time = 0;
    readSpeech(lastRec);
}


function playFile(name){ //Play a file
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

function readSpeech(fileName){ //Analyze the wav file
    console.log(" > Analyzing voice")
    const file = fs.readFileSync("./recordings/" + fileName);
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
            console.log("  - Done: " + transcription + "\n\n");
            gcloudVoice(transcription, fileName)
        } else {
            console.log("  - Done: " + "Nothing to recognize..." + "\n");
        }
      })
      .catch(err => {
        console.error('ERROR:', err);
      });

}


function gcloudVoice(text, fileName){ //Convert text to speech audio
  console.log(" > Converting to audio")
  let newFileName = "voice_" + fileName.replace(".wav", "") + ".mp3"
  let preset = {languageCode: 'de-DE', name: "de-DE-Wavenet-B", ssmlGender: 'NEUTRAL'}

  const request = {
    input: {text: text},
    voice: preset,
    audioConfig: {audioEncoding: 'MP3'},
  };
  
  voiceClient.synthesizeSpeech(request, (err, response) => {
    if (err) {
      console.log('ERROR:', err);
    }
    fs.writeFile("./recordings/" + newFileName, response.audioContent, 'binary', err => {
      if (err) {
        console.log('ERROR:', err);
      }
      console.log('  - Content written to file: ' + newFileName + "\n\n");
      setTimeout(function(){
      	playFile(newFileName)
      }, 500);
      
    });
  });
}
