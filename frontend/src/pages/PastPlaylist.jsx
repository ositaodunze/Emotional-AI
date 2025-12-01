import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Music,
  Heart,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Calendar,
  Play,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";

const PastPlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("feedmusic_history");
    if (stored) {
      setPlaylists(JSON.parse(stored));
    } else {
      // Mock data for demo
      setPlaylists([
        {
          name: "Happy Vibes",
          emotion: "happy",
          date: new Date(2024, 2, 15).toISOString(),
          tracks: Array(12).fill({}),
          spotify_url: "https://open.spotify.com/playlist/example1",
        },
        {
          name: "Melancholic Moments",
          emotion: "sad",
          date: new Date(2024, 2, 10).toISOString(),
          tracks: Array(15).fill({}),
          spotify_url: "https://open.spotify.com/playlist/example2",
        },
        {
          name: "Energetic Beats",
          emotion: "surprised",
          date: new Date(2024, 2, 5).toISOString(),
          tracks: Array(10).fill({}),
          spotify_url: "https://open.spotify.com/playlist/example3",
        },
      ]);
    }
  }, []);

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      happy: "😊",
      sad: "😢",
      surprised: "😲",
      angry: "😠",
      neutral: "😐",
    };
    return emojiMap[emotion] || "🎵";
  };

  const getEmotionGradient = (emotion) => {
    const gradientMap = {
      happy: "from-yellow-400 to-orange-400",
      sad: "from-blue-400 to-indigo-400",
      surprised: "from-purple-400 to-pink-400",
      angry: "from-red-400 to-orange-500",
      neutral: "from-gray-400 to-slate-400",
    };
    return gradientMap[emotion] || "from-purple-400 to-pink-400";
  };

  const handleNavigation = (path) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  return (
     <>
        <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">
              Your Listening History
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Past Playlists
            </span>
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Revisit playlists from past moods and moments
          </p>
        </div>

        {playlists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="text-3xl font-bold">{playlists.length}</span>
              </div>
              <p className="text-purple-300 text-sm">Total Playlists</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-3xl font-bold">
                  {playlists.reduce(
                    (sum, p) => sum + (p.tracks?.length || 0),
                    0
                  )}
                </span>
              </div>
              <p className="text-purple-300 text-sm">Total Tracks</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-3xl font-bold">
                  {new Set(playlists.map((p) => p.emotion)).size}
                </span>
              </div>
              <p className="text-purple-300 text-sm">Unique Moods</p>
            </div>
          </div>
        )}

        {playlists.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl mb-8">
              <FolderOpen className="w-24 h-24 mx-auto text-purple-300 mb-4 opacity-70" />
            </div>
            <h2 className="text-4xl font-bold mb-4">No playlists yet</h2>
            <p className="text-xl text-purple-300 mb-10 max-w-md mx-auto">
              Generate a playlist using emotion detection or your favorite
              artists to get started
            </p>
            <button
              onClick={() => handleNavigation("/artist")}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-lg font-bold shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5" />
              Create Your First Playlist
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((item, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:border-purple-400/50 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getEmotionGradient(
                    item.emotion
                  )} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                <div className="relative p-6">
                  {item.emotion && (
                    <div
                      className={`absolute top-6 right-6 px-3 py-1 bg-gradient-to-r ${getEmotionGradient(
                        item.emotion
                      )} rounded-full flex items-center gap-2 shadow-lg`}
                    >
                      <span className="text-xl">
                        {getEmotionEmoji(item.emotion)}
                      </span>
                      <span className="text-sm font-semibold text-white capitalize">
                        {item.emotion}
                      </span>
                    </div>
                  )}

                  <div
                    className={`inline-flex p-4 bg-gradient-to-br ${getEmotionGradient(
                      item.emotion
                    )} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <Music className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors line-clamp-1">
                    {item.name || "Untitled Playlist"}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-purple-300 mb-4">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>

                  <div className="flex items-center gap-2 mb-6 text-purple-200">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <span className="font-semibold">
                      {item.tracks?.length || 0} tracks
                    </span>
                  </div>

                  <div className="border-t border-purple-500/20 mb-4"></div>

                  <a
                    href={item.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="group/btn flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-semibold transition-all duration-200"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Listen on Spotify
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {playlists.length > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-4">Ready for a new vibe?</h3>
              <p className="text-purple-200 mb-6 max-w-md mx-auto">
                Capture your current mood and discover music that matches your
                emotions
              </p>
              <button
                onClick={() => handleNavigation("/artist")}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-lg font-bold shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                Create New Playlist
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
    </>
  );
};

export default PastPlaylists;
