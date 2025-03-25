"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RescheduleBookingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [newDate, setNewDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [availableTimeslots, setAvailableTimeslots] = useState([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [loadingTimeslots, setLoadingTimeslots] = useState(false);
  const [role, setRole] = useState("");

  // Get user role from localStorage (or adapt to your auth context)
  useEffect(() => {
    const storedRole = localStorage.getItem("role"); // e.g. "ADMIN", "USER"
    if (storedRole) {
      setRole(storedRole.toUpperCase());
    }
  }, []);

  // Fetch the existing booking
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://miracle-minds.vercel.app/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooking(res.data);
        setNewDate(res.data.date);
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Failed to fetch booking details.");
      }
    };
    if (bookingId) fetchBooking();
  }, [bookingId]);

  // Whenever booking or newDate changes, fetch updated timeslots
  useEffect(() => {
    if (booking && newDate) {
      fetchTimeslots();
    }
  }, [booking, newDate]);

  const fetchTimeslots = async () => {
    try {
      setLoadingTimeslots(true);
      const token = localStorage.getItem("token");

      // Get therapistId from booking (populated or as ID)
      const therapistId =
        typeof booking.therapistId === "object" && booking.therapistId !== null
          ? booking.therapistId._id
          : booking.therapistId;
      const therapyIds = booking.therapies?.map((t) => t._id).join(",") || "";
      const mode = booking.mode;

      const url = `https://miracle-minds.vercel.app/api/bookings/timeslots?date=${newDate}&therapistId=${therapistId}&mode=${mode}&therapies=${therapyIds}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

      let slots = res.data;
      const todayStr = dayjs().format("YYYY-MM-DD");
      if (newDate === todayStr) {
        const now = dayjs();
        slots = slots.filter((slot) => {
          const slotTime = dayjs(`${newDate} ${slot.from}`, "YYYY-MM-DD HH:mm");
          return slotTime.isAfter(now);
        });
      }
      setAvailableTimeslots(slots);
      setSelectedTimeslot(null);
    } catch (error) {
      console.error("Error fetching timeslots:", error);
      toast.error("Failed to fetch available timeslots.");
    } finally {
      setLoadingTimeslots(false);
    }
  };

  const handlePreviousDate = () => {
    const prevDate = dayjs(newDate).subtract(1, "day").format("YYYY-MM-DD");
    if (dayjs(prevDate).isBefore(dayjs(), "day")) {
      toast.warning("Cannot select a past date!");
      return;
    }
    setNewDate(prevDate);
  };

  const handleNextDate = () => {
    const nextDate = dayjs(newDate).add(1, "day").format("YYYY-MM-DD");
    setNewDate(nextDate);
  };

  const handleReschedule = async () => {
    if (!selectedTimeslot) {
      toast.error("Please select a new timeslot.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        bookingId,
        date: newDate,
        timeslot: selectedTimeslot,
      };
      const res = await axios.post("https://miracle-minds.vercel.app/api/bookings/reschedule", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message || "Booking rescheduled successfully!");

      // Redirect based on role
      if (role === "ADMIN") {
        navigate("/admin-dashboard/upcoming");
      } else {
        navigate("/dashboard/upcoming-meetings");
      }
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      toast.error(error.response?.data?.message || "Failed to reschedule booking.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 p-8">
      <div className="max-w-2xl mx-auto bg-purple-800 bg-opacity-90 rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-pink-300 mb-6 text-center">
          Reschedule Booking
        </h1>

        {booking ? (
          <div className="mb-6 text-purple-200">
            <p>
              <span className="font-bold">Current Date:</span> {booking.date}
            </p>
            <p>
              <span className="font-bold">Current Timeslot:</span>{" "}
              {booking.timeslot.from} - {booking.timeslot.to}
            </p>
            <p>
              <span className="font-bold">Mode:</span> {booking.mode}
            </p>
            <p>
              <span className="font-bold">Therapist:</span>{" "}
              {booking.therapistId?.name || "N/A"}
            </p>
          </div>
        ) : (
          <p className="text-center text-lg text-purple-200">Loading booking details...</p>
        )}

        <div className="mb-6">
          <label className="block mb-2 font-bold text-purple-200 text-sm">Select New Date</label>
          <p className="text-xs text-purple-300 mb-2">
            Use the arrows or pick a date to find an available slot.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreviousDate}
              className="bg-purple-900 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Previous Date
            </button>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-purple-200 text-purple-900 border border-purple-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="button"
              onClick={handleNextDate}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Next Date
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-pink-300 mb-4 text-center">Select New Timeslot</h2>
          {loadingTimeslots ? (
            <p className="text-center text-purple-200">Loading timeslots...</p>
          ) : availableTimeslots.length === 0 ? (
            <p className="text-center text-lg text-purple-200">
              No timeslots available for {newDate}. The therapist may be fully booked.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTimeslots.map((slot, index) => {
                const isSelected =
                  selectedTimeslot &&
                  selectedTimeslot.from === slot.from &&
                  selectedTimeslot.to === slot.to;

                let btnClasses = "px-4 py-2 rounded-lg transition font-bold ";
                if (isSelected) {
                  btnClasses += "bg-blue-600 text-white";
                } else if (slot.hasExpert) {
                  btnClasses += "bg-green-600 text-white hover:bg-green-700 cursor-pointer";
                } else {
                  btnClasses += "bg-red-600 text-white cursor-not-allowed";
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => slot.hasExpert && setSelectedTimeslot(slot)}
                    className={btnClasses}
                    disabled={!slot.hasExpert}
                  >
                    {slot.from} - {slot.to}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleReschedule}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            disabled={!selectedTimeslot}
          >
            Confirm Reschedule
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-purple-900 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
