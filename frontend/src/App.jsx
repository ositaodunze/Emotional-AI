import React, { useState, useEffect } from "react";
import "./App.css";
import EmotionDetection from "./components/EmotionDetection.jsx";
import MusicPlayback from "./components/MusicPlayer.jsx";
import ConnectSpotify from "./components/ConnectSpotify.jsx";
import Home from "./components/home.jsx";
import ArtistSelection from "./components/ArtsistSelection.jsx";

function App() {
  const [emotion, setEmotion] = useState("");
  const [spotifyUser, setSpotifyUser] = useState([null]);
  const [step, setStep] = useState("home");
  const [selectedArtist, setSelectedArtist] = useState([]);


  useEffect(() => {
    const root = document.getElementById("root");
    const body = document.body;
    if (step === "home") {
      root?.classList.add("home-active");
      body?.classList.add("home-active");
    } else {
      root?.classList.remove("home-active");
      body?.classList.remove("home-active");

      body.style.background = "transparent";
      root.style.background = "transparent";
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-transparent">
      {step === "home" && (
        <Home
          onAuth={() => {
            setStep("connect");
          }}
        />
      )}
      {step === "connect" && (
        <ConnectSpotify
          onContinue={(user) => {
            setSpotifyUser(user);
            setStep("artist");
          }}
        />
      )}

      {step === "artist" && (
        <ArtistSelection
          onContinue={(artist) => {
            setSelectedArtist(artist);
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
          selectedArtist={selectedArtist}
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
