import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8888";

const ConnectSpotify = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/spotify/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          // Expected 401 when user not logged in yet
          if (res.status === 401) {
            console.log("User not logged in yet");
            setUser(null);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log("Spotify Token Data:", data);
        setUser(data);
         const { data: authData, error } = await supabase.auth.getUser();
         const userId = authData?.user?.id;
         console.log("Supabase User ID:", userId);


         if (userId) {
          const unixTimestampSeconds = data.expires_at;
          const expiresDate = new Date(unixTimestampSeconds * 1000);
          const expiresISOString = expiresDate.toISOString(); 

          const {data: upsertData, error: upsertError} = await supabase
             .from("spotify_log")
             .upsert({
               id: userId,
               access_token: data.access_token,
               refresh_token: data.refresh_token,
               spotify_id: data.spotify_id,
               display_name: data.display_name,
               product_type: data.product,
               expires_at: expiresISOString,
             })
             .select();

             if (upsertError) {
              console.error("Supabase Upsert Error:", upsertError);
             } else{
              console.log("Saved to DB:", upsertData);
             }
         }
         navigate("/spotify-check")
      } catch (err) {
        console.error("Error checking Spotify login:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleConnect = () => {
    window.location.href = `${BACKEND_URL}/spotify/login`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-lg">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-400 via-green-600 to-black text-white">
      <h1 className="text-3xl font-bold mb-6">Connect Your Spotify</h1>

      {!user ? (
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold text-lg"
        >
          Connect with Spotify
        </button>
      ) : (
        <div className="text-center">
          <p className="mb-2 text-xl font-semibold">Hi, {user.display_name}</p>
          {user.images?.[0]?.url && (
            <img
              src={user.images[0].url}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectSpotify;
