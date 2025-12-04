# FeedMusic - Backend

This is the backend API service for **FeedMusic**, an Emotional AI web-application that bridges the gap between a user's real-time emotional state and their personalized music experience. For the complete project overview, see the [main README](../README.md).

## Overview

The backend is responsible for AI/ML processing, external API integrations, playlist generation, and serving the REST API that powers the frontend application. It handles all complex computations, machine learning model inference, and third-party service communications.

## How to Run the backend server:

```bash

python main.py
```

## Technology Stack

- **Framework**: FastAPI (Python web framework)
- **Server**: Uvicorn (ASGI server)
- **ML/AI**: 
  - TensorFlow/Keras (emotion-to-features model)
  - scikit-learn (StandardScaler, One-Hot Encoder)
  - pandas (data processing)
- **External APIs**:
  - Spotify Web API (music data, authentication, playback)
  - ReccoBeats API (music recommendations)
  - Groq API (LLM for artist normalization)
  - ElevenLabs API (text-to-speech)
- **Data Validation**: Pydantic models
- **HTTP Client**: requests library

## System Architecture

### Backend Architecture

The backend follows a modular service-oriented architecture:

```
backend/
├── app/
│   ├── api.py              # Main FastAPI application and routes
│   ├── chatbot.py          # Conversational DJ logic
│   ├── voice_service.py    # ElevenLabs TTS integration
│   └── startup.py          # Model loading and initialization
├── models/                 # Pre-trained ML models
│   ├── mood_encoder.pkl    # One-hot encoder for emotions
│   ├── feature_scaler.pkl  # StandardScaler for audio features
│   └── mood_to_features.h5 # Neural network: emotion → audio features
├── data/
│   └── dataset.csv         # Training/validation data
├── spotify_api.py          # Spotify OAuth and client management
├── spotify_recc.py         # Spotify recommendation utilities
├── emotionmusic.py         # Emotion-to-music mapping logic
├── emotion_utils.py        # Emotion processing utilities
├── llm_classification.py   # LLM-based artist normalization
└── main.py                 # Application entry point
```

### Core Services

#### 1. Emotion-to-Music Translation (`app/startup.py`, `emotionmusic.py`)
- **ML Model Pipeline**: 
  - One-Hot Encoder: Converts emotion strings to numerical features
  - Neural Network: Predicts Spotify audio features from emotions
  - StandardScaler: Normalizes predicted features
- **Theory-Based Mapping**: Uses Russell's Circumplex Model of Affect to map emotions to valence/energy dimensions
- **Feature Prediction**: Generates target values for energy, valence, tempo, loudness, danceability, and other audio features

#### 2. Recommendation Engine (`app/api.py`)
- **Hybrid Approach**: Combines emotion-based features with user preferences
- **Artist Normalization**: Uses LLM (Groq) to expand user-selected artists to similar artists
- **Feature Blending**: Blends emotion-predicted features with artist profile features
- **ReccoBeats Integration**: Generates high-quality track recommendations based on blended features
- **Ranking System**: Ranks recommendations by artist preference (high/medium/low match)

#### 3. Spotify Integration (`spotify_api.py`, `spotify_recc.py`)
- **OAuth 2.0 Flow**: Handles user authentication and token management
- **User Data Retrieval**: Fetches top artists, tracks, and user profile
- **Playlist Management**: Creates and saves playlists to user's Spotify account
- **Playback Control**: Controls music playback on user's devices

#### 4. Conversational DJ (`app/chatbot.py`)
- **LLM-Powered**: Uses Groq API for natural language understanding
- **Context-Aware**: Maintains conversation history and user context
- **Music Generation Triggers**: Can detect when user wants music and trigger playlist generation
- **Multi-language**: Detects and responds in user's language

#### 5. Voice Service (`app/voice_service.py`)
- **Text-to-Speech**: Integrates ElevenLabs API for voice synthesis
- **Voice Selection**: Multiple DJ voice personalities available
- **Streaming Audio**: Returns audio streams for frontend playback

## API Endpoints

### Authentication & User
- `GET /spotify/login` - Initiate Spotify OAuth flow
- `GET /callback` - Handle OAuth callback
- `GET /spotify/me` - Get current user profile
- `GET /spotify/token` - Get Spotify access token

### Music Recommendations
- `GET /api/recommendation` - Generate personalized playlist
  - Query params: `emotion` (required), `artists` (optional list)
  - Returns: Ranked list of track recommendations

### Playback Control
- `POST /api/play` - Start playback on Spotify
- `POST /api/pause` - Pause playback
- `POST /api/resume` - Resume playback
- `GET /api/current-track` - Get currently playing track

