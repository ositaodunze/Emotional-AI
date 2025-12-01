import React from "react";
import {
  Camera,
  PenLine,
  History,
  Sparkles,
  ArrowRight,
  Music,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const PlaylistPage = () => {
    const navigate= useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    console.log(`Navigating to: ${path}`);
    // In your actual app, use: navigate(path);
  };

  const creationMethods = [
    {
      icon: <Camera className="w-12 h-12" />,
      title: "Emotion Detection",
      description:
        "Let our AI detect your mood through facial recognition and create the perfect playlist",
      emoji: "🎭",
      path: "/artist",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      primary: true,
    },
    {
      icon: <PenLine className="w-12 h-12" />,
      title: "Type Your Mood",
      description:
        "Describe how you're feeling in words and we'll craft a playlist to match",
      emoji: "✍️",
      path: "/text-mood",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
      primary: false,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">
                Personalized Music Discovery
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Create a Playlist
              </span>
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Choose your preferred method to generate a personalized playlist
              that matches your vibe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {creationMethods.map((method, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(method.path)}
                className={`group relative cursor-pointer bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:border-purple-400/50 transition-all duration-300
                ${method.primary ? "md:col-span-2" : ""}`}
              >
                {/* Background Gradient Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${method.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Content */}
                <div
                  className={`relative p-8 ${
                    method.primary ? "sm:p-12" : "sm:p-10"
                  }`}
                >
                  <div
                    className={`flex ${
                      method.primary ? "flex-col sm:flex-row" : "flex-col"
                    } items-start ${
                      method.primary ? "sm:items-center" : ""
                    } gap-6`}
                  >
                    {/* Icon */}
                    <div
                      className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${method.gradient} group-hover:scale-110 transition-transform duration-300 shadow-lg shrink-0`}
                    >
                      {method.icon}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3
                          className={`${
                            method.primary ? "text-3xl" : "text-2xl"
                          } font-bold group-hover:text-white transition-colors`}
                        >
                          {method.title}
                        </h3>
                        <span className="text-3xl">{method.emoji}</span>
                      </div>

                      <p
                        className={`text-purple-200 ${
                          method.primary ? "text-lg" : ""
                        } mb-4 group-hover:text-purple-100 transition-colors`}
                      >
                        {method.description}
                      </p>

                      <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-semibold">
                        {method.primary ? "Get started now" : "Try this method"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Badge */}
                {method.primary && (
                  <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">
                        Recommended
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-16">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-purple-300 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                or explore your history
              </span>
            </div>
          </div>

          {/* Past Playlists Link */}
          <div
            className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 hover:border-purple-400/50 transition-all duration-300 group cursor-pointer"
            onClick={() => handleNavigation("/history")}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Icon */}
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 group-hover:scale-110 transition-transform duration-300 shadow-lg shrink-0">
                <History className="w-10 h-10" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">
                  View Past Playlists
                </h3>
                <p className="text-purple-200 group-hover:text-purple-100 transition-colors">
                  Revisit your previously generated playlists and relive those
                  moments
                </p>
              </div>

              <ArrowRight className="w-6 h-6 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </div>

          <div className="h-20" />
        </div>
      </div>
    </>
  );
};

export default PlaylistPage;
