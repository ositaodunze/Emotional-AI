# FeedMusic
FeedMusic is an Emotional AI web-application that bridges the gap between a user's real-time emotional state and their personalized music experience. By analyzing facial expressions captured by webcam, the system dynamically generates and plays a Spotify playlist tailored to either match or improve the detected mood.

## Key Features:
- Real-Time Emotion Detection: analyze user's face to determine dominate mood, which the user can decide on using. 
- Emotional Artifical Intelligence Core: Mapsthe detected emotion to specific audio featues(like valence and energy) using a pre-trained machine learning model based on Russell's Circumpluar theory of music model. 

- Personalized Recommendaion Engine: Integrates the emotional features, user-preferred genres, and top listening history to generate a hyper-personalized playlist using a third-party recommendation service (ReccoBeats).

- Intelligent Genre Mapping: Uses OpenAI LLM to normalize Spotify's micro-genres into a standard set of master genres, ensuring consistent personalization. 

- Seamless Spotify Integration: Enables direct playlist playback and control on the user's Spotify account.

## Focused Emotions
The system currently focuses on classifying and responding to five fundamental facial expressions:
- Happiness, Surprise, Neutrality, Sadness, Anger

## Technical Architecure
FeedMusic follows a modern, two-part architecture consisting of a real-time client-side emotion detector and a powerful Python backend API.

## Frontend
- Technology Stack: VITE, React, HTML, CSS
- Facial Recognition: Utilizes the face-api.js library, a JavaScript implementation of deep learning models for face detection, model analysis, and emotion classification, ensuring real-time performance directly in the browser.

## Backend 
The service layer handles all the complex AI, data processing, and external API communication.
- Technology Stack: Python 3.11+, FastAPI, Uvicorn, requests, pandas

- Data Models: Uses Pydantic for robust data validation and clear API schema definition.

External AI/APIs:
- Spotify Web API: Handles user authentication, retrieving top tracks/artists, and initiating music playback.

- Emotional Feature Model: A locally loaded machine learning model (music_model, ohe, scaler_y) predicts target Spotify audio features (e.g., energy, valence) from the input emotion.

- ReccoBeats: An external recommendation API used to generate high-quality tracks based on the computed emotional features and user seed tracks.

- OpenAI: Utilized for a Genre Normalization Service to map raw Spotify micro-genres to the project's consistent master genres.

## Setting Up the Development Environment
This project requires both a Node.js environment for the frontend and a Python environment for the backend API.

### Prerequisites
- Node.js & npm
- Python 3.11 or higher

API Keys: You will need to obtain and configure API keys for:
- Spotify: Client ID and Secret (for authorization flow)
- OpenAI: API Key (for genre normalization)

## Backend Setup 
- Clone the reposistory:
``` 
git clone
```
cd Emotional-Ai

- Create and activate virtual environment: 
```
python -m venv .venv
Windows: .venv\Scripts\activate
Linux/macOS: source .venv/bin/activate
```

- Install dependencies:
```
pip install -r requirements.txt
```

- Configure Environment Variables:
Create a file named .env in the root directory and add your API keys:
```
SPOTIPY_CLIENT_ID="your_spotify_client_id"
SPOTIPY_CLIENT_SECRET="your_spotify_client_secret"
OPENAI_API_KEY="your_openai_api_key
```

- Run the Backend Service:
```
uvicorn app.main:app --reload
```

## Frontend Setup 
- Navigate to the frontend directory: 
```
cd frontend
```

- To open website: 
```
npm run dev
```


### Next Steps

## Team
Developed by Jaunel Panton, Osita Odunze, Marissa Savage, Najae Potts


