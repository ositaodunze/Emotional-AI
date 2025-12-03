import React, { useEffect, useState } from "react";
import { Music, User, History, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { supabase } from "../lib/supabase";


const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

 useEffect(() => {
   const fetchProfile = async () => {
     const { data: userData, error: userError } = await supabase.auth.getUser();
     if (userError || !userData.user) {
       console.warn("Not logged in");
       return;
     }
     const userId = userData.user.id;

     const { data, error } = await supabase
       .from("profiles")
       .select("fname, lname, username")
       .eq("id", userId)
       .single();

     if (error) {
       console.error("Profile fetch error:", error);
       return;
     }

     setUser(data);
   };

   fetchProfile();
 }, []);

 
  const quickActions = [
    {
      icon: <Music className="w-12 h-12" />,
      title: "Generate Playlist",
      description:
        "Use emotion detection or choose artists to create a personalized playlist",
      path: "/playlist",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: <User className="w-12 h-12" />,
      title: "Your Profile",
      description:
        "Edit your preferences, favorite genres, and connected services",
      path: "/profile",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: <History className="w-12 h-12" />,
      title: "Past Playlists",
      description:
        "Revisit playlists you've created and manage your listening history",
      path: "/history",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/20 to-red-500/20",
    },
  ];

  return (
     <>
        <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">
              Emotion-Powered Music Discovery
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Hi
            </span>
            {user && (
              <span className="block mt-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {user?.fname} 
              </span>
            )}
          </h1>

          <p className="text-xl text-purple-200 max-w-2xl mx-auto mb-8">
            How are you feeling today? Let's create the
            perfect soundtrack for your mood.
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => handleNavigation("/artist")}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5" />
            Get started with your playlist
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={() => handleNavigation(action.path)}
              className="group cursor-pointer relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Background Gradient Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Content */}
              <div className="relative z-10">
                <div
                  className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${action.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {action.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">
                  {action.title}
                </h3>

                <p className="text-purple-200 mb-4 group-hover:text-purple-100 transition-colors">
                  {action.description}
                </p>

                <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-medium">
                  Get started
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Spacing */}
        <div className="h-20" />
      </div>
    </div>
    </>
  );
};

export default Home;
