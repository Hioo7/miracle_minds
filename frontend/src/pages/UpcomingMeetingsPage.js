"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpcomingMeetingsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User not authenticated!", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }
      const res = await axios.get("https://miracle-minds.vercel.app/api/bookings/upcoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpcoming(res.data);
    } catch (error) {
      toast.error("Failed to fetch upcoming bookings!", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("Error fetching upcoming bookings:", error);
    }
  };

  const canReschedule = (booking) => {
    const dtStr = `${booking.date} ${booking.timeslot.from}`;
    const bookingTime = dayjs(dtStr, "YYYY-MM-DD HH:mm");
    const diffHours = bookingTime.diff(dayjs(), "hour");
    return diffHours >= 4;
  };

  const canJoinMeeting = (booking) => {
    if (booking.mode?.toUpperCase() !== "ONLINE") return false;
    const dtStr = `${booking.date} ${booking.timeslot.from}`;
    const bookingTime = dayjs(dtStr, "YYYY-MM-DD HH:mm");
    const diffMinutes = bookingTime.diff(dayjs(), "minute");
    return diffMinutes <= 10 && diffMinutes >= 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-pink-600 to-white p-8">
      <h1 className="text-4xl font-extrabold text-white text-center mb-8">
        Upcoming Meetings
      </h1>
      {upcoming.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcoming.map((booking) => {
            const expertName = booking.therapistId?.name || "No Expert";
            const therapyName = booking.therapies[0]?.name || "N/A";
            const isCancelled =
              booking.isCanceled || booking.status === "CANCELED";
            const joinEnabled = canJoinMeeting(booking);
            const reschEnabled = canReschedule(booking);

            return (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-xl p-6 flex flex-col transition transform hover:scale-105"
              >
                <h2 className="text-2xl font-bold text-pink-600 mb-3">
                  {therapyName}
                </h2>
                <p className="text-lg text-gray-700 mb-1">
                  <span className="font-semibold">Date:</span>{" "}
                  {dayjs(booking.date).format("YYYY-MM-DD")}
                </p>
                <p className="text-lg text-gray-700 mb-1">
                  <span className="font-semibold">Timeslot:</span>{" "}
                  {booking.timeslot.from} - {booking.timeslot.to}
                </p>
                <p className="text-lg text-gray-700 mb-1">
                  <span className="font-semibold">Mode:</span> {booking.mode}
                </p>
                <p className="text-lg text-gray-700 mb-3">
                  <span className="font-semibold">Expert:</span> {expertName}
                </p>
                {isCancelled && (
                  <p className="text-red-600 font-extrabold text-lg mb-3">
                    CANCELED
                  </p>
                )}
                <div className="mt-auto flex flex-col gap-2">
                  {(!isCancelled && joinEnabled) && (
                    <Link
                      to={`/meeting/${booking._id}`}
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg text-center hover:bg-pink-700 transition"
                    >
                      Join Meeting
                    </Link>
                  )}
                  {(!isCancelled && reschEnabled) && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/upcoming-meetings/bookings/reschedule/${booking._id}`)
                      }
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-700 transition"
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-xl text-white">No upcoming meetings.</p>
      )}
    </div>
  );
}
