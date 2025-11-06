import React, { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8888";

// Icon components
const PlayIcon = () => (
  <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
  </svg>
);

const SkipIcon = () => (
  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 4l10 8-10 8V4zm11 0h3v16h-3V4z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" fill="none" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SpotifyIcon = () => (
  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const MusicPlayer = ({ emotion, onGenerateNew }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spotifyEmbed, setSpotifyEmbed] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const emotionData = {
    happy: { 
      label: "Happy", 
      emoji: "😊",
      description: "Uplifting vibes to amplify your joy",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    sad: { 
      label: "Sad", 
      emoji: "😢",
      description: "Gentle melodies for reflection",
      gradient: "linear-gradient(135deg, #667eea 0%, #4c51bf 100%)"
    },
    angry: { 
      label: "Angry", 
      emoji: "😠",
      description: "Intense beats to match your energy",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    surprised: { 
      label: "Surprised", 
      emoji: "😮",
      description: "Dynamic tracks for unexpected moments",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    neutral: { 
      label: "Neutral", 
      emoji: "😐",
      description: "Balanced tunes for a calm state of mind",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
  };

  const currentEmotion = emotionData[emotion] || emotionData.neutral;

  useEffect(() => {
    if (!emotion) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      setRecommendations([]);

      try {
        const response = await fetch(`${BACKEND_URL}/api/recommendation`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotion }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const tracks = data.recommendations || [];
        setRecommendations(tracks);

        if (tracks.length > 0) {
          const firstTrack = tracks[0];
          setCurrentTrack(firstTrack);
          const firstUri = firstTrack.uri;

          await fetch(`${BACKEND_URL}/api/play`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [firstUri] }),
            credentials: "include",
          });

          const trackId = firstUri.split(":")[2];
          setSpotifyEmbed(`https://open.spotify.com/embed/track/${trackId}`);
          setIsPlaying(true);
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

  const playTrack = (track) => {
    setCurrentTrack(track);
    const trackId = track.uri.split(":")[2];
    setSpotifyEmbed(`https://open.spotify.com/embed/track/${trackId}`);
    setIsPlaying(true);
  };

  const handleSavePlaylist = () => {
    const name = playlistName || `${currentEmotion.label} Mix`;
    console.log("Saving playlist:", name, recommendations.map(r => r.uri));
    alert(`Playlist "${name}" saved with ${recommendations.length} tracks!`);
  };

  // Format duration (mock data for now)
  const formatDuration = (index) => {
    const durations = ["3:45", "4:12", "3:28", "3:56", "4:33"];
    return durations[index % durations.length];
  };

  useEffect(() => {
    const originalStyle = document.body.style.cssText;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.cssText = originalStyle;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #1a1a2e 0%, #0f0f1e 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Hero Section */}
      <div style={{
        background: currentEmotion.gradient,
        padding: '30px 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
          zIndex: 1
        }}></div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '12px',
            filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.3))'
          }}>{currentEmotion.emoji}</div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '900',
            marginBottom: '8px',
            letterSpacing: '-1px'
          }}>You're Feeling {currentEmotion.label}</h1>
          <p style={{
            fontSize: '16px',
            opacity: 0.9,
            fontWeight: '400'
          }}>{currentEmotion.description}</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '30px',
        gap: '30px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        minHeight: 0
      }}>
        {/* Player Section */}
        <div style={{
          flex: '0 0 420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {spotifyEmbed ? (
                <iframe
                  src={spotifyEmbed}
                  width="100%"
                  height="100%"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ border: 'none', borderRadius: '12px' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <PlayIcon />
                  <p style={{ marginTop: '20px', opacity: 0.6 }}>Select a track to play</p>
                </div>
              )}
            </div>

            {currentTrack && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>{currentTrack.name}</div>
                  <div style={{
                    fontSize: '16px',
                    opacity: 0.7
                  }}>{currentTrack.artist}</div>
                </div>

                <div style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    height: '100%',
                    background: '#1db954',
                    width: '30%',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.6, marginBottom: '20px' }}>
                  <span>1:23</span>
                  <span>3:45</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  marginBottom: '24px'
                }}>
                  <button style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}>
                    <svg style={{ width: '20px', height: '20px', transform: 'rotate(180deg)' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 4l10 8-10 8V4zm11 0h3v16h-3V4z"/>
                    </svg>
                  </button>
                  <button 
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#1db954',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s, background 0.2s',
                      color: 'white'
                    }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}>
                    <SkipIcon />
                  </button>
                </div>
              </>
            )}

            <input
              type="text"
              placeholder="Name your playlist..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={handleSavePlaylist}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'transform 0.2s, background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#1db954',
                  color: 'white'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SpotifyIcon />
                Save to Spotify
              </button>
              <button 
                onClick={onGenerateNew}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '100px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'transform 0.2s, background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'transparent',
                  color: 'white'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <RefreshIcon />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tracks Section - FIXED SCROLLING */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '24px', flexShrink: 0 }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '8px'
            }}>Recommended for You</h2>
            <p style={{ opacity: 0.6 }}>Based on your {emotion} mood</p>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '20px',
            minHeight: 0
          }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(29,185,84,0.3)',
                  borderTopColor: '#1db954',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ opacity: 0.6 }}>Finding perfect tracks...</p>
              </div>
            )}

            {!loading && recommendations.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingBottom: '40px'
              }}>
                {recommendations.map((track, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'background 0.2s',
                      border: '1px solid transparent'
                    }}
                    onClick={() => playTrack(track)}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(29,185,84,0.5)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      opacity: 0.5,
                      width: '20px'
                    }}>{index + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>{track.name}</div>
                      <div style={{
                        fontSize: '14px',
                        opacity: 0.6
                      }}>{track.artist}</div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      opacity: 0.6
                    }}>{formatDuration(index)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;