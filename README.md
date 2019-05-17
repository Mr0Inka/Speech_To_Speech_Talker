# Speech_To_Speech_Talker

Simple RaspberryPi based device to record messages that can be played back with an anonymous voice. This is intended to be used as a very basic communicator for the disabled. While existing products only play back a recorded voice, this approach turns the voice into anonymous Google Wavefront one, making the situation for a mute person using another (known) person's voice less awkward. It also features both, male and female voices.

This project uses the GoogleCloud API to convert speech to text and back. If there is no internet connection, it will play back the raw recording and convert it to an anonymous voice as soon as an internet connection is established.

''Kit version:**
This project features a dedicated sandwich shield hosting all the required components. In this case, the thing you need are:  
- Raspberry Pi Zero WH
- Adafruit "STANDALONE 5-PAD CAPACITIVE TOUCH SENSOR BREAKOUT"
- Adafruit "I2S 3W Class D AMPLIFIER"
- Micro USB Microphone (or standard USB + adaptor)
- Generic 5V 3A Power supply
- An old (or new) laptop speaker
- The Open_AI_Talker_Shield

The shield consists of two square shaped PCBs. The upper one is mostly the touch sensitive area with three channels. and hosts the record button. The bottom one connects all the other electronics and hold a female micro usb to power everything up.  

You can order the shield in a 5/5 constellation (5 top / 5 bottom) for as cheapas 2$ from JLCPCB.com. For around 10$ you'll get the 5/5 constellation with all the on-board electronics installed.  

After receiving your manufactured board:  
1. Put the SD card with the firmware into the Raspberry Pi
2. Plug in the USB microphone
3. Put the Raspberry Pi into it's slot on the bottom side
4. Connect the speaker to the Adafruit amplifier and put both components into their marked spots
5. Attach the capacitive sensor board
6. Sandwich both boards together and you are good to go!
7. You are good to go!

To connect to a Wifi, change up the "talker_config.cfg" file on the SD card root or use a display and a mouse/keyboard.
