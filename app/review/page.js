"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LogOut,
  Brain,
  Stethoscope,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Suspense } from "react";

function ReviewCase() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role")?.toLowerCase() || "";
  const roleName = roleParam === "radiologist" ? "Radiologist" : "Consultant";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [allCasesReviewed, setAllCasesReviewed] = useState(false);
  const [userId, setUserId] = useState(null);

  // Initialize userId from localStorage only on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId");
      setUserId(storedUserId);
      console.log("User id", storedUserId);
    }
  }, []);

  const toggleCheckbox = (key, level) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: level,
    }));
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "";
    }
    router.push("/");
  };

  const handleNextCase = async () => {
    const currentCase = cases[currentCaseIndex];
    if (!currentCase) {
      console.error("Current case is undefined");
      toast.error("Error: No current case available", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    const questions = currentCase[roleName]?.questions || {};
    const payloadQuestions = Object.entries(questions).reduce(
      (acc, [qKey, qObj]) => {
        acc[qKey] = {
          text: qObj.text,
          answer: checkedItems[qKey] || null,
        };
        return acc;
      },
      {}
    );

    setSubmitting(true);
    setShowSuccess(false);

    try {
      const res = await fetch("/api/submitans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentCase.patientId,
          role: roleName,
          reviewerId: userId,
          questions: payloadQuestions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Submission failed");
      }

      setTimeout(() => {
        setShowSuccess(true);
        setSubmitting(false);

        setTimeout(() => {
          setShowSuccess(false);
          setCheckedItems({});

          if (currentCaseIndex >= cases.length - 1) {
            setAllCasesReviewed(true);
            const TOAST_DURATION = 3000;
            toast.success("All cases reviewed successfully!", {
              position: "top-right",
              autoClose: TOAST_DURATION,
              theme: "dark",
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            setTimeout(() => {
              router.push("/");
            }, TOAST_DURATION);
            return;
          }

          setCurrentCaseIndex((prev) => prev + 1);
        }, 1500);
      }, 800);
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Error submitting answers: " + error.message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: roleName }),
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const result = await response.json();
        setCases(result.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roleParam, roleName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-16 h-16 text-gray-400 animate-spin mb-4" />
        <p className="text-xl font-semibold text-gray-600">Loading cases...</p>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <AlertCircle className="w-20 h-20 text-amber-400 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          No Cases Available
        </h2>
        <p className="text-lg text-gray-500 mb-6">
          No cases are currently available for the role &quot;{roleName}&quot;.
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-full transition duration-200 shadow-lg hover:shadow-xl"
        >
          <LogOut className="w-5 h-5" />
          <span>Return to Sign In</span>
        </button>
      </div>
    );
  }

  if (allCasesReviewed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            All Cases Reviewed
          </h2>
          <p className="text-lg text-gray-500 mb-6">
            You have successfully reviewed all available cases for {roleName}.
            You will be redirected to the login page shortly.
          </p>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-full transition duration-200 shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out Now</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const currentCase = cases[currentCaseIndex];
  const questionObj = currentCase[roleName]?.questions || {};
  const feedbackOptions = Object.entries(questionObj).map(([key, val]) => ({
    key,
    text: val.text,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
      <Header
        role={roleName}
        caseIndex={currentCaseIndex}
        totalCases={cases.length}
        onSignOut={handleSignOut}
      />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Welcome role={roleName} />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCaseIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <CaseReviewCard
              currentCase={currentCase}
              feedbackOptions={feedbackOptions}
              checkedItems={checkedItems}
              toggleCheckbox={toggleCheckbox}
              handleNextCase={handleNextCase}
              roleName={roleName}
              submitting={submitting}
              showSuccess={showSuccess}
              setSelectedImage={setSelectedImage}
            />
          </motion.div>
        </AnimatePresence>
        <CaseProgress
          currentIndex={currentCaseIndex}
          totalCases={cases.length}
        />
      </main>
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="Full-screen case image"
              width={1024}
              height={768}
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

const Header = ({ role, caseIndex, totalCases, onSignOut }) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-10 py-4 bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-20"
    >
      <div className="flex items-center gap-4 text-gray-800">
        <motion.div
          className="w-12 h-12"
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
        >
          <Image
            src="/logo-removebg-preview.png"
            alt="Breast Cancer Icon"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Breast Cancer Review Platform
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-300 shadow-md">
          <span className="text-sm font-medium text-gray-600">Case</span>
          <span className="text-sm font-bold text-gray-800">
            {caseIndex + 1} of {totalCases}
          </span>
        </div>
        <motion.button
          onClick={onSignOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-full transition duration-200 shadow-lg hover:shadow-xl"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </motion.button>
      </div>
    </motion.header>
  );
};

const Welcome = ({ role }) => {
  const getRoleIcon = () => {
    return role === "Radiologist" ? (
      <Brain className="w-6 h-6" />
    ) : (
      <Stethoscope className="w-6 h-6" />
    );
  };

  const getRoleColor = () => {
    return role === "Radiologist"
      ? "from-blue-500 to-indigo-600"
      : "from-emerald-500 to-teal-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex justify-between items-center mb-8"
    >
      <div className="flex items-center space-x-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`p-4 rounded-full bg-gradient-to-r ${getRoleColor()} text-white shadow-xl`}
        >
          {getRoleIcon()}
        </motion.div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome, <span className="text-gray-800">{role}</span>
          </h1>
          <p className="text-gray-500 text-sm">Medical Case Review System</p>
        </div>
      </div>
    </motion.div>
  );
};

const CaseReviewCard = ({
  currentCase,
  feedbackOptions,
  checkedItems,
  toggleCheckbox,
  handleNextCase,
  roleName,
  submitting,
  showSuccess,
  setSelectedImage,
}) => {
  const checkedCount = Object.values(checkedItems).filter(
    (item) => item !== null
  ).length;
  const totalOptions = feedbackOptions.length;
  const progress = totalOptions > 0 ? (checkedCount / totalOptions) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 max-w-5xl mx-auto border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Case ID: <span className="text-gray-600">{currentCase._id}</span>
          <br />
          Patient ID:{" "}
          <span className="text-gray-600">{currentCase.patientId}</span>
        </h2>
      </div>

      <div className="mb-6">
        <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <h3 className="font-semibold mb-3 text-gray-700 flex items-center">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                Original Image
              </h3>
              {currentCase.originalImage ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="overflow-hidden rounded-xl shadow-md cursor-pointer"
                  onClick={() => setSelectedImage(currentCase.originalImage)}
                >
                  <Image
                    src={currentCase.originalImage || "/placeholder.svg"}
                    alt="Original Case Image"
                    width={256}
                    height={256}
                    className="w-full h-64 object-contain rounded-xl hover:opacity-90 transition-all"
                  />
                </motion.div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-200 rounded-xl">
                  <p className="text-gray-500 italic">No original image</p>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="font-semibold mb-3 text-gray-700 flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                Explainable AI Prediction
              </h3>
              {currentCase.predictedImage ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="overflow-hidden rounded-xl shadow-md cursor-pointer"
                  onClick={() => setSelectedImage(currentCase.predictedImage)}
                >
                  <Image
                    src={currentCase.predictedImage || "/placeholder.svg"}
                    alt="Predicted Case Image"
                    width={256}
                    height={256}
                    className="w-full h-64 object-contain rounded-xl hover:opacity-90 transition-all"
                  />
                </motion.div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-200 rounded-xl">
                  <p className="text-gray-500 italic">No predicted image</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 mt-6">
          <h3 className="font-semibold mb-6 text-gray-700 flex items-center">
            <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
            Provide your feedback:
          </h3>

          <div className="relative">
            {/* Connection lines between nodes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-full h-full" style={{ zIndex: 1 }}>
                {feedbackOptions.map((_, index) => {
                  if (index < feedbackOptions.length - 1) {
                    const startY = 80 + index * 100;
                    const endY = 80 + (index + 1) * 100;
                    return (
                      <line
                        key={`line-${index}`}
                        x1="50%"
                        y1={startY}
                        x2="50%"
                        y2={endY}
                        stroke="#d1d5db"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                      />
                    );
                  }
                  return null;
                })}
              </svg>
            </div>

            {/* Question nodes */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 relative"
              style={{ zIndex: 2 }}
            >
              {feedbackOptions.length ? (
                feedbackOptions.map(({ key, text }, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex-1"
                  >
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {index + 1}
                        </div>
                        <span className="text-gray-800 font-medium text-sm leading-tight">
                          {text}
                        </span>
                      </div>

                      {/* Vertical radio buttons */}
                      <div className="space-y-3">
                        {["low", "medium", "high"].map((level) => {
                          const levelColors = {
                            low: "from-green-400 to-green-500",
                            medium: "from-yellow-400 to-orange-500",
                            high: "from-red-400 to-red-500",
                          };

                          return (
                            <motion.label
                              key={`${key}-${level}`}
                              whileHover={{
                                scale: 1.02,
                                x: index % 2 === 0 ? 5 : -5,
                              }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer select-none transition-all duration-200 ${
                                checkedItems[key] === level
                                  ? `bg-gradient-to-r ${levelColors[level]} text-white shadow-lg`
                                  : "hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="relative">
                                <input
                                  type="radio"
                                  name={`feedback-${key}`}
                                  checked={checkedItems[key] === level}
                                  onChange={() => toggleCheckbox(key, level)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    checkedItems[key] === level
                                      ? "border-white bg-white/20"
                                      : "border-gray-400 bg-white"
                                  }`}
                                >
                                  {checkedItems[key] === level && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-2 h-2 rounded-full bg-white"
                                    />
                                  )}
                                </div>
                              </div>
                              <span
                                className={`font-medium text-sm ${
                                  checkedItems[key] === level
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </span>
                              {checkedItems[key] === level && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="ml-auto"
                                >
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </motion.label>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
                  <p className="text-gray-500 italic text-lg">
                    No feedback questions available.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center space-x-2 w-full bg-green-100 text-green-700 font-medium py-3 rounded-xl"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Feedback submitted successfully!</span>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleNextCase}
                    disabled={submitting || checkedCount < totalOptions}
                    className={`w-full font-semibold py-4 rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 ${
                      checkedCount < totalOptions
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {checkedCount < totalOptions
                            ? `Answer ${
                                totalOptions - checkedCount
                              } more question${
                                totalOptions - checkedCount > 1 ? "s" : ""
                              }`
                            : "Next Case"}
                        </span>
                        {checkedCount >= totalOptions && (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CaseProgress = ({ currentIndex, totalCases }) => {
  const progress = ((currentIndex + 1) / totalCases) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="mt-8 max-w-md mx-auto"
    >
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gray-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Case {currentIndex + 1}</span>
        <span>Total: {totalCases} cases</span>
      </div>
    </motion.div>
  );
};

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-16 h-16 text-gray-400 animate-spin mb-4" />
          <p className="text-xl font-semibold text-gray-600">Loading...</p>
        </div>
      }
    >
      <ReviewCase />
    </Suspense>
  );
}
