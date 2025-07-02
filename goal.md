# Overview

I want to build a lab assist windows app which will help me help me keep track of my lab readings. I’m building it to help in a pharmacology lab by keeping track of weights of animals, in which cage they are in, what are the animal numbers etc. 

# Requirements

- Needs to have a listen mode which keeps listening for things to note and notes it down. Eg: I say rat 1 cage 1 weight 300g and then stay silent for a while. The app should note down the given reading and wait for the next one in the gap.
    - Needs to identify commands from the stream of audio
        - Needs to log/show these commands in the chat to validate what the transcription
    - Should also allow querying based on the old data
        - What are all the rats having weight around 300g(+/- 20g). Should say audio and also generate a table in the app chat to show visually
    - Should allow modifications to the data
    - Should allow repeating the last reading
- Should work offline. Maybe using whisper.cpp (wrapper on whisper model) works for us. Evaluate what is the best for us. Evaluate on the basis of app being light on the CPU, memory, fast and reliable. Reliability takes precedence over all other. Transcription is strictly supported only for english language that too for short <30 second commands.
- Stretch goal - Add functionality to analyze the data, make graphs etc. Only logging the data in lab should work offline. Other commands can use API calls to models for better accuracy etc.
- Need to store data offline for now. Would sqlite DB work best or something else? Maybe excel docs to maintain data? (Maybe we will consider storing it online as well later. So abstract the storage layer for extensibility)

# Future extensions to keep in mind

- Not sure if we can use the same setup for any intelligent note taking app where people can check what they did the past few days, how efficient they were etc. Maybe if we connect the note taking app to AI using MCP it would work
- Need security to prevent people using the app as a free AI subscription. That is sending their own prompts and getting responses which have nothing to do with the app.
- Can also add ability to create notes team wise. Then it can be used for inventory management etc where people keep maintaining the common inventory note (If this does not make sense we can skip it)