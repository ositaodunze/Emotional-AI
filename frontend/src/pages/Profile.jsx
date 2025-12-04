import React, { useEffect, useState } from "react";
import {
  Music,
  User,
  Settings,
  LogOut,
  XCircle,
  CheckCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { supabase } from "../lib/supabase";

const ALL_GENRES = [
  "Pop",
  "Hip-Hop",
  "R&B",
  "Afrobeats",
  "Electronic",
  "Indie",
  "Rock",
  "Reggae",
  "Dancehall",
  "K-Pop",
  "Latin",
  "Jazz",
];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const navigate = useNavigate();


  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("Auth error:", authErrorError);
          return;
        }
      const userId = authData.user?.id;
      if (!userId) return;
    
      const {  data: prefData, error: prefError  } = await supabase
        .from("user_preferences")
        .select("genres,favorite_artists")
        .eq("id", userId)
      if (prefError) {
        console.error("Preference fetching error:", prefError);
        return;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("fname, lname, username")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        return;
      }

      const merged = {
        ...profileData,
        genres: prefData?.genres || [],
        artists: prefData?.favorite_artist || [],
      };

      setUser(merged);
      setSpotifyConnected(merged.spotifyConnected || false);
      setUsername(merged.username || "");
      setGenres(merged.genres || []);
      setArtists((merged.artists || []).join(", "));
    };
    loadData();
    }, []);

  useEffect(() => {
    if (user) {
      const currentArtists = artists
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const originalArtists = user.artists || [];
      const changed =
        username !== user.username ||
        JSON.stringify([...genres].sort()) !==
          JSON.stringify([...(user.genres || [])].sort()) ||
        JSON.stringify(currentArtists.sort()) !==
          JSON.stringify(originalArtists.sort());
      setHasChanges(changed);
    }
  }, [username, genres, artists, user]);

  const toggleGenre = (genre) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = async () => {
    const artistList = artists
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a !== "");

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;
    const { error:profileError } = await supabase
      .from("profiles")
      .update({username})
      .eq("id", userId);

    if (profileError) {
      console.error("Save failed:", profileError);
      return;
    }
    const { error: prefError } = await supabase
      .from("user_preferences")
      .update({
        genres,
        favorite_artists: artistList,
      })
      .eq("id", userId);

    if (prefError) {
      console.error("Preferences update failed:", prefError);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setUser({
      ...user,
      username,
      genres,
      artists: artistList,
    });
    setHasChanges(false);
  };

  const handleDisconnectSpotify = () => {
    alert("Spotify disconnected");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">
                Personalize Your Experience
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Your Profile
              </span>
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Customize your music preferences to get better recommendations
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl mb-8">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Profile Information</h2>
              </div>

              <div className="mb-6">
                <label className="block text-purple-300 font-semibold mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Username
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-700/50 text-white text-lg p-4 rounded-xl border-2 border-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 hover:border-purple-500/40"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="border-t border-purple-500/20 mb-10"></div>

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Music className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Music Preferences</h2>
              </div>

              <div className="mb-8">
                <label className="block text-purple-300 font-semibold mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  Favorite Genres
                  <span className="ml-auto text-sm text-purple-400">
                    ({genres.length} selected)
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {ALL_GENRES.map((genre) => {
                    const isSelected = genres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`relative px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 transform hover:scale-105
                        ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white shadow-lg"
                            : "bg-slate-700/30 border-slate-600/50 text-purple-200 hover:bg-slate-700/50 hover:border-slate-500"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 absolute top-1 right-1" />
                        )}
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  Favorite Artists
                </label>
                <textarea
                  placeholder="Separate with commas (e.g., Taylor Swift, The Weeknd, Billie Eilish)"
                  className="w-full bg-slate-700/50 text-white text-lg p-4 rounded-xl border-2 border-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 hover:border-purple-500/40 resize-none"
                  value={artists}
                  onChange={(e) => setArtists(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-purple-300 mt-2">
                  {artists.split(",").filter((a) => a.trim()).length} artist(s)
                  listed
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-purple-500/20">
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all duration-300 transform
                ${
                  hasChanges
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                    : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                }
                ${saved ? "bg-gradient-to-r from-green-500 to-emerald-500" : ""}
              `}
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Changes Saved!
                  </>
                ) : (
                  <>
                    <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    {hasChanges ? "Save Changes" : "No Changes to Save"}
                    {hasChanges && (
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleDisconnectSpotify}
              className="group flex items-center justify-center gap-3 px-6 py-4 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl hover:border-purple-500/50 hover:bg-slate-800/70 transition-all duration-200"
            >
              <XCircle className="w-5 h-5 text-purple-300 group-hover:text-purple-200" />
              <span className="font-semibold text-purple-200 group-hover:text-white">
                Disconnect Spotify
              </span>
            </button>
            {!spotifyConnected && (
              <button
                onClick={() => navigate("/connect")}
                className="group flex items-center justify-center gap-3 px-6 py-4 bg-green-600/30 backdrop-blur-sm border border-green-500/40 rounded-2xl hover:bg-green-600/50 hover:border-green-500/70 transition-all duration-200"
              >
                <Music className="w-5 h-5 text-green-300 group-hover:text-green-200" />
                <span className="font-semibold text-green-200 group-hover:text-white">
                  Connect Spotify
                </span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="group flex items-center justify-center gap-3 px-6 py-4 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-2xl hover:bg-red-600/40 hover:border-red-500/50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 text-red-300 group-hover:text-red-200" />
              <span className="font-semibold text-red-200 group-hover:text-white">
                Logout
              </span>
            </button>
          </div>

          {/* Bottom Spacing */}
          <div className="h-20" />
        </div>
      </div>
    </>
  );
};

export default Profile;
