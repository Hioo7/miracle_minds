'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminUpcomingBookingsPage() {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const fetchUpcomingBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://miracle-minds.vercel.app/api/bookings/admin/upcoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpcomingBookings(response.data);
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      toast.error("Failed to fetch upcoming bookings.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  // Instead of physically deleting, we call an endpoint that sets isCanceled: true
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("token");
      // Call the new "cancel" endpoint (or a put/patch)
      await axios.patch(`https://miracle-minds.vercel.app/api/bookings/admin/cancel/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking canceled successfully.", {
        position: "top-center",
        autoClose: 3000,
      });
      fetchUpcomingBookings();
    } catch (error) {
      console.error("Error canceling booking:", error);
      toast.error("Failed to cancel booking.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="p-6 bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95]">
      <h1 className="text-2xl font-bold mb-4">Admin - Upcoming Bookings</h1>
      {upcomingBookings.length > 0 ? (
        <div className="overflow-auto">
          <table className="w-full text-left text-[#4c1d95]">
            <thead>
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Therapies</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Timeslot</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.map((booking) => {
                const userName = booking.userId ? booking.userId.name : "No User";
                const therapyNames = booking.therapies.map((t) => t.name).join(", ");
                return (
                  <tr key={booking._id} className="border-b border-[#d8b4fe]">
                    <td className="px-4 py-2">{userName}</td>
                    <td className="px-4 py-2">{therapyNames}</td>
                    <td className="px-4 py-2">{booking.date}</td>
                    <td className="px-4 py-2">
                      {booking.timeslot.from} - {booking.timeslot.to}
                    </td>
                    <td className="px-4 py-2">{booking.status}</td>
                    <td className="px-4 py-2 space-x-2">
                      <Link
                        to={`/admin-dashboard/bookings/detail/${booking._id}`}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded"
                      >
                        View
                      </Link>
                      <Link
                        to={`/admin-dashboard/bookings/reschedule/${booking._id}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                      >
                        Reschedule
                      </Link>
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No upcoming bookings found.</p>
      )}
    </div>
  );
}