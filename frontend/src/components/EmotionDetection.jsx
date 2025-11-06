import React, { useState } from "react";
import CamFeed from "./CamFeed";

const EmotionDetection = ({onEmotionDetected}) => {
  const [pendingEmotion, setPendingEmotion] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeEmotion, setActiveEmotion] = useState(null);

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

  const handleContinue= () => {
    if (activeEmotion){
      onEmotionDetected(activeEmotion);
    }
  };

  const emotionLabels = {
    happy: "Happiness",
    sad: "Sadness",
    angry: "Anger",
    surprised: "Surprise",
    neutral: "Neutral",
  };

  return (
    <div className="flex flex-col items-center">
      <h1>FeedMusic</h1>
      <p>Where your emotions and music collide</p>
      <CamFeed onEmotionDetected={handleEmotionDetected} />

      {/* Confirm Emotion Prompt */}
      {showPrompt && pendingEmotion && (
        <div className="mt-4 p-4 bg-white rounded-xl shadow-lg border text-center">
          <h2 className="text-xl font-semibold mb-2">
            Detected Emotion: {emotionLabels[pendingEmotion] || pendingEmotion}
          </h2>
          <p className="mb-4">
            Would you like to use this emotion or detect again?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleUseDetectedEmotion}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Use Detected Emotion
            </button>
            <button
              onClick={handleDetectAgain}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Detect Again
            </button>
          </div>
        </div>
      )}

      {/*Click button to continue to music player*/}
      <button
        onClick={handleContinue}
        disabled={!activeEmotion}
        className={`mt-6 px-6 py-2 rounded-full text-white font-semibold ${
          activeEmotion
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Generate your playlist.
      </button>
    </div>
  );
};

export default EmotionDetection;
