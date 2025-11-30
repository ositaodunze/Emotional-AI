import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";

const Navbar = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    
  };

  const handleDisconnectSpotify = () => {
    setProfileOpen(false);
    alert("Disconnect Spotify clicked");
  };

  const handleLogout = () => {
    setProfileOpen(false);
    alert("Logout clicked");
  };

  return (
    <nav className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 px-4 sm:px-8 py-4 shadow-lg border-b border-purple-500/20">
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleNavigation("/")}
          className="flex items-center gap-2 group"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <svg
              className="w-5 h-5 text-white"
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
          </div>
          <span className="text-white text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            FeedMusic
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => handleNavigation("/home")}
            className="px-4 py-2 text-white text-lg hover:text-purple-300 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            Home
          </button>
          <button
            onClick={() => handleNavigation("/playlist")}
            className="px-4 py-2 text-white text-lg hover:text-purple-300 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            Playlist
          </button>
          <button
            onClick={() => handleNavigation("/history")}
            className="px-4 py-2 text-white text-lg hover:text-purple-300 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            Past Playlists
          </button>

          {/* Profile Dropdown */}
          <div className="relative ml-4">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 text-white bg-white/10 px-5 py-2 rounded-full hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              Profile{" "}
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {profileOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-lg border border-purple-500/30 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      handleNavigation("/profile");
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-5 py-3 text-white hover:bg-purple-600/30 transition-all duration-200 flex items-center gap-3"
                  >
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
                    Edit Profile
                  </button>
                  <div className="my-1 border-t border-purple-500/20" />
                  <button
                    onClick={handleDisconnectSpotify}
                    className="w-full text-left px-5 py-3 text-white hover:bg-purple-600/30 transition-all duration-200 flex items-center gap-3"
                  >
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Disconnect Spotify
                  </button>
                  <div className="my-1 border-t border-purple-500/20" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3 text-red-300 hover:bg-red-600/30 transition-all duration-200 flex items-center gap-3"
                  >
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-purple-500/20">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleNavigation("/")}
              className="px-4 py-3 text-white text-left hover:bg-white/10 rounded-lg transition-all"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation("/playlist")}
              className="px-4 py-3 text-white text-left hover:bg-white/10 rounded-lg transition-all"
            >
              Playlist
            </button>
            <button
              onClick={() => handleNavigation("/history")}
              className="px-4 py-3 text-white text-left hover:bg-white/10 rounded-lg transition-all"
            >
              Past Playlists
            </button>
            <div className="my-2 border-t border-purple-500/20" />
            <button
              onClick={() => {
                handleNavigation("/profile");
                setMobileMenuOpen(false);
              }}
              className="px-4 py-3 text-white text-left hover:bg-white/10 rounded-lg transition-all flex items-center gap-3"
            >
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
              Edit Profile
            </button>
            <button
              onClick={() => {
                handleDisconnectSpotify();
                setMobileMenuOpen(false);
              }}
              className="px-4 py-3 text-white text-left hover:bg-white/10 rounded-lg transition-all flex items-center gap-3"
            >
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Disconnect Spotify
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="px-4 py-3 text-red-300 text-left hover:bg-red-600/30 rounded-lg transition-all flex items-center gap-3"
            >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
