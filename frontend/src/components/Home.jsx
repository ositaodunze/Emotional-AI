import React from "react";
import "./home.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const Home = ({onAuth}) => {
  return (
    <div className="home-container home-active">
      <div className="music-notes">
        <span>♪</span>
        <span>♫</span>
        <span>♬</span>
        <span>♩</span>
      </div>

      <nav className="navbar">
        <h1 className="hero-title">Feed Music</h1>

        <div className="hero-btns">
          <button id="AuthButton" onClick={onAuth} className="nav-btn auth-btn">
            Connect Spotify
          </button>
          <button className="nav-btn login-btn">Login / Signup</button>
        </div>
      </nav>

      <header className="hero-header">
        <p className="hero-tagline">Where your emotions and music collide.</p>
      </header>

      <section className="features-section">
        <h2 className="section-title">How Feed Music Works</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Detect Your Mood</h3>
            <p>
              Face detection + emotion classification (Happy, Sad, Neutral,
              Angry, Surprised) using Emotion AI.
            </p>
          </div>

          <div className="feature-card">
            <h3>Learn Your Musical Taste</h3>
            <p>
              FeedMusic analyzes your top artists, genres, and audio features
              from Spotify to build your personal music profile.
            </p>
          </div>

          <div className="feature-card">
            <h3>Generate the Perfect Playlist</h3>
            <p>
              Every playlist adapts to your feelings — and improves with your
              feedback to get smarter over time.
            </p>
          </div>
        </div>
      </section>
      <footer className="footer">
        <p className="github">Github placeholder</p>
        <p className="copyright">FeedMusic ©2025</p>
      </footer>
    </div>
  );
};

export default Home;
