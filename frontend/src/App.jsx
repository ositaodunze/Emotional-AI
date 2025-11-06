import React, { useState } from "react";
import "./App.css";
import EmotionDetection from "./components/EmotionDetection.jsx";
import GenreSelection from "./components/GenreSelection.jsx";
import MusicPlayback from "./components/MusicPlayer.jsx";
import ConnectSpotify from "./components/ConnectSpotify.jsx";

function App() {
  const [emotion, setEmotion] = useState("");
  const [selectedGenre, setSelectedGenres] = useState([]);
  const [spotifyUser, setSpotifyUser] = useState([null]);
  const [step, setStep] = useState("connect");
  

  return (
    <div>
      {step === "connect" && (
        <ConnectSpotify
          onContinue={(user) => {
            setSpotifyUser(user);
            setStep("genre");
          }}
        />
      )}

      {step === "genre" && (
        <GenreSelection
          onContinue={(genres) => {
            setSelectedGenres(genres);
            setStep("emotion");
          }}
        />
      )}

      {step === "emotion" && (
        <EmotionDetection
          onEmotionDetected={(detectedEmotion) => {
            setEmotion(detectedEmotion);
            setStep("music");
          }}
        />
      )}

      {step === "music" && (
        <MusicPlayback emotion={emotion} genres={selectedGenres} spotifyUser={spotifyUser} onGenerateNew={() =>{ setEmotion(""); setStep("emotion")}} />
      )}
    </div>
  );
}

export default App;
