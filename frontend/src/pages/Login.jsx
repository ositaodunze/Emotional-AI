import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Music } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { data: loginData, error } = await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );
        if (error) throw error;
        console.log("Logged in user:", loginData.user);
        navigate("/home");
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
          },
        });
        if (error) throw error;
        const newUser = signUpData.user;
        if (newUser) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              fname,
              lname,
              username,
            })
            .eq("id", newUser.id);

          if (profileError) {
            console.error("Profile update error:", profileError);
          }
        }

        setMessage("Account created! You can now sign in.");
        setIsLogin(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Feed Music</span>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-2">
            {isLogin ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="text-white/60 text-center mb-6">
            {isLogin ? "Sign in to continue" : "Create your account"}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/80 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/80 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lname}
                      onChange={(e) => setLname(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-white/60 hover:text-purple-400 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
