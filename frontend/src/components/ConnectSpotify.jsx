import React, { useState, useEffect} from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

const ConnectSpotify = ({onContinue}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/spotify/me`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          }
        } catch (err) {
          console.error("Not logged in:", err);
        } finally {
            setLoading(false);
        }
      };
      fetchUser();
    }, []);

     const handleConnect = () => {
       window.location.href = `${BACKEND_URL}/spotify/login`;
     };

    return(
        <>

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
            <p className="mb-2 text-xl font-semibold">
                Hi, {user.display_name}
            </p>
            {user.images?.[0]?.url && (
                <img
                src={user.images[0].url}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg"
                />
            )}
            <button
                onClick={() => onContinue(user)}
                className="px-6 py-2 bg-white text-green-700 rounded-full font-bold hover:bg-gray-200 transition"
            >
                Continue
            </button>
            </div>
        )}
        </div>
        </>
    )
};
export default ConnectSpotify;