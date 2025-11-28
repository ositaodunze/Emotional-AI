import React, { useState } from "react";
import CamFeed from "./CamFeed";
import { useNavigate } from "react-router-dom";

const EmotionDetection = () => {
  const [pendingEmotion, setPendingEmotion] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeEmotion, setActiveEmotion] = useState(null);
  const navigate = useNavigate();

  // Triggered when the camera detects a new emotion
  const handleEmotionDetected = (emotion) => {
    if (emotion !== activeEmotion && !showPrompt) {
      setPendingEmotion(emotion);
      setShowPrompt(true);
    }
  };

  // User confirms detected emotion
  const handleUseDetectedEmotion = () => {
    if (!pendingEmotion) return;
    setActiveEmotion(pendingEmotion);
    setShowPrompt(false);
  };

  const handleDetectAgain = () => {
    setPendingEmotion(null);
    setShowPrompt(false);
  };

  const handleContinue = () => {
    if (activeEmotion) {
      localStorage.setItem("emotion", activeEmotion);
      navigate("/music");
    }
  };

  const emotionLabels = {
    happy: "Happiness",
    sad: "Sadness",
    angry: "Anger",
    surprised: "Surprise",
    neutral: "Neutral",
  };

  const getEmotionColor = (emotion) => {
    const colorMap = {
      happy: "from-yellow-400 to-orange-400",
      sad: "from-blue-400 to-indigo-400",
      surprised: "from-purple-400 to-pink-400",
      angry: "from-red-400 to-orange-500",
      neutral: "from-gray-400 to-slate-400",
    };
    return colorMap[emotion] || "from-purple-400 to-pink-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          FeedMusic
        </h1>
        <p className="text-lg sm:text-xl text-purple-200">
          Where your emotions and music collide
        </p>
      </div>

      <CamFeed onEmotionDetected={handleEmotionDetected} />

      {/* Confirm Emotion Prompt */}
      {showPrompt && pendingEmotion && (
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-lg border-2 border-purple-400/50 p-6 rounded-2xl shadow-xl text-center max-w-md w-full">
            <div className="flex justify-center mb-4">
              <div
                className={`bg-gradient-to-r ${getEmotionColor(
                  pendingEmotion
                )} p-4 rounded-full`}
              >
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {emotionLabels[pendingEmotion]}
            </h2>
            <p className="text-purple-200 mb-6">
              Would you like to use this emotion or detect again?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleUseDetectedEmotion}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-lg"
              >
                Use This Emotion
              </button>
              <button
                onClick={handleDetectAgain}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-white/30 transition-all"
              >
                Detect Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Click button to continue to music player*/}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!activeEmotion}
          className={`group relative px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-full transition-all duration-300 transform
              ${
                activeEmotion
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl shadow-lg"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }
            `}
        >
          <span className="relative z-10">
            {activeEmotion
              ? "Generate Your Playlist"
              : "Detect Your Emotion First"}
          </span>
          {activeEmotion && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          )}
        </button>
      </div>
    </div>
  );
};

export default EmotionDetection;
