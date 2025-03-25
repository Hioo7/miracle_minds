"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AdminBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // For the therapist details modal
  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [therapistProfile, setTherapistProfile] = useState(null);

  useEffect(() => {
    fetchBookingDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchBookingDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://miracle-minds.vercel.app/api/bookings/admin/detail/${bookingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      toast.error("Error fetching booking detail.");
    }
  };

  // Fetch therapist details if user clicks the therapist name
  const handleTherapistClick = async () => {
    if (!booking || !booking.therapistId) return;
    // If the backend populates 'booking.therapistId' as an object with _id,
    // handle that scenario:
    const therapistId =
      typeof booking.therapistId === "object"
        ? booking.therapistId._id
        : booking.therapistId;

    if (!therapistId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://miracle-minds.vercel.app/api/therapists/${therapistId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTherapistProfile(res.data); // store the doc from DB
      setShowTherapistModal(true);   // show popup
    } catch (error) {
      console.error("Error fetching therapist details:", error);
      toast.error("Failed to fetch therapist details.");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleUploadReports = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }
    const token = localStorage.getItem("token");
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("reports", selectedFiles[i]);
    }
    try {
      await axios.post(
        `https://miracle-minds.vercel.app/api/admin/reports/${bookingId}/upload-reports`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Reports uploaded successfully!");
      fetchBookingDetail(); // Refresh the booking detail
    } catch (error) {
      console.error("Error uploading reports:", error);
      toast.error("Failed to upload reports.");
    }
  };

  if (!booking) {
    return (
      <div className="p-6 bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95]">
        <h1 className="text-2xl font-bold mb-4 text-[#4c1d95]">Booking Detail</h1>
        <p className="text-[#4c1d95]">Loading...</p>
      </div>
    );
  }

  // from booking doc
  const user = booking.userId || {};
  const therapyNames = booking.therapies.map((t) => t.name).join(", ");

  return (
    <div className="p-6 bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95] relative">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
      >
        Back
      </button>
      <h1 className="text-2xl font-bold mb-6 text-[#4c1d95]">Booking Detail</h1>

      {/* User Info */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#4c1d95]">User Info</h2>
        <p className="text-[#4c1d95]">Name: {user.name}</p>
        <p className="text-[#4c1d95]">Email: {booking.email || user.email}</p>
        <p className="text-[#4c1d95]">Phone: {booking.phone}</p>
      </div>

      {/* Booking Info */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#4c1d95]">Booking Info</h2>
        <p className="text-[#4c1d95]">Booking ID: {booking._id}</p>
        <p className="text-[#4c1d95]">Date: {booking.date}</p>
        <p className="text-[#4c1d95]">
          Timeslot: {booking.timeslot.from} - {booking.timeslot.to}
        </p>
        <p className="text-[#4c1d95]">Therapies: {therapyNames}</p>
        <p className="text-[#4c1d95]">Amount Paid: ₹{booking.amountPaid}</p>
        <p className="text-[#4c1d95]">Status: {booking.status}</p>
        {/* Child details / Additional fields */}
        <p className="text-[#4c1d95]">Child Name: {booking.profileId}</p>
        <p className="text-[#4c1d95]">Child DOB: {booking.childDOB}</p>
        <p className="text-[#4c1d95]">
          Therapist:{" "}
          <button
            onClick={handleTherapistClick}
            className="text-[#db2777] hover:bg-[#fbcfe8] hover:text-[#831843]"
          >
            {booking.therapistName || "N/A"}
          </button>
        </p>
        <p className="text-[#4c1d95]">Mode: {booking.mode}</p>
      </div>

      {/* Upload Reports */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-[#4c1d95]">Upload Reports</h2>
        <div className="border-2 border-dashed border-[#d8b4fe] bg-[#f3e8ff] p-4 flex flex-col items-center justify-center">
          <label className="cursor-pointer">
            <div className="w-16 h-16 flex items-center justify-center bg-white text-[#4c1d95] rounded">
              +
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-sm text-[#4c1d95]">Upload PDF, images, etc.</p>
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-2">
              {Array.from(selectedFiles).map((file, idx) => (
                <p key={idx} className="text-sm text-[#4c1d95]">
                  {file.name}
                </p>
              ))}
            </div>
          )}
          <button
            onClick={handleUploadReports}
            className="mt-4 bg-[#db2777] hover:bg-[#be185d] text-white px-4 py-2 rounded"
          >
            Upload Reports
          </button>
        </div>
      </div>

      {/* Uploaded Reports */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#4c1d95]">Uploaded Reports</h2>
        {booking.reports && booking.reports.length > 0 ? (
          <ul className="list-disc ml-6">
            {booking.reports.map((report, idx) => (
              <li key={idx}>
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#db2777] hover:bg-[#fbcfe8] hover:text-[#831843]"
                >
                  {report.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#4c1d95]">No reports uploaded.</p>
        )}
      </div>

      {/* Therapist Modal (if showTherapistModal = true) */}
      {showTherapistModal && therapistProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-tr from-[#ffffff] to-[#ffffff] p-6 rounded-md w-full max-w-md mx-4 relative border border-[#d8b4fe]">
            <button
              onClick={() => setShowTherapistModal(false)}
              className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
            >
              X
            </button>

            {/* Show therapist info */}
            <div className="flex flex-col items-center text-center">
              {/* Photo */}
              {therapistProfile.photo ? (
                <img
                  src={therapistProfile.photo}
                  alt={therapistProfile.name}
                  className="h-32 w-32 object-cover rounded-full mb-4"
                />
              ) : (
                <div className="h-32 w-32 bg-white flex items-center justify-center rounded-full mb-4 border border-[#d8b4fe]">
                  No Image
                </div>
              )}
              <h2 className="text-xl font-bold mb-2 text-[#4c1d95]">{therapistProfile.name}</h2>
              {therapistProfile.expertise && therapistProfile.expertise.length > 0 && (
                <p className="text-sm text-[#4c1d95] mb-2">
                  Expertise: {therapistProfile.expertise.join(", ")}
                </p>
              )}
              <p className="text-sm text-[#4c1d95] mb-2">
                {therapistProfile.about || "No description"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
