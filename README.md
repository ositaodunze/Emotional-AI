# FeedMusic

FeedMusic is an Emotional AI web-application that bridges the gap between a user's real-time emotional state and their personalized music experience. By analyzing facial expressions captured through a live webcam feed, FeedMusic identifies the user's emotional state, refines it through user confirmation, and dynamically generates a Spotify playlist tailored to either match or improve the detected mood.The system integrates facial recogniton, machine learning models, Large Language Model (LLM) powered normalization, and a hybrid recommendation engine.
The system currently focuses on classifying and responding to five fundamental facial expressions:

- Happiness
- Surprise
- Neutrality
- Sadness
- Anger

- Project Poster: (<https://www.canva.com/design/DAG6mmIrQdE/Km51YMoLtozccVYzUbQx-A/edit?utm_content=DAG6mmIrQdE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton>)

### Architecture Components

- **Frontend**: Handles all client-side processing, UI rendering, and user interactions. Emotion detection runs entirely in the browser for privacy and performance.
- **Backend**: Manages ML model inference, external API communications, playlist generation, and serves the REST API.

For detailed architecture information, see:

- [Frontend Architecture](./frontend/README.md#system-architecture)
- [Backend Architecture](./backend/README.md#system-architecture)

## Key Features

### Real-Time Emotion Detection

Live facial expression analysis is performed directly in the browser using face-api.js models, ensuring low latency and privacy. The system detects five core emotions: **Happiness, Surprise, Neutrality, Sadness, and Anger**.

### Emotional Artificial Intelligence Core

A custom machine learning model that translates user emotions into numerical Spotify audio features using:

- Russell's Circumplex Model of Affect (valence/energy mapping)
- Tempo and loudness calibration
- Neural network-based feature prediction

### Personalized Recommendation Engine

Integrates multiple data sources to generate hyper-personalized playlists:

- Emotion-predicted audio features
- User's top Spotify artists and tracks
- LLM-expanded similar artists
- Third-party recommendation service (ReccoBeats)

### Intelligent Artist Normalization

Uses LLM (Groq) to expand user-selected artists to similar artists and extract their musical feature profiles, creating a richer recommendation context.

### Seamless Spotify Integration

- OAuth 2.0 authentication
- Direct playlist creation and saving
- Real-time playback control
- User profile and listening history access

### Conversational DJ

An interactive chatbot that:

- Understands natural language requests
- Detects user language automatically
- Can trigger playlist generation through conversation
- Supports text-to-speech with multiple voice personalities

## Technology Stack

### Frontend

- **Framework**: React 19.1.1 with Vite
- **Styling**: Tailwind CSS
- **Facial Recognition**: face-api.js
- **Routing**: React Router DOM
- **Authentication**: Supabase

### Backend

- **Framework**: FastAPI with Uvicorn
- **ML/AI**: TensorFlow/Keras, scikit-learn, pandas
- **External APIs**: Spotify Web API, ReccoBeats, Groq, ElevenLabs
- **Data Validation**: Pydantic

For complete technology details, see:

- [Frontend Technology Stack](./frontend/README.md#technology-stack)
- [Backend Technology Stack](./backend/README.md#technology-stack)

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher) and npm
- **Python** 3.11 or higher
- **Git**
- **Webcam** access (for emotion detection)

### Required API Keys

You will need to obtain and configure API keys for:

- **Spotify**: Client ID and Secret ([Get from Spotify Developer Dashboard](https://developer.spotify.com/dashboard))
- **Groq**: API key ([Get from Groq](https://console.groq.com/))
- **ElevenLabs**: API key ([Get from ElevenLabs](https://elevenlabs.io/))
- **Supabase**: URL and Anon Key ([Get from Supabase](https://supabase.com/))
- **OpenAI**: API key (optional, for fallback)

### Quick Start

1. **Clone the repository**:

```bash
git clone https://github.com/ositaodunze/Emotional-AI
cd Emotional-AI
```

- [Frontend Setup Guide](./frontend/README.md#development-setup)
- [Backend Setup Guide](./backend/README.md#development-setup)

## Project Structure

```
Emotional-AI/
├── frontend/              # React frontend application
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities
│   ├── public/           # Static assets and ML models
│   └── README.md         # Frontend documentation
├── backend/              # FastAPI backend service
│   ├── app/              # Application code
│   ├── models/           # Pre-trained ML models
│   ├── data/             # Training data
│   └── README.md         # Backend documentation
└── README.md             # This file
```

## Development

**Backend**:

```bash
cd backend
main.py
```

**Frontend**:

```bash
cd frontend
npm run dev
```

Developed by **Jaunel Panton, Osita Odunze, Marissa Savage, Najae Potts**
