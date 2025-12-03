import React, { useEffect } from "react";
import "./home.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const Home = ({ onAuth }) => {
  useEffect(() => {
    document.body.classList.add("home-active");
    document.getElementById("root").classList.add("home-active");

    return () => {
      document.body.classList.remove("home-active");
      document.getElementById("root").classList.remove("home-active");
    };
  }, []);

  return (
    <div className="home-container">
      <header>
        <h1 id="myH1"><b>Welcome to Feed Music AI</b></h1>
      </header>

      <main>
        <p id="myP">Where your emotions and music collide</p>
        <button
          id="AuthButton"
          type="button"
          onClick={onAuth}
          className="auth-btn"
        >
          Log into Spotify
        </button>
      </main>
    </div>
  );
};

export default Home;

