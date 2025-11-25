import React, { useState, useEffect } from "react";
import "./App.css";
import EmotionDetection from "./components/EmotionDetection.jsx";
import GenreSelection from "./components/GenreSelection.jsx";
import MusicPlayback from "./components/MusicPlayer.jsx";
import ConnectSpotify from "./components/ConnectSpotify.jsx";
import Home from "./components/Home.jsx";

function App() {
  const [emotion, setEmotion] = useState("");
  const [selectedGenre, setSelectedGenres] = useState([]);
  const [spotifyUser, setSpotifyUser] = useState([null]);
  const [step, setStep] = useState("home");

  useEffect(() => {
    const root = document.getElementById("root");
    const body = document.body;
    if (step === "home") {
      root?.classList.add("home-active");
      body?.classList.add("home-active");
    } else {
      root?.classList.remove("home-active");
      body?.classList.remove("home-active");
    }
  }, [step]);

  return (
    <div>
      {step === "home" && (
        <Home
          onAuth={() =>{
            setStep("connect");
          }}
        />
      )}
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
        <MusicPlayback
          emotion={emotion}
          genres={selectedGenre}
          spotifyUser={spotifyUser}
          onGenerateNew={() => {
            setEmotion("");
            setStep("emotion");
          }}
        />
      )}
    </div>
  );
}

export default App;
