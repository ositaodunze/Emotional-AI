import React, { useState } from "react";
import CamFeed from "./CamFeed";

const EmotionDetection = () => {
    const [pendingEmotion, setPendingEmotion] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [activeEmotion, setActiveEmotion] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    const handleEmotionDetected = (emotion) => {
        //detecting emotion
      if (emotion !== activeEmotion && !showPrompt) {
        setPendingEmotion(emotion);
        setShowPrompt(true);
      }
    };

    const handleUseDetectedEmotion = async () => {
      if (!pendingEmotion) return;
      setActiveEmotion(pendingEmotion);
      setShowPrompt(false);
      try {
        const response = await fetch("http://localhost:8000/emotion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emotion: pendingEmotion }),
        });

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Error sending emotion to backend:", error);
      }
    };
     const handleDetectAgain = () => {
    setPendingEmotion(null);
    setShowPrompt(false);
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
      <CamFeed onEmotionDetected={handleEmotionDetected} />

      {/*Confirm Emotion*/}
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

      {/* Step 5: Show active emotion and recommendations */}
      {activeEmotion && (
        <div className="mt-6 w-full max-w-md text-center">
          <h2 className="text-lg font-medium mb-2">
            Current Emotion: {emotionLabels[activeEmotion]}
          </h2>
          {recommendations.length > 0 && (
            <div className="p-4 rounded-xl shadow-lg bg-gray-100">
              <h3 className="font-semibold mb-2">Recommended Songs:</h3>
              <ul>
                {recommendations.map((song, i) => (
                  <li key={i}>
                    <a
                      href={song.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {song.name} — {song.artist}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmotionDetection;

