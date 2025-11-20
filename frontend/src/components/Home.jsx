import React, { useRef, useEffect } from "react";
import "./home.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const Home = ({ onLoginClick, onSignUpClick }) => {
  const videoRef = useRef(null);

  // Optional: show webcam behind the frame (can keep or remove)
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Webcam error:", err));
  }, []);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Feed Music AI</h1>
        <p className="home-tagline">✨ Welcome to the Future of Music</p>
        <p className="home-subtitle">
          Experience AI-powered music with facial recognition
        </p>

        {/* CAMERA / FRAME AREA */}
        <div className="frame-wrapper">
          {/* video is optional; if camera blocked it will just show the glow card */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="frame-video"
          />
          <div className="frame-glow">
            <div className="frame-inner">
              <span className="frame-smiley">😊</span>
              <p className="frame-caption">Position your face in the frame</p>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="home-buttons">
          <button className="btn primary" onClick={onLoginClick}>
            Login
          </button>
          <button className="btn secondary" onClick={onSignUpClick}>
            Sign Up
          </button>
        </div>

        <p className="home-footer">
          By continuing, you agree to our Terms of Service and acknowledge our
          Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Home;
