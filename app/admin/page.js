"use client"; // This is a client component

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
//import html2pdf from "html2pdf.js";

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const router = useRouter();
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const viewModalRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    patientId: "",
    originalImage: "",
    originalimageName: "",
    predictedImage: "",
    predictedImageName: "",
    ConsultantAnswered: false,
    RadiologistAnswered: false,
  });

  // Debug modal interaction
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteModal || showViewModal) {
      console.log("Modal opened:", {
        showAddModal,
        showEditModal,
        showDeleteModal,
        showViewModal,
      });
      const modal =
        addModalRef.current ||
        editModalRef.current ||
        deleteModalRef.current ||
        viewModalRef.current;
      if (modal) {
        console.log("Modal element:", modal);
        console.log(
          "Computed style pointer-events:",
          getComputedStyle(modal).pointerEvents
        );
      }
    }
  }, [showAddModal, showEditModal, showDeleteModal, showViewModal]);

  // Focus management and modal interactivity
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setShowViewModal(false);
      }
    };

    const focusWithinModal = (modalRef) => {
      if (modalRef.current) {
        modalRef.current.style.pointerEvents = "auto";
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          console.warn("No focusable elements found in modal");
          modalRef.current.focus();
          return;
        }
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const trapFocus = (e) => {
          if (e.key === "Tab") {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        };

        modalRef.current.addEventListener("keydown", trapFocus);
        firstElement.focus();
        return () => {
          if (modalRef.current) {
            modalRef.current.removeEventListener("keydown", trapFocus);
          }
        };
      }
    };

    if (showAddModal) focusWithinModal(addModalRef);
    if (showEditModal) focusWithinModal(editModalRef);
    if (showDeleteModal) focusWithinModal(deleteModalRef);
    if (showViewModal) focusWithinModal(viewModalRef);

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal, showEditModal, showDeleteModal, showViewModal]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.patients) {
        throw new Error("No patients data received");
      }
      setPatients(data.patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError("Failed to load patients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "";
    router.push("/");
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [field]: reader.result,
          [field === "originalImage"
            ? "originalimageName"
            : "predictedImageName"]: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          patientId: "",
          originalImage: "",
          originalimageName: "",
          predictedImage: "",
          predictedImageName: "",
          ConsultantAnswered: false,
          RadiologistAnswered: false,
        });
        await fetchPatients();
      } else {
        console.error("Failed to add patient:", await response.text());
        setError("Failed to add patient. Please try again.");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
      setError("An error occurred while adding the patient.");
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          originalImage: formData.originalImage || undefined,
          originalimageName: formData.originalimageName || undefined,
          predictedImage: formData.predictedImage || undefined,
          predictedImageName: formData.predictedImageName || undefined,
          ConsultantAnswered: formData.ConsultantAnswered,
          RadiologistAnswered: formData.RadiologistAnswered,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        await fetchPatients();
      } else {
        console.error("Failed to edit patient:", await response.text());
        setError("Failed to update patient. Please try again.");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      setError("An error occurred while updating the patient.");
    }
  };

  const handleDeletePatient = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const response = await fetch(
        `/api/admin?patientId=${selectedPatient.patientId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        await fetchPatients();
      } else {
        console.error("Failed to delete patient:", await response.text());
        setError("Failed to delete patient. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      setError("An error occurred while deleting the patient.");
    }
  };

  const handleAnsweredChange = (e, field) => {
    const value = e.target.value === "true";
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateScore = (answer) => {
    if (typeof answer === "string") {
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer === "low") return 1;
      if (lowerAnswer === "medium") return 2;
      if (lowerAnswer === "high") return 3;
    }
    return 0;
  };

  const getTotalScore = (consultant, radiologist) => {
    let total = 0;
    if (consultant?.questions) {
      Object.values(consultant.questions).forEach((question) => {
        total += calculateScore(question.answer);
      });
    }
    if (radiologist?.questions) {
      Object.values(radiologist.questions).forEach((question) => {
        total += calculateScore(question.answer);
      });
    }
    return total;
  };

  const handleDownloadPDF = async (patient) => {
    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.fontFamily = "Arial, sans-serif";
    element.innerHTML = `
       <h1>Patient Report: ${patient.patientId}</h1>
       <h2>Patient Details</h2>
       <p><strong>Patient ID:</strong> ${patient.patientId}</p>
       <p><strong>Date Added:</strong> ${formatDate(patient.createdAt)}</p>
       <p><strong>Original Image Name:</strong> ${
         patient.originalimageName || "None"
       }</p>
       <p><strong>Predicted Image Name:</strong> ${
         patient.predictedImageName || "None"
       }</p>
       <p><strong>Consultant Status:</strong> ${
         patient.Consultant.answered ? "Completed" : "Pending"
       }</p>
       <p><strong>Radiologist Status:</strong> ${
         patient.Radiologist.answered ? "Completed" : "Pending"
       }</p>
       <p><strong>Total Score:</strong> ${getTotalScore(
         patient.Consultant,
         patient.Radiologist
       )}</p>
       <h2>Consultant Answers</h2>
       <ul>
         ${
           patient.Consultant?.questions
             ? Object.entries(patient.Consultant.questions)
                 .map(
                   ([key, q]) =>
                     `<li>${q.text}: ${
                       q.answer || "Not answered"
                     } (Score: ${calculateScore(q.answer)})</li>`
                 )
                 .join("")
             : "<li>No questions</li>"
         }
       </ul>
       <h2>Radiologist Answers</h2>
       <ul>
         ${
           patient.Radiologist?.questions
             ? Object.entries(patient.Radiologist.questions)
                 .map(
                   ([key, q]) =>
                     `<li>${q.text}: ${
                       q.answer || "Not answered"
                     } (Score: ${calculateScore(q.answer)})</li>`
                 )
                 .join("")
             : "<li>No questions</li>"
         }
       </ul>
     `;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          margin: 10,
          filename: `Patient_${patient.patientId}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to download PDF. Please try again.");
    }
  };

  const handleDownloadOverallReport = async () => {
    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.fontFamily = "Arial, sans-serif";
    element.innerHTML = `
       <h1>Overall Patient Report</h1>
       <p><strong>Date:</strong> ${formatDate(new Date())}</p>
       <h2>Patient Summary</h2>
       <table style="width: 100%; border-collapse: collapse;">
         <thead>
           <tr style="border-bottom: 1px solid #000;">
             <th style="padding: 8px; text-align: left;">Patient ID</th>
             <th style="padding: 8px; text-align: left;">Consultant Status</th>
             <th style="padding: 8px; text-align: left;">Radiologist Status</th>
             <th style="padding: 8px; text-align: left;">Total Score</th>
             <th style="padding: 8px; text-align: left;">Date Added</th>
           </tr>
         </thead>
         <tbody>
           ${patients
             .map(
               (patient) => `
                 <tr style="border-bottom: 1px solid #ddd;">
                   <td style="padding: 8px;">${patient.patientId}</td>
                   <td style="padding: 8px;">${
                     patient.Consultant.answered ? "Completed" : "Pending"
                   }</td>
                   <td style="padding: 8px;">${
                     patient.Radiologist.answered ? "Completed" : "Pending"
                   }</td>
                   <td style="padding: 8px;">${getTotalScore(
                     patient.Consultant,
                     patient.Radiologist
                   )}</td>
                   <td style="padding: 8px;">${formatDate(
                     patient.createdAt
                   )}</td>
                 </tr>
               `
             )
             .join("")}
         </tbody>
       </table>
     `;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          margin: 10,
          filename: "Overall_Patient_Report.pdf",
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch (error) {
      console.error("Error generating overall report PDF:", error);
      setError("Failed to download overall report PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button
            onClick={fetchPatients}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Patient Management
          </h1>
          <div className="flex gap-4">
            <button
              onClick={handleDownloadOverallReport}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <span>Download Overall Report</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Patients
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {patients.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Consultations Done
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {patients.filter((p) => p.Consultant.answered).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-11h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Radiology Done
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {patients.filter((p) => p.Radiologist.answered).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Cases
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {
                          patients.filter(
                            (p) =>
                              !p.Consultant.answered || !p.Radiologist.answered
                          ).length
                        }
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => {
              setFormData({
                patientId: "",
                originalImage: "",
                originalimageName: "",
                predictedImage: "",
                predictedImageName: "",
                ConsultantAnswered: false,
                RadiologistAnswered: false,
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 mb-4 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Patient
          </button>
        </div>

        {/* Patients list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Patient ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Consultation
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Radiology
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Added
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {patient.patientId.substring(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.patientId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(patient.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.Consultant.answered
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {patient.Consultant.answered ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.Radiologist.answered
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {patient.Radiologist.answered ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(patient.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowViewModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setFormData({
                            patientId: patient.patientId,
                            originalImage: patient.originalImage || "",
                            originalimageName: patient.originalimageName || "",
                            predictedImage: patient.predictedImage || "",
                            predictedImageName:
                              patient.predictedImageName || "",
                            ConsultantAnswered:
                              patient.Consultant?.answered || false,
                            RadiologistAnswered:
                              patient.Radiologist?.answered || false,
                          });
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(patient)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {patients.map((patient) => (
              <div key={patient._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center mb-2">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {patient.patientId.substring(0, 2)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.patientId}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(patient.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Consultation
                    </span>
                    <div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.Consultant.answered
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {patient.Consultant.answered ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Radiology
                    </span>
                    <div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.Radiologist.answered
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {patient.Radiologist.answered ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowViewModal(true);
                    }}
                    className="text-green-600 hover:text-green-900 text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setFormData({
                        patientId: patient.patientId,
                        originalImage: patient.originalImage || "",
                        originalimageName: patient.originalimageName || "",
                        predictedImage: patient.predictedImage || "",
                        predictedImageName: patient.predictedImageName || "",
                        ConsultantAnswered:
                          patient.Consultant?.answered || false,
                        RadiologistAnswered:
                          patient.Radiologist?.answered || false,
                      });
                      setShowEditModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(patient)}
                    className="text-purple-600 hover:text-purple-900 text-sm"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Patient Modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center bg-gray-500/75"
            onClick={() => setShowAddModal(false)}
          >
            <div
              ref={addModalRef}
              className="relative bg-white rounded-lg text-left overflow-hidden shadow-sm sm:max-w-lg sm:w-xl transform transition-all w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              tabIndex="-1"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add New Patient
                </h3>
                <form onSubmit={handleAddPatient}>
                  <div className="mb-4">
                    <label
                      htmlFor="patientId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Patient ID
                    </label>
                    <input
                      type="text"
                      name="patientId"
                      id="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="originalImage"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Original Image
                    </label>
                    <input
                      type="file"
                      name="originalImage"
                      id="originalImage"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "originalImage")}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {formData.originalimageName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Selected: {formData.originalimageName}
                      </p>
                    )}
                    {formData.originalImage &&
                      formData.originalImage !== "" && (
                        <img
                          src={formData.originalImage}
                          alt="Preview"
                          className="mt-2 w-32 h-32 object-cover rounded"
                        />
                      )}
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="predictedImage"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Predicted Image (optional)
                    </label>
                    <input
                      type="file"
                      name="predictedImage"
                      id="predictedImage"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "predictedImage")}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {formData.predictedImageName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Selected: {formData.predictedImageName}
                      </p>
                    )}
                    {formData.predictedImage &&
                      formData.predictedImage !== "" && (
                        <img
                          src={formData.predictedImage}
                          alt="Preview"
                          className="mt-2 w-32 h-32 object-cover rounded"
                        />
                      )}
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Patient Modal */}
        {showEditModal && selectedPatient && (
          <div
            className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center bg-gray-500/75"
            onClick={() => setShowEditModal(false)}
          >
            <div
              ref={editModalRef}
              className="relative bg-white rounded-lg shadow-xl transform transition-all sm:max-w-lg w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              tabIndex="-1"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Patient
                </h3>
                <form onSubmit={handleEditPatient}>
                  <div className="mb-4">
                    <label
                      htmlFor="editOriginalImage"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Original Image
                    </label>
                    <input
                      type="file"
                      name="originalImage"
                      id="editOriginalImage"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "originalImage")}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {formData.originalimageName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Selected: {formData.originalimageName}
                      </p>
                    )}
                    {formData.originalImage &&
                      formData.originalImage !== "" && (
                        <img
                          src={formData.originalImage}
                          alt="Preview"
                          className="mt-2 w-32 h-32 object-cover rounded"
                        />
                      )}
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="editPredictedImage"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Predicted Image
                    </label>
                    <input
                      type="file"
                      name="predictedImage"
                      id="editPredictedImage"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "predictedImage")}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {formData.predictedImageName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Selected: {formData.predictedImageName}
                      </p>
                    )}
                    {formData.predictedImage &&
                      formData.predictedImage !== "" && (
                        <img
                          src={formData.predictedImage}
                          alt="Preview"
                          className="mt-2 w-32 h-32 object-cover rounded"
                        />
                      )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Consultant Status
                    </label>
                    <div className="mt-2 flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="ConsultantAnswered"
                          value="true"
                          checked={formData.ConsultantAnswered === true}
                          onChange={(e) =>
                            handleAnsweredChange(e, "ConsultantAnswered")
                          }
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Completed
                        </span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="ConsultantAnswered"
                          value="false"
                          checked={formData.ConsultantAnswered === false}
                          onChange={(e) =>
                            handleAnsweredChange(e, "ConsultantAnswered")
                          }
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Pending
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Radiologist Status
                    </label>
                    <div className="mt-2 flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="RadiologistAnswered"
                          value="true"
                          checked={formData.RadiologistAnswered === true}
                          onChange={(e) =>
                            handleAnsweredChange(e, "RadiologistAnswered")
                          }
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Completed
                        </span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="RadiologistAnswered"
                          value="false"
                          checked={formData.RadiologistAnswered === false}
                          onChange={(e) =>
                            handleAnsweredChange(e, "RadiologistAnswered")
                          }
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Pending
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedPatient && (
          <div
            className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center bg-gray-500/75"
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              ref={deleteModalRef}
              className="relative bg-white rounded-lg shadow-xl transform transition-all sm:max-w-lg w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              tabIndex="-1"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Patient
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete patient{" "}
                        {selectedPatient.patientId}? This action cannot be
                        undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeletePatient}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Patient Modal */}
        {showViewModal && selectedPatient && (
          <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-2"
            onClick={() => setShowViewModal(false)}
          >
            <div
              ref={viewModalRef}
              className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              tabIndex="-1"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                Patient #{selectedPatient.patientId}
              </h2>
              <div className="mb-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  Consultant
                </h3>
                {selectedPatient.Consultant?.questions ? (
                  <ul className="space-y-1">
                    {Object.entries(selectedPatient.Consultant.questions).map(
                      ([key, q]) => (
                        <li key={key} className="text-sm text-gray-700">
                          {q.text}:{" "}
                          <span className="font-semibold">
                            {q.answer || "Not answered"}
                          </span>{" "}
                          <span className="text-blue-600 font-semibold">
                            ({calculateScore(q.answer)})
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No questions</p>
                )}
              </div>
              <div className="mb-3">
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  Radiologist
                </h3>
                {selectedPatient.Radiologist?.questions ? (
                  <ul className="space-y-1">
                    {Object.entries(selectedPatient.Radiologist.questions).map(
                      ([key, q]) => (
                        <li key={key} className="text-sm text-gray-700">
                          {q.text}:{" "}
                          <span className="font-semibold">
                            {q.answer || "Not answered"}
                          </span>{" "}
                          <span className="text-green-600 font-semibold">
                            ({calculateScore(q.answer)})
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No questions</p>
                )}
              </div>
              <div className="mb-4 text-sm text-center">
                <div className="font-medium text-gray-700">Total Score</div>
                <div className="text-lg font-bold text-blue-700">
                  {getTotalScore(
                    selectedPatient.Consultant,
                    selectedPatient.Radiologist
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-1.5 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
