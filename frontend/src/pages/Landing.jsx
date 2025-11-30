import React from "react";
import "./home.css";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      navigate("/home");
    }
  }, []);

  const guest = localStorage.getItem("guest");
  const spotifyConnected = localStorage.getItem("spotifyConnected");
  if (guest === "true" && spotifyConnected === "true") {
    navigate("/emotion");
  }

  const handleAuth = () => {
    localStorage.setItem("guest", "true");
    navigate("/connect");
  };

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
          <button
            id="AuthButton"
            onClick={handleAuth}
            className="nav-btn auth-btn"
          >
            Connect Spotify
          </button>
          <button
            className="nav-btn login-btn"
            onClick={() => navigate("/login")}
          >
            Login / Signup
          </button>
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
        <a
          href="https://github.com/ositaodunze/Emotional-AI"
          target="blank"
          rel="noopener noreferrer"
          className="github-icon"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "white",
          }}
        >
          <svg
            height="28"
            width="28"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            class="bi bi-github"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"></path>
          </svg>
        </a>

        <p className="copyright">FeedMusic ©2025</p>
      </footer>
    </div>
  );
};

export default Landing;
