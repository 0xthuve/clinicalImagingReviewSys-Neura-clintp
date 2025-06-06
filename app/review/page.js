"use client";

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
} from "lucide-react";

const ReviewCase = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get role from query params, normalize it
  const roleParam = searchParams.get("role")?.toLowerCase() || "";

  // Determine roleName properly
  const roleName = roleParam === "radiologist" ? "Radiologist" : "Consultant";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState({}); // { questionKey: boolean }
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageView, setImageView] = useState("side-by-side"); // "side-by-side" or "comparison"

  // Toggle checkbox based on question key
  const toggleCheckbox = (key) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "";
    router.push("/");
  };

  // Next case logic: reset checkedItems and increment index
  const handleNextCase = async () => {
    // Ensure currentCase exists
    if (!currentCase) {
      console.error("Current case is undefined");
      alert("Error: No current case available");
      return;
    }

    // Access questions under roleName
    const questions = currentCase[roleName]?.questions || {};

    // Build the payload.questions object by merging initial text + checkedItems
    const payloadQuestions = Object.entries(questions).reduce(
      (acc, [qKey, qObj]) => {
        acc[qKey] = {
          text: qObj.text,
          answer: !!checkedItems[qKey],
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
          setCheckedItems({}); // reset checkboxes

          // Check if this is the last case
          if (currentCaseIndex >= cases.length - 1) {
            alert("All cases reviewed successfully!");
            // Optionally, redirect or clear session instead of reloading
            // window.location.reload();
            router.push("/"); // Redirect to home or a completion page
            return;
          }

          // Move to the next case
          setCurrentCaseIndex((prev) => prev + 1);
        }, 1500);
      }, 800);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Error submitting answers: " + error.message);
      setSubmitting(false);
    }
  };

  // Fetch cases based on role
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading cases...</p>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-6 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          No Cases Available
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          No cases are currently available for the role "{roleName}".
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
        >
          <LogOut className="w-4 h-4" />
          <span>Return to Sign In</span>
        </button>
      </div>
    );
  }

  const currentCase = cases[currentCaseIndex];

  // Extract questions dynamically from currentCase based on roleName
  const questionObj = currentCase[roleName]?.questions || {};
  const feedbackOptions = Object.entries(questionObj).map(([key, val]) => ({
    key,
    text: val.text,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <Particles />
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
              imageView={imageView}
              setImageView={setImageView}
            />
          </motion.div>
        </AnimatePresence>

        <CaseProgress
          currentIndex={currentCaseIndex}
          totalCases={cases.length}
        />
      </main>
    </div>
  );
};

const Particles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-200/30"
          style={{
            width: 5 + Math.random() * 15,
            height: 5 + Math.random() * 15,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 100 - 50],
            x: [0, Math.random() * 50 - 25],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const Header = ({ role, caseIndex, totalCases, onSignOut }) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-10 py-4 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-20"
    >
      <div className="flex items-center gap-3 text-gray-900">
        <motion.div
          className="w-10 h-10"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          <img
            src="/logo-removebg-preview.png"
            alt="Breast Cancer Icon"
            className="w-full h-full object-contain"
          />
        </motion.div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Breast Cancer Review Platform
        </h2>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 shadow-sm">
          <span className="text-xs sm:text-sm font-medium text-gray-600">
            Case
          </span>
          <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {caseIndex + 1} of {totalCases}
          </span>
        </div>
        <motion.button
          onClick={onSignOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </motion.button>
      </div>
    </motion.header>
  );
};

const Welcome = ({ role }) => {
  const getRoleIcon = () => {
    return role === "Radiologist" ? (
      <Brain className="w-5 h-5" />
    ) : (
      <Stethoscope className="w-5 h-5" />
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
          className={`p-3 rounded-xl bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`}
        >
          {getRoleIcon()}
        </motion.div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {role}
            </span>
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Medical Case Review System
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ImageToggle = ({ imageView, setImageView }) => {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
        <button
          onClick={() => setImageView("side-by-side")}
          className={`px-4 py-1.5 rounded-md transition-all ${
            imageView === "side-by-side"
              ? "bg-white shadow-sm text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          Side by Side
        </button>
        <button
          onClick={() => setImageView("comparison")}
          className={`px-4 py-1.5 rounded-md transition-all ${
            imageView === "comparison"
              ? "bg-white shadow-sm text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          Comparison View
        </button>
      </div>
    </div>
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
  imageView,
  setImageView,
}) => {
  // Calculate how many items are checked
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalOptions = feedbackOptions.length;
  const progress = totalOptions > 0 ? (checkedCount / totalOptions) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl shadow-2xl p-6 sm:px-10 sm:py-8 max-w-5xl mx-auto border border-gray-200"
    >
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Case ID: <span className="text-blue-600">{currentCase._id}</span>
          <br />
          Patient ID:{" "}
          <span className="text-blue-600">{currentCase.patientId}</span>
        </h2>

        <div className="mt-2 sm:mt-0">
          <ImageToggle imageView={imageView} setImageView={setImageView} />
        </div>
      </div>

      {imageView === "side-by-side" ? (
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Show both Original and Predicted Images */}
          <div className="flex-1 flex flex-col space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Original Image:
              </h3>
              {currentCase.originalImage ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="overflow-hidden rounded-lg shadow-sm"
                >
                  <img
                    src={currentCase.originalImage || "/placeholder.svg"}
                    alt="Original Case Image"
                    className="w-full rounded-lg object-contain hover:cursor-zoom-in transition-all"
                  />
                </motion.div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-400 italic">No original image</p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Predicted Image:
              </h3>
              {currentCase.predictedImage ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="overflow-hidden rounded-lg shadow-sm"
                >
                  <img
                    src={currentCase.predictedImage || "/placeholder.svg"}
                    alt="Predicted Case Image"
                    className="w-full rounded-lg object-contain hover:cursor-zoom-in transition-all"
                  />
                </motion.div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-400 italic">No predicted image</p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback options */}
          <div className="flex-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-full">
              <h3 className="font-semibold mb-4 text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Provide your feedback:
              </h3>

              <div className="space-y-3">
                {feedbackOptions.length ? (
                  feedbackOptions.map(({ key, text }) => (
                    <motion.label
                      key={key}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer select-none transition-colors ${
                        checkedItems[key]
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedItems[key]}
                        onChange={() => toggleCheckbox(key)}
                        className="w-5 h-5 rounded-md cursor-pointer mt-0.5 accent-blue-600"
                      />
                      <span
                        className={`text-gray-800 text-sm ${
                          checkedItems[key] ? "font-medium" : ""
                        }`}
                      >
                        {text}
                      </span>
                    </motion.label>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-gray-500 italic">
                      No feedback questions available.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
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
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Next Case</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Comparison view
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Original Image
                </h3>
                {currentCase.originalImage ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="overflow-hidden rounded-lg shadow-sm"
                  >
                    <img
                      src={currentCase.originalImage || "/placeholder.svg"}
                      alt="Original Case Image"
                      className="w-full h-64 object-contain rounded-lg hover:cursor-zoom-in"
                    />
                  </motion.div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-400 italic">No original image</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Predicted Image
                </h3>
                {currentCase.predictedImage ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="overflow-hidden rounded-lg shadow-sm"
                  >
                    <img
                      src={currentCase.predictedImage || "/placeholder.svg"}
                      alt="Predicted Case Image"
                      className="w-full h-64 object-contain rounded-lg hover:cursor-zoom-in"
                    />
                  </motion.div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-400 italic">No predicted image</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback options */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-semibold mb-4 text-gray-700 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Provide your feedback:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackOptions.length ? (
                feedbackOptions.map(({ key, text }) => (
                  <motion.label
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer select-none transition-colors ${
                      checkedItems[key]
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[key]}
                      onChange={() => toggleCheckbox(key)}
                      className="w-5 h-5 rounded-md cursor-pointer mt-0.5 accent-blue-600"
                    />
                    <span
                      className={`text-gray-800 text-sm ${
                        checkedItems[key] ? "font-medium" : ""
                      }`}
                    >
                      {text}
                    </span>
                  </motion.label>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-gray-500 italic">
                    No feedback questions available.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
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
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Next Case</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
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
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
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

export default ReviewCase;
