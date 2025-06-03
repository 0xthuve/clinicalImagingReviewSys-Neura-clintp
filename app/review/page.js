"use client";
import { motion } from "framer-motion";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LogOut,
  CheckCircle2,
  Circle,
  ArrowRight,
  Send,
  Stethoscope,
  Brain,
  FileImage,
  Sparkles,
} from "lucide-react";

const ReviewCase = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role") || "consultant";
  const userRole = roleParam.toLowerCase();

  const consultantFeedback = [
    "Is the AI output clinically relevant?",
    "Does the result align with diagnosis?",
    "Would you use this tool in practice?",
    "Is further review needed?",
  ];

  const radiologistFeedback = [
    "Is the AI segmentation accurate?",
    "Are there visible artifacts?",
    "Does the output match expected regions?",
    "Would you approve this result?",
  ];

  const feedbackOptions =
    userRole === "consultant" ? consultantFeedback : radiologistFeedback;

  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheckbox = (label) => {
    setCheckedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "";
    router.push("/");
  };

  const getRoleIcon = () => {
    return userRole === "consultant" ? (
      <Stethoscope className="w-5 h-5" />
    ) : (
      <Brain className="w-5 h-5" />
    );
  };

  const getRoleColor = () => {
    return userRole === "consultant"
      ? "from-emerald-500 to-teal-600"
      : "from-blue-500 to-indigo-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between border-b border-gray-200 px-10 py-4 bg-white/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-4 text-gray-900">
          <motion.div
            className="w-10 h-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <img
              src="/logo-removebg-preview.png"
              alt="Breast Cancer Icon"
              className="w-full h-full object-contain"
            />
          </motion.div>

          <h2 className="text-xl font-bold tracking-tight">
            Breast Cancer Review Platform
          </h2>
        </div>
      </motion.header>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`}
            >
              {getRoleIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                Welcome, {userRole}
              </h1>
              <p className="text-gray-600 text-sm">
                Medical Case Review System
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Case Review</h2>
            </div>
            <p className="text-gray-300 mt-2">Patient ID: 1234567890</p>
          </div>

          <div className="p-8">
            {/* Image Comparison Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Original Image */}
              <div className="group">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileImage className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Original Image
                    </h3>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-blue-300 transition-colors duration-300">
                    <div className="text-center">
                      <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Medical Image</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Predicted Image */}
              <div className="group">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Prediction Image
                    </h3>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-emerald-300 transition-colors duration-300">
                    <div className="text-center">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Analysis Result</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Feedback Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                {getRoleIcon()}
                <h3 className="text-xl font-bold text-gray-900">
                  Feedback Assessment ({userRole})
                </h3>
              </div>

              <div className="space-y-4">
                {feedbackOptions.map((label, index) => (
                  <div
                    key={label}
                    className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <button
                      onClick={() => toggleCheckbox(label)}
                      className="flex-shrink-0 relative"
                    >
                      {checkedItems[label] ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 transition-all duration-200" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-all duration-200" />
                      )}
                    </button>
                    <label
                      className="flex-1 text-gray-700 font-medium cursor-pointer select-none"
                      onClick={() => toggleCheckbox(label)}
                    >
                      {label}
                    </label>
                    <div className="text-sm text-gray-400 font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-all duration-200 font-medium hover:shadow-md transform hover:-translate-y-0.5">
                <span>Next Case</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Send className="w-4 h-4" />
                <span>Submit Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Case 1 of 12</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCase;
