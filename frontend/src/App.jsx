import { useState } from 'react'
import './App.css'
import CamFeed from "./components/CamFeed.jsx";

function App() {
  const [emotion, setEmotion] = useState("");

  return (
    <>
      <div className="flex flex-col items-center p-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">
          FeedMusic
        </h1>
        <CamFeed onEmotionDetected={setEmotion} />
      </div>
    </>
  );
}

export default App
