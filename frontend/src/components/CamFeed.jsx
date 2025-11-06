import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const CamFeed = ({ onEmotionDetected }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("");
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    // Load models
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => setModelsLoaded(true));

    // Start video
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });

    return () => {
      // Cleanup on unmount: clear interval
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleVideoPlay = () => {
     if (!videoRef.current || videoRef.current.readyState < 2) {
       return;
     }
    if (!canvasRef.current.querySelector("canvas")) {
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvas.style.position = "absolute";
      canvas.style.top = 0;
      canvas.style.left = 0;
      canvasRef.current.appendChild(canvas);

      // Start detection loop
      const id = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        //filter to only 5 used in project
        const allowedEmotions = [
          "happy",
          "sad",
          "surprised",
          "angry",
          "neutral",
        ];

        const filteredExpressions = Object.entries(
          detections[0].expressions
        ).filter(([emotion]) => allowedEmotions.includes(emotion));

        const highestEmotion = filteredExpressions.reduce(
          (max, current) => (current[1] > max[1] ? current : max),
          [allowedEmotions[0], 0]
        );

        faceapi.matchDimensions(canvas, {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });

        const resized = faceapi.resizeResults(detections, {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const highestEmotion = Object.entries(expressions).reduce(
            (highest, current) => (current[1] > highest[1] ? current : highest),
            ["neutral", 0]
          );
          if (allowedEmotions.includes(highestEmotion[0])) {
            setCurrentEmotion(highestEmotion[0]);
            onEmotionDetected(highestEmotion[0]);
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
        onLoadedMetadata={modelsLoaded ? handleVideoPlay : undefined}
        width="640"
        height="480"
        className="rounded-2xl shadow-lg"
      />
      <div ref={canvasRef} className="absolute top-0" />
    </div>
  );
};

export default CamFeed;
