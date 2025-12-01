import React, { useState, useEffect, useRef } from "react";

const Chatbot = ({ emotion = null, onPlaylistGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState(null);
  const [currentVoice, setCurrentVoice] = useState("rachel");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());

  const BACKEND_URL = "http://127.0.0.1:8888";
  const USE_ELEVENLABS = true;

  // Emotion colors
  const emotionColors = {
    sad: { from: "#3B82F6", to: "#1D4ED8" },
    happy: { from: "#FBBF24", to: "#F59E0B" },
    angry: { from: "#EF4444", to: "#DC2626" },
    anxious: { from: "#A78BFA", to: "#7C3AED" },
    neutral: { from: "#6B7280", to: "#4B5563" },
    surprised: { from: "#F59E0B", to: "#D97706" },
    fearful: { from: "#C084FC", to: "#A855F7" },
    disgusted: { from: "#34D399", to: "#10B981" }
  };

  const currentColor = emotionColors[emotion?.toLowerCase()] || emotionColors.neutral;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch voices
  useEffect(() => {
    if (USE_ELEVENLABS) {
      fetch(`${BACKEND_URL}/api/voices`)
        .then(res => res.json())
        .then(voices => setAvailableVoices(voices))
        .catch(err => console.error("Failed to fetch voices:", err));
    }
  }, []);

  // Auto-greet
  useEffect(() => {
    if (emotion && !hasGreeted) {
      setTimeout(() => {
        setIsOpen(true);
        setHasGreeted(true);
        
        const greeting = {
          role: "assistant",
          content: `Hey! I can sense you're feeling ${emotion}. Want to talk or need some music? 🎵`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages([greeting]);
        speakText(greeting.content);
      }, 1000);
    }
  }, [emotion, hasGreeted]);

  // Speech synthesis
  const speakText = async (text) => {
    if (!text) return;
    
    if (USE_ELEVENLABS) {
      try {
        setIsSpeaking(true);
        const response = await fetch(`${BACKEND_URL}/api/text-to-speech`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
          await audioRef.current.play();
        } else {
          setIsSpeaking(false);
        }
      } catch (error) {
        console.error("Speech error:", error);
        setIsSpeaking(false);
      }
    }
  };

  // Speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setVoiceTranscript("");
            handleSendMessage(transcript);
          } else {
            setVoiceTranscript(transcript);
          }
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setVoiceTranscript("");
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        setIsListening(false);
      }
    }
  };

  const handleVoiceChange = async (voiceName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/change-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voiceName })
      });
      
      const data = await response.json();
      if (data.success) {
        setCurrentVoice(voiceName);
        setShowVoiceMenu(false);
      }
    } catch (error) {
      console.error("Voice change failed:", error);
    }
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    const userMsg = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          conversation_history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          })),
          language: "en",
          detected_emotion: emotion
        })
      });

      const data = await response.json();

      const assistantMsg = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      await speakText(data.response);

      if (data.playlist?.length > 0 && onPlaylistGenerated) {
        onPlaylistGenerated(data.playlist);
        
        const updateMsg = {
          role: "assistant",
          content: `🎵 Updated your playlist with ${data.playlist.length} tracks!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, updateMsg]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentColor.from}, ${currentColor.to})`,
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'transform 0.2s',
            zIndex: 1000
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isSpeaking ? '🎤' : '💬'}
        </button>
      )}

      {/* Chat Window - iMessage Style */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          height: '600px',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000
        }}>
          
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${currentColor.from}, ${currentColor.to})`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🎧
              </div>
              <div>
                <div style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px'
                }}>DJ Vibe</div>
                <div style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isSpeaking && (
                    <>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#4ADE80',
                        animation: 'pulse 1.5s infinite'
                      }}></div>
                      <span>Speaking...</span>
                    </>
                  )}
                  {isListening && (
                    <>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        animation: 'pulse 1.5s infinite'
                      }}></div>
                      <span>Listening...</span>
                    </>
                  )}
                  {!isSpeaking && !isListening && 'Online'}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Voice Menu */}
              {availableVoices && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  </button>
                  
                  {showVoiceMenu && (
                    <div style={{
                      position: 'absolute',
                      top: '40px',
                      right: '0',
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      padding: '8px',
                      minWidth: '200px',
                      zIndex: 1001
                    }}>
                      {Object.entries(availableVoices).map(([key, voice]) => (
                        <button
                          key={key}
                          onClick={() => handleVoiceChange(key)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: currentVoice === key ? '#F3F4F6' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            fontFamily: 'inherit'
                          }}
                        >
                          <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                            {voice.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                            {voice.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages - iMessage Style */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#F9FAFB',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  background: msg.role === 'user' ? '#007AFF' : '#E5E7EB',
                  color: msg.role === 'user' ? 'white' : '#111827',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {msg.content}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  marginTop: '4px',
                  paddingLeft: msg.role === 'user' ? '0' : '4px',
                  paddingRight: msg.role === 'user' ? '4px' : '0'
                }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px',
                  background: '#E5E7EB',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#9CA3AF',
                    animation: 'bounce 1.4s infinite ease-in-out'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#9CA3AF',
                    animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#9CA3AF',
                    animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                  }}></div>
                </div>
              </div>
            )}

            {voiceTranscript && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  background: 'rgba(0,122,255,0.1)',
                  border: '1px solid rgba(0,122,255,0.3)',
                  color: '#007AFF',
                  fontSize: '15px',
                  fontStyle: 'italic'
                }}>
                  {voiceTranscript}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - iMessage Style */}
          <div style={{
            padding: '12px 16px',
            background: 'white',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {/* Voice Button */}
            <button
              onClick={toggleVoiceInput}
              disabled={isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isListening ? '#EF4444' : '#F3F4F6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
            >
              <svg width="20" height="20" fill={isListening ? 'white' : '#6B7280'} viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message DJ Vibe..."
              disabled={isLoading || isListening}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                fontSize: '15px',
                outline: 'none',
                fontFamily: 'inherit',
                color: '#111827'  // ✅ FIXED: Dark text color for visibility
              }}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: inputValue.trim() ? '#007AFF' : '#E5E7EB',
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
};

export default Chatbot;