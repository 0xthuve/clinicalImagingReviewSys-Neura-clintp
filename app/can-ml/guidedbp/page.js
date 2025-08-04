// pages/cancer-detect.js
"use client";
import { useState } from "react";
import axios from "axios";

// Get the API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;

export default function CancerDetectPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    console.log("File selected:", e.target.files[0]);
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setResult(null);
    setError("");
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked");

    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      console.log("Sending request to:", `${API_BASE_URL}/guidedbp`);
      const response = await axios.post(`${API_BASE_URL}/guidedbp`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Response received:", response);

      if (!response.data) {
        throw new Error("Empty response from server");
      }

      setResult(response.data);
    } catch (err) {
      console.error("API Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to process request. Please check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-4">
          🧠 Breast Cancer Prediction with Guided Backpropagation
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0 file:text-sm file:font-semibold
            file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            id="fileInput"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mb-4 rounded-lg w-full"
            />
          )}
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className={`w-full bg-pink-600 text-white font-semibold py-2 rounded-lg transition
              ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-pink-700"}
              ${!selectedFile ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Analyzing..." : "Predict Now"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}

        {result && (
          <div className="mt-6 text-center">
            <p className="text-lg font-medium text-gray-700">
              Predicted Class:{" "}
              <span className="text-pink-600 font-bold">
                {result.predicted_class}
              </span>
            </p>
            <p className="text-md text-gray-600 mt-1">
              Probability:{" "}
              <span className="text-pink-500 font-semibold">
                {(result.probability * 100).toFixed(2)}%
              </span>
            </p>

            {result.images_base64 && (
  <div className="mt-4 space-y-4">
    <div>
      <p className="text-sm text-gray-500 mb-2">Guided Backprop Heatmap:</p>
      <img
        src={`data:image/png;base64,${result.images_base64.heatmap}`}
        alt="Guided Backprop Heatmap"
        className="rounded-lg w-full"
      />
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-2">Guided Backprop Overlay:</p>
      <img
        src={`data:image/png;base64,${result.images_base64.overlay}`}
        alt="Guided Backprop Overlay"
        className="rounded-lg w-full"
      />
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-2">Guided Backprop Full:</p>
      <img
        src={`data:image/png;base64,${result.images_base64.full}`}
        alt="Guided Backprop Full"
        className="rounded-lg w-full"
      />
    </div>
  </div>
)}
          </div>
        )}
      </div>
    </div>
  );
}
