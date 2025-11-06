import React, { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8888";
const MusicPlayback = ({ emotion, onGenerateNew }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spotifyEmbed, setSpotifyEmbed] = useState(null);

  // Emotion display labels
  const emotionLabels = {
    happy: "Happiness",
    sad: "Sadness",
    angry: "Anger",
    surprised: "Surprise",
    neutral: "Neutral",
  };

  // Fetch recommendations from FastAPI
  useEffect(() => {
    if (!emotion) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      setRecommendations([]);

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/recommendation`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emotion }),
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const tracks = data.recommendations || [];
        setRecommendations(tracks);

        if (tracks.length > 0) {
          // Auto-play the first track
          const firstTrack = tracks[0];
          const firstUri = firstTrack.uri;

          await fetch(`${BACKEND_URL}/api/play`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [firstUri] }),
            credentials: "include",
          });

          // Embed Spotify player for that track
          const trackId = firstUri.split(":")[2];
          setSpotifyEmbed(`https://open.spotify.com/embed/track/${trackId}`);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [emotion]);

  // Select or deselect a song
  const toggleSelectTrack = (uri) => {
    setSelectedTracks((prev) =>
      prev.includes(uri) ? prev.filter((id) => id !== uri) : [...prev, uri]
    );
  };

  // Save playlist (placeholder – integrate later with Spotify API)
  const handleSavePlaylist = () => {
    if (!playlistName.trim()) {
      alert("Please enter a playlist name.");
      return;
    }

    if (selectedTracks.length === 0) {
      alert("Please select at least one song.");
      return;
    }

    console.log("Saving playlist:", playlistName, selectedTracks);
    alert(`Playlist "${playlistName}" saved successfully!`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* LEFT SECTION – Playlist builder */}
      <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-300">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Emotion: {emotionLabels[emotion] || emotion}
        </h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter playlist name..."
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleSavePlaylist}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
          >
            Save Playlist
          </button>
        </div>

        {loading && (
          <p className="text-gray-500 italic">Fetching recommendations...</p>
        )}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && recommendations.length > 0 && (
          <ul className="space-y-3 mt-4">
            {recommendations.map((song, i) => (
              <li
                key={i}
                onClick={() => toggleSelectTrack(song.uri)}
                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
                  selectedTracks.includes(song.uri)
                    ? "bg-green-100 border-l-4 border-green-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className="font-semibold">{song.name}</p>
                  <p className="text-sm text-gray-500">{song.artist}</p>
                </div>
                <a
                  href={song.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-sm"
                >
                  Open
                </a>
              </li>
            ))}
          </ul>
        )}

        {!loading && recommendations.length === 0 && !error && (
          <p className="text-gray-500 mt-3">No songs found for this emotion.</p>
        )}

        {/* Generating new playlist*/}
        {!loading && recommendations.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onGenerateNew}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-md transition"
              >Generate Another Playlist</button>
          </div>
        )}
      </div>

      {/* RIGHT SECTION – Spotify embedded player */}
      <div className="w-full md:w-1/2 p-6 flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Spotify Playback
        </h2>

        {spotifyEmbed ? (
          <iframe
            src={spotifyEmbed}
            width="100%"
            height="380"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl shadow-lg"
          ></iframe>
        ) : (
          <p className="text-gray-500">No song is currently playing.</p>
        )}
      </div>
    </div>
  );
};

export default MusicPlayback;
