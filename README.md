# Speech_To_Speech_Talker

Simple RaspberryPi based device to record messages that can be played back with an anonymous voice. This is intended to be used as a very basic communicator for the disabled. While existing products only play back a recorded voice, this approach turns the voice into anonymous Google Wavefront speech, making the situation for a mute person using another (known) person's voice less awkward.

This project uses the GoogleCloud API to convert speech to text and back. If there is no internet connection, it will play back the raw recording and convert it to an anonymous voice as soon as an internet connection is established.
