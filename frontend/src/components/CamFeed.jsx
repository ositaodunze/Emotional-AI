import React, { useEffect, useRef, useState } from "react";

const emotionLabels = {
  happy: "Happiness",
  sad: "Sadness",
  angry: "Anger",
  surprised: "Surprise",
  neutral: "Neutral",
};
const allowedEmotions = ["happy", "sad", "surprised", "angry", "neutral"];

export default function CamFeed({ onEmotionDetected }) {
  const videoRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceapi, setFaceapi] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState("");
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) Dynamically import so build/SSR doesn't choke
      const mod = await import("@vladmandic/face-api");
      if (!mounted) return;
      setFaceapi(mod);

      // 2) Load models served from /public/models
      await Promise.all([
        mod.nets.tinyFaceDetector.loadFromUri("/models"),
        mod.nets.faceLandmark68Net.loadFromUri("/models"),
        mod.nets.faceRecognitionNet.loadFromUri("/models"),
        mod.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
      if (!mounted) return;
      setModelsLoaded(true);

      // 3) Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    })();

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // eslint-disable-line

  const handleVideoPlay = () => {
    if (!faceapi || !modelsLoaded || !videoRef.current || !canvasWrapRef.current) return;

    // Create overlay canvas once
    if (!canvasWrapRef.current.querySelector("canvas")) {
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvas.style.position = "absolute";
      canvas.style.top = 0;
      canvas.style.left = 0;
      canvasWrapRef.current.appendChild(canvas);

      const id = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        // Resize & clear
        faceapi.matchDimensions(canvas, {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });
        const resized = faceapi.resizeResults(detections, {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw overlays
        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);

        // Emotion pick (restricted set)
        if (detections.length > 0 && detections[0].expressions) {
          const filtered = Object.entries(detections[0].expressions)
            .filter(([k]) => allowedEmotions.includes(k));
          const top = filtered.reduce(
            (best, cur) => (cur[1] > best[1] ? cur : best),
            [allowedEmotions[0], 0]
          );
          if (top && allowedEmotions.includes(top[0])) {
            setCurrentEmotion(top[0]);
            onEmotionDetected?.(top[0]);
          }
        }
      }, 500);

      setIntervalId(id);
    }
  };

  return (
    <div className="relative flex justify-center">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={modelsLoaded ? handleVideoPlay : undefined}
        width="640"
        height="480"
        className="rounded-2xl shadow-lg"
      />
      <div ref={canvasWrapRef} className="absolute top-0 left-0" />
      {currentEmotion && (
        <h2>Current Emotion: {emotionLabels[currentEmotion]}</h2>
      )}
    </div>
  );
}
