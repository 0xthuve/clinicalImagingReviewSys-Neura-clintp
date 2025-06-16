"use client"; // This is a client component

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const router = useRouter();
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    patientId: "",
    originalImage: "",
    predictedImage: "",
    ConsultantAnswered: false,
    RadiologistAnswered: false,
  });

  // Debug modal interaction
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteModal) {
      console.log("Modal opened:", {
        showAddModal,
        showEditModal,
        showDeleteModal,
      });
      const modal =
        addModalRef.current || editModalRef.current || deleteModalRef.current;
      if (modal) {
        console.log("Modal element:", modal);
        console.log(
          "Computed style pointer-events:",
          getComputedStyle(modal).pointerEvents
        );
      }
    }
  }, [showAddModal, showEditModal, showDeleteModal]);

  // Focus management and modal interactivity
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
      }
    };

    const focusWithinModal = (modalRef) => {
      if (modalRef.current) {
        modalRef.current.style.pointerEvents = "auto"; // Ensure pointer events
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          console.warn("No focusable elements found in modal");
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
        return () =>
          modalRef.current?.removeEventListener("keydown", trapFocus);
      }
    };

    if (showAddModal) focusWithinModal(addModalRef);
    if (showEditModal) focusWithinModal(editModalRef);
    if (showDeleteModal) focusWithinModal(deleteModalRef);

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal, showEditModal, showDeleteModal]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/admin");
      const data = await response.json();
      setPatients(data.patients);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent form submission
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
    e.stopPropagation();
    e.preventDefault(); // Prevent default file input behavior
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [field]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPatient = async (e) => {
    e.stopPropagation();
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
          predictedImage: "",
          ConsultantAnswered: false,
          RadiologistAnswered: false,
        });
        fetchPatients();
      } else {
        console.error("Failed to add patient:", await response.text());
      }
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const handleEditPatient = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          originalImage: formData.originalImage || undefined,
          predictedImage: formData.predictedImage || undefined,
          ConsultantAnswered: formData.ConsultantAnswered,
          RadiologistAnswered: formData.RadiologistAnswered,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchPatients();
      } else {
        console.error("Failed to edit patient:", await response.text());
      }
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };

  const handleDeletePatient = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await fetch(
        `/api/admin?patientId=${selectedPatient.patientId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        fetchPatients();
      } else {
        console.error("Failed to delete patient:", await response.text());
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  const handleAnsweredChange = (e, field) => {
    e.stopPropagation();
    const value = e.target.value === "true";
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Patient Management
          </h1>

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl shadow-lg text-gray-50 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Sign In</span>
          </button>
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
            onClick={(e) => {
              e.stopPropagation();
              setFormData({
                patientId: "",
                originalImage: "",
                predictedImage: "",
                ConsultantAnswered: false,
                RadiologistAnswered: false,
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 mb-4 border border-transparent text-sm font-semibold rounded-md shadow-sm text-gray-50 bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Patient
          </button>
        </div>

        {/* Patients table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
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
                            {patient.originalImage
                              ? "Image uploaded"
                              : "No image"}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                          setFormData({
                            patientId: patient.patientId,
                            originalImage: patient.originalImage || "",
                            predictedImage: patient.predictedImage || "",
                            ConsultantAnswered:
                              patient.Consultant?.answered || false,
                            RadiologistAnswered:
                              patient.Radiologist?.answered || false,
                          });
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center bg-gray-500/75"
          onClick={() => setShowAddModal(false)}
        >
          <div
            ref={addModalRef}
            className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full pointer-events-auto"
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
                  {formData.originalImage && formData.originalImage !== "" && (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddModal(false);
                    }}
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
            className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full pointer-events-auto"
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
                  {formData.originalImage && formData.originalImage !== "" && (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(false);
                    }}
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
            className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full pointer-events-auto"
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
                      {selectedPatient.patientId}? This action cannot be undone.
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
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
