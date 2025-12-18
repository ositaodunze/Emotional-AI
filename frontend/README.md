# FeedMusic - Frontend

This is the frontend application for **FeedMusic**, an Emotional AI web-application that bridges the gap between a user's real-time emotional state and their personalized music experience. For the complete project overview, see the [main README](../README.md).

## Overview

The frontend is responsible for the user interface, real-time emotion detection, and client-side interactions. It communicates with the backend API to generate personalized playlists based on detected emotions.

## How to start the development server

```bash
npm run dev -- --host 127.0.0.1
```

## Technology Stack

- **Framework**: React 19.1.1 with Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.16
- **Routing**: React Router DOM 6.30.2
- **Facial Recognition**: face-api.js 0.22.2 & @vladmandic/face-api 1.7.15
- **UI Components**: Lucide React (icons), Lottie React (animations)
- **Authentication**: Supabase 2.86.0
- **Build Tool**: Vite with React plugin

## System Architecture

### Client-Side Architecture

The frontend follows a component-based architecture with clear separation of concerns:

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CamFeed.jsx     # Webcam feed and emotion detection
│   │   ├── EmotionDetection.jsx  # Emotion visualization
│   │   ├── Chatbot.jsx     # Conversational DJ interface
│   │   ├── MusicPlayer.jsx # Spotify playback controls
│   │   ├── ConnectSpotify.jsx  # Spotify OAuth flow
│   │   └── ...
│   ├── pages/              # Route-based page components
│   │   ├── Home.jsx        # Main dashboard
│   │   ├── Landing.jsx    # Landing page
│   │   ├── Login.jsx      # Authentication
│   │   ├── Playlist.jsx   # Playlist view
│   │   └── ...
│   └── lib/                # Utility libraries
│       └── supabase.js     # Supabase client configuration
└── public/
    └── models/             # Pre-trained face-api.js models
```

### Key Components

#### Emotion Detection (`CamFeed.jsx`, `EmotionDetection.jsx`)

- **Real-time Processing**: Captures webcam feed and processes frames using face-api.js
- **Model Loading**: Loads pre-trained models for face detection and expression recognition
- **Emotion Classification**: Detects five core emotions: Happiness, Surprise, Neutrality, Sadness, Anger
- **User Confirmation**: Allows users to confirm or adjust detected emotions before playlist generation

#### Chatbot Interface (`Chatbot.jsx`)

- **Conversational DJ**: Interactive chatbot powered by backend LLM services
- **Multi-language Support**: Detects and responds in user's language
- **Voice Integration**: Optional text-to-speech using ElevenLabs API
- **Music Generation**: Can trigger playlist generation through conversation

#### Music Player (`MusicPlayer.jsx`)

- **Spotify Integration**: Controls playback on user's Spotify account
- **Playlist Management**: Displays and manages generated playlists
- **Playback Controls**: Play, pause, resume functionality

#### Spotify OAuth (`ConnectSpotify.jsx`, `api/spotify/`)

- **Authentication Flow**: Handles Spotify OAuth 2.0 authorization
- **Token Management**: Manages access tokens via secure cookies
- **User Profile**: Displays connected Spotify user information

## Real-Time Emotion Detection

The frontend performs emotion detection entirely in the browser using face-api.js, ensuring:

- **Low Latency**: No network delay for emotion detection
- **Privacy**: Facial data never leaves the user's device
- **Performance**: GPU-accelerated processing when available

### Emotion Detection Flow

1. **Model Initialization**: Loads face detection and expression models on app startup
2. **Frame Capture**: Continuously captures frames from webcam feed
3. **Face Detection**: Detects faces in each frame using SSD MobileNet or Tiny Face Detector
4. **Expression Analysis**: Analyzes facial landmarks and expressions
5. **Emotion Classification**: Maps expressions to one of five emotions
6. **User Feedback**: Displays detected emotion and allows user confirmation
7. **API Communication**: Sends confirmed emotion to backend for playlist generation

## API Integration

The frontend communicates with the backend API (running on `http://127.0.0.1:8888`) for:

- **Playlist Generation**: `/api/recommendation` - Generates personalized playlists
- **Spotify Authentication**: `/spotify/login`, `/callback` - OAuth flow
- **User Data**: `/spotify/me`, `/api/top-artists` - User profile and preferences
- **Playback Control**: `/api/play`, `/api/pause`, `/api/resume` - Music playback
- **Chatbot**: `/api/chat` - Conversational DJ interactions
- **Text-to-Speech**: `/api/text-to-speech` - Voice synthesis

## Development Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Webcam access (for emotion detection)

### Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (if needed):
   Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://127.0.0.1:8888
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Key Features

### Real-Time Emotion Detection

- Live facial expression analysis using face-api.js
- Five emotion classifications: Happy, Sad, Angry, Surprised, Neutral
- Visual feedback with emotion labels and confidence scores

### Personalized Playlists

- Emotion-based music recommendations
- Artist preference selection
- Genre filtering
- Playlist saving to Spotify account

### Conversational DJ

- Natural language interaction
- Multi-language support
- Voice synthesis (optional)
- Context-aware responses

### Spotify Integration

- Seamless OAuth authentication
- Direct playlist playback
- User profile integration
- Top artists and tracks access

## Performance Considerations

- Face-api.js models are loaded asynchronously to avoid blocking initial render
- Emotion detection runs at optimized frame rates to balance accuracy and performance
- Large model files are cached in browser storage after first load
- React components use memoization to prevent unnecessary re-renders

## Security & Privacy

- Facial recognition data never leaves the user's device
- Spotify tokens stored in HTTP-only cookies
- CORS configured to restrict API access to authorized origins
- No personal data stored locally without user consent

## Troubleshooting

### Webcam Not Working

- Ensure browser permissions are granted for camera access
- Check that no other application is using the webcam
- Try refreshing the page and re-granting permissions

### Models Not Loading

- Check browser console for errors
- Ensure models are present in `public/models/` directory
- Clear browser cache and reload

### API Connection Issues

- Verify backend server is running on port 8888
- Check CORS configuration in backend
- Ensure API URL is correctly configured

## Team

Developed by Jaunel Panton, Osita Odunze, Marissa Savage, Najae Potts
