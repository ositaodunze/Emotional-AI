import React from "react";
import "./home.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const Home = ({onAuth}) => {
  return (
    <div className="home-container">
      <nav>
        <ul className="topnav">
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </nav>

      <header>
        <h1 id="myH1">
          <b>Welcome to Feed Music AI</b>
        </h1>
      </header>

      <main>
        <p id="myP">Where your emotions and music collide</p>
        <button
          id="AuthButton"
          type="button"
          onClick={onAuth}
          className="auth-btn"
        >
          Go to your Spotify!
        </button>
      </main>
    </div>
  );
};

export default Home;
