import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8888";

const ArtistSelection = ({ onContinue }) => {
  const [artists, setArtists] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState([]);
  const [error, setError] = useState([]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/top-artists`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch artists");

        const data = await response.json();
        setArtists(data.artists || []);
      } catch (err) {
        console.error("Error fetching artists:", err);
        setError("Unable to load your artists.");
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const toggleSelect = (artist) => {
    const isSelected = selected.some((a) => a.id === artist.id);

    if (isSelected) {
      setSelected(selected.filter((a) => a.id !== artist.id));
    } else if (selected.length < 5) {
      setSelected([...selected, artist]);
    }
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      const artistIds = selected.map((a) => a.id);
      onContinue(artistIds);
    }
  };

  return (
    <div
      className="artist-selection w-full min-h-screen 
     bg-gradient-to-b from-purple-700 via-purple-800 to-indigo-900
     flex flex-col items-center p-6 sm:p-10 lg:p-12 pt-28"
    >
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Choose Your Sound
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 mb-6">
            Select up to{" "}
            <span className="font-bold text-purple-300">5 artists</span> that
            define your music taste
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-purple-300 font-medium">
                {selected.length} of 5 selected
              </span>
              <span className="text-sm text-purple-300 font-medium">
                {selected.length >= 5
                  ? "Complete!"
                  : `${5 - selected.length} remaining`}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300 ease-out"
                style={{ width: `${(selected.length / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Loading and Error */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent"></div>
            <p className="text-purple-200 mt-4">Loading your artists…</p>
          </div>
        )}
        {error && (
          <p className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg text-center mb-6">
            {error}
          </p>
        )}

        {/* Artist Grid - Now Much Smaller */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
            {artists.map((artist) => {
              const isSelected = selected.some((a) => a.id === artist.id);

              return (
                <div
                  key={artist.id}
                  className={`group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                    ${isSelected ? "scale-105" : ""}`}
                  onClick={() => toggleSelect(artist)}
                  style={{
                    boxShadow: isSelected
                      ? "0 0 0 3px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div className="aspect-square relative">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className={`w-full h-full object-cover transition-all duration-300
                        ${
                          isSelected
                            ? "brightness-110"
                            : "brightness-90 group-hover:brightness-100"
                        }
                      `}
                    />

                    {/* Gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300
                    ${
                      isSelected
                        ? "from-purple-600/90 via-purple-600/40 to-transparent"
                        : "from-black/70 via-black/20 to-transparent group-hover:from-purple-600/70"
                    }
                      `}
                    />

                    {/* Artist Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p
                        className={`font-bold text-xs text-white transition-all duration-300 truncate
                        ${isSelected ? "text-shadow-lg" : ""}
                      `}
                      >
                        {artist.name}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Hover Effect */}
                    {!isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                          <span className="text-xl">+</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Button */}
        {!loading && !error && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className={`group relative px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-full transition-all duration-300 transform
              ${
                selected.length > 0
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl shadow-lg"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="relative z-10">
                {selected.length === 0
                  ? "Select at least 1 artist"
                  : "Continue"}
              </span>
              {selected.length > 0 && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistSelection;
