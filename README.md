# FeedMusic

FeedMusic is a web-application that uses facial recognition to detect user's emotion and map that to music. Our AI based project maps mood to music, generates a playlist with a variety of songs to match or improve the user's mood. 

The 5 facial expressions focused are: anger, sadness, neutrality, happiness, and surprise.

# Frontend
This application is developed using VITE + React to detect real-time facial emotions from a webcam feed using face-api.js model for facial regonition, model nagalysis, and emotion classifer. 

# Backend 
Service implemented using Python and FASTAPI. (to be implemented)

Developed in Python, uses SpotifyAPI for playlist genration, and playback.
Maps emotion to music using user's genre preference and lyric or song's description. Based on these, a playlist is generated and is able to be played. 

## Setting Up the Development Environment
Ensure node.js is installed. 
Run: npm install

To open website: 
Run: npm dev run

Ensure Python 3.11 or higher is installed on your machine.
Create a vm in directory
Run: python -m venv .venv
Install required dependencies: pip install -r requirements.txt

## Next Steps
Implement service using Python & FAST API. 
Modify frontend and backend scripts to be able to facilate get/post protocols.
Implement backend for prefence storage
Combine logic for smooth user experience

## Team
Developed by Jaunel Panton, Osita Odunze, Marissa Savage, Najae Potts


