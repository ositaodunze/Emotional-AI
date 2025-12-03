import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Music,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8888";

const PostConnectCheck = () => {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/spotify/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          handleNavigation("/connect");
          return;
        }
        const data = await res.json();
        const product = data.product;

        if (product === "premium") {
          setIsPremium(true);
          setTimeout(() => handleNavigation("/home"), 1500);
        } else {
          setIsPremium(false);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        handleNavigation("/connect");
      }
    };
    verify();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full">
              <Music className="w-16 h-16 text-white animate-bounce" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Connecting to Spotify
          </h2>

          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent"></div>
          </div>

          <p className="text-purple-200">Verifying your account...</p>
        </div>
      </div>
    );
  }


  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-50"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-full">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
            Connected Successfully!
          </h2>
          <p className="text-xl text-purple-200">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-2xl opacity-50"></div>
          <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-full">
            <AlertCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-orange-300 font-medium">
            Premium Account Required
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center">
          <span className="bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
            Spotify Premium Required
          </span>
        </h1>

        <div className="w-full bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Why Premium?</h3>
              <p className="text-purple-200 leading-relaxed">
                FeedMusic uses Spotify's advanced playback API to create and
                control your personalized playlists. This feature requires a
                Spotify Premium account to function properly.
              </p>
            </div>
          </div>

          <div className="space-y-3 pl-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-purple-200">
                Full playlist control and playback
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-purple-200">High-quality audio streaming</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-purple-200">
                Seamless emotion-based music discovery
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => handleNavigation("/connect")}
            className="group flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Connect
          </button>

          <a
            href="https://www.spotify.com/premium/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 border border-purple-500/30 hover:bg-white/20 hover:border-purple-500/50 rounded-full font-bold text-lg transition-all duration-300"
          >
            Get Premium
            <Sparkles className="w-5 h-5" />
          </a>
        </div>

        <p className="text-sm text-purple-300 mt-8 text-center max-w-md">
          Already have Premium? Try reconnecting with your Premium account
          credentials.
        </p>
      </div>
    </div>
  );
};

export default PostConnectCheck;
