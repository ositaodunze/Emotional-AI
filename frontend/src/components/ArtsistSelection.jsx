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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex flex-col items-center p-6 text-white">
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-4">
          Choose Your Favorite Artists
        </h1>
        <p className="text-center text-gray-200 mb-6">
          Select up to <span className="font-semibold">5 artists</span> you
          enjoy the most.
        </p>

        {/* Selected Counter */}
        <div className="text-center mb-4 text-lg">
          <span className="font-bold">{selected.length}</span>/5 selected
        </div>

        {/* Selected Preview Pills */}
        {selected.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {selected.map((artist) => (
              <span
                key={artist.id}
                className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm shadow-md"
              >
                {artist.name}
              </span>
            ))}
          </div>
        )}

        {/* Loading and Error */}
        {loading && (
          <p className="text-center text-gray-300 animate-pulse mb-6">
            Loading your artists…
          </p>
        )}
        {error && <p className="text-center text-red-300 mb-6">{error}</p>}

        {/* Artist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {artists.map((artist) => {
            const isSelected = selected.some((a) => a.id === artist.id);

            return (
              <div
                key={artist.id}
                className={`relative cursor-pointer rounded-xl overflow-hidden shadow-lg transform transition-all hover:scale-105
                  ${isSelected ? "ring-4 ring-green-400" : "ring-0"}`}
                onClick={() => toggleSelect(artist)}
              >
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-40 object-cover"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                  <p className="font-semibold text-sm">{artist.name}</p>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-green-400 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className={`px-6 py-2 text-lg rounded-full font-semibold transition 
              ${
                selected.length > 0
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-400 cursor-not-allowed text-gray-700"
              }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistSelection;
