import React, {useEffect } from "react";
import "./App.css";
import EmotionDetection from "./components/EmotionDetection.jsx";
import MusicPlayback from "./components/MusicPlayer.jsx";
import ConnectSpotify from "./components/ConnectSpotify.jsx";
import Home from "./pages/Home.jsx";
import ArtistSelection from "./components/ArtsistSelection.jsx";
import {
  Routes,
  Route,
  useNavigate,
  useLocation
} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Profile from "./pages/Profile.jsx";
import PastPlaylists from "./pages/PastPlaylist.jsx";

function App() {
     return (
       <>
         <MainRouter />
       </>
     );
}

function MainRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const hideNavbarRoutes = ["/"];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  useEffect(() => {
    const lastPath = localStorage.getItem("last_path");
    if (window.location.pathname === "/" && lastPath && lastPath !== "/") {
      navigate(lastPath, {replace:true});}
  }, [navigate]);

  useEffect(() => {
    const handleRouteChange = () => {
      localStorage.setItem("last_path", window.location.pathname);
    };
    window.addEventListener("beforeunload", handleRouteChange);
    return () => window.removeEventListener("beforeunload", handleRouteChange);
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      {shouldShowNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/home" element={<Home />} />

        <Route path="/connect" element={<ConnectSpotify />} />

        <Route path="/artist" element={<ArtistSelection />} />

        <Route path="/emotion" element={<EmotionDetection />} />

        <Route
          path="/music"
          element={
            <MusicPlayback
              emotion={localStorage.getItem("emotion")}
              selectedArtist={JSON.parse(
                localStorage.getItem("selectedArtist") || "[]"
              )}
              spotifyUser={JSON.parse(
                localStorage.getItem("spotifyUser") || "null"
              )}
              onGenerateNew={() => navigate("/emotion")}
            />
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<PastPlaylists />} />
      </Routes>
    </div>
  );
}
export default App;