### Chatbot & Voice
- `POST /api/chat` - Send message to conversational DJ
- `POST /api/detect-language` - Detect language from text
- `POST /api/text-to-speech` - Convert text to speech
- `GET /api/voices` - Get available voice options
- `POST /api/change-voice` - Change DJ voice personality

### Playlist Management
- `POST /api/save-playlist` - Save playlist to Spotify account
- `GET /api/top-artists` - Get user's top artists

## Machine Learning Pipeline

### Emotion-to-Audio Features Model

The core ML pipeline translates detected emotions into Spotify audio features:

1. **Input**: Emotion string (e.g., "happy", "sad", "angry")
2. **Encoding**: One-hot encoding via `mood_encoder.pkl`
3. **Prediction**: Neural network (`mood_to_features.h5`) predicts audio features
4. **Normalization**: Inverse transform using `feature_scaler.pkl`
5. **Output**: Audio features (energy, valence, tempo, loudness, danceability, etc.)

### Feature Blending

When user selects artists:
1. **Artist Expansion**: LLM expands selected artists to similar artists
2. **Profile Extraction**: Gets average audio features for each artist
3. **Feature Combination**: Combines artist profiles into single vector
4. **Blending**: Blends emotion features (70% weight) with artist features (30% weight)
5. **Final Features**: Used for ReccoBeats API recommendations

## External API Integrations

### Spotify Web API
- **Purpose**: User authentication, music data, playback control
- **Authentication**: OAuth 2.0 with refresh token support
- **Endpoints Used**: 
  - User profile and top content
  - Track/artist search and metadata
  - Playlist creation and management
  - Playback control

### ReccoBeats API
- **Purpose**: High-quality music recommendations
- **Input**: Audio features (energy, valence, tempo, etc.) + seed tracks
- **Output**: Curated list of recommended tracks with Spotify links

### Groq API
- **Purpose**: Fast LLM inference for artist normalization
- **Use Cases**:
  - Expanding user-selected artists to similar artists
  - Extracting artist feature profiles
  - Generating track suggestions as fallback

### ElevenLabs API
- **Purpose**: Text-to-speech for conversational DJ
- **Features**: Multiple voice personalities, streaming audio

## Development Setup

### Prerequisites

- Python 3.11 or higher
- pip package manager
- Git

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
Create a `.env` file in the backend directory:
```env
SPOTIPY_CLIENT_ID="your_spotify_client_id"
SPOTIPY_CLIENT_SECRET="your_spotify_client_secret"
GROQ_API_KEY="your_groq_api_key"
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
OPENAI_API_KEY="your_openai_api_key"  # Optional, for fallback
```

5. Verify model files are present:
Ensure the following files exist in `backend/models/`:
- `mood_encoder.pkl`
- `feature_scaler.pkl`
- `mood_to_features.h5`

## Model Architecture

### Emotion-to-Features Neural Network

- **Input Layer**: One-hot encoded emotion (5 dimensions)
- **Hidden Layers**: Dense layers with activation functions
- **Output Layer**: Audio features (energy, valence, tempo, loudness, danceability, acousticness, instrumentalness, liveness, speechiness)
- **Training**: Trained on emotion-labeled music dataset using Russell's Circumplex Model

### Preprocessing Components

- **One-Hot Encoder**: Maps emotion strings to binary vectors
- **StandardScaler**: Normalizes audio features to standard distribution
- **Feature Constraints**: Applies Spotify API constraints (e.g., energy/valence 0-1, tempo 50-250 BPM)

## Data Flow

### Playlist Generation Flow

1. **Frontend** sends emotion + selected artists
2. **Backend** predicts audio features from emotion using ML model
3. **Backend** expands artists using LLM (if provided)
4. **Backend** gets artist feature profiles and blends with emotion features
5. **Backend** retrieves seed tracks from user's Spotify top tracks
6. **Backend** calls ReccoBeats API with features + seeds
7. **Backend** searches Spotify for recommended tracks
8. **Backend** ranks tracks by artist preference match
9. **Backend** returns ranked recommendations to frontend


## Performance Considerations

- **Model Caching**: ML models loaded once at startup and cached in app state
- **Async Operations**: FastAPI async endpoints for concurrent requests
- **Batch Processing**: Artist data fetched in batches to respect API limits
- **Connection Pooling**: Reused HTTP connections for external APIs

## Security

- **Token Management**: Spotify tokens stored in HTTP-only cookies
- **CORS**: Configured to allow only frontend origin
- **Input Validation**: Pydantic models validate all API inputs
- **Error Messages**: Sanitized to avoid exposing sensitive information

## Testing

```bash
# Run with auto-reload for development
uvicorn app.api:app --reload --host 127.0.0.1 --port 8888
```


## Team

Developed by Jaunel Panton, Osita Odunze, Marissa Savage, Najae Potts

