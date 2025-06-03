"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const App = () => {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async () => {
    if (!userId.trim()) {
      setError("Please enter your ID");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await res.json();

      if (data.exists) {
        localStorage.setItem("userId", userId);
        router.push("/review");
      } else {
        setError("User ID not found. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-pink-50 overflow-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="layout-container flex h-full grow flex-col relative z-10">
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between border-b border-gray-200 px-10 py-4 bg-white/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 text-gray-900">
            <motion.div
              className="size-6"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </motion.div>
            <h2 className="text-xl font-bold tracking-tight">
              Breast Cancer Review Platform
            </h2>
          </div>
        </motion.header>

        <div className="flex flex-1 items-center justify-center py-8 px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Enter your unique ID to access the platform
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your unique ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
                  aria-label="User ID"
                  disabled={loading}
                />
                <motion.div
                  className="absolute inset-y-0 right-3 flex items-center"
                  animate={{ opacity: loading ? 1 : 0 }}
                >
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Login to platform"
              >
                {loading ? "Verifying..." : "Login"}
              </motion.button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Need assistance?{" "}
              <a
                href="/support"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Contact Support
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default App;
