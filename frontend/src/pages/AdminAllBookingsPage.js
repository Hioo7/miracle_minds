"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminAllBookingsPage() {
  const [allBookings, setAllBookings] = useState([]);

  // Filters
  const [therapyId, setTherapyId] = useState("");
  const [month, setMonth] = useState(""); // format "YYYY-MM"
  const [date, setDate] = useState("");   // format "YYYY-MM-DD"
  const [status, setStatus] = useState("");
  // Combined Contact filter: email or phone
  const [contact, setContact] = useState("");

  // For dropdown of therapies
  const [therapies, setTherapies] = useState([]);

  useEffect(() => {
    fetchTherapies();
    fetchAllBookings({});
  }, []);

  const fetchTherapies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://miracle-minds.vercel.app/api/therapies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTherapies(res.data);
    } catch (error) {
      console.error("Error fetching therapies:", error);
    }
  };

  const fetchAllBookings = async (params) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://miracle-minds.vercel.app/api/bookings/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAllBookings(res.data);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
    }
  };

  const handleSearch = () => {
    const params = {};
    if (therapyId) params.therapyId = therapyId;
    if (month) params.month = month;
    if (date) params.date = date;
    if (status) params.status = status;
    if (contact) params.contact = contact;
    fetchAllBookings(params);
  };

  // Trigger search whenever contact changes
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact]);

  const handleReset = () => {
    setTherapyId("");
    setMonth("");
    setDate("");
    setStatus("");
    setContact("");
    fetchAllBookings({});
  };

  // Group bookings into categories
  const groupedBookings = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Last Week": [],
      "Last Month": [],
      "Long Ago": [],
    };

    const today = dayjs().startOf("day");
    const yesterday = dayjs().subtract(1, "day").startOf("day");
    const lastWeek = dayjs().subtract(7, "day").startOf("day");
    const lastMonth = dayjs().subtract(1, "month").startOf("day");

    allBookings.forEach((booking) => {
      const bDate = dayjs(booking.date, "YYYY-MM-DD");
      if (bDate.isSame(today, "day")) {
        groups["Today"].push(booking);
      } else if (bDate.isSame(yesterday, "day")) {
        groups["Yesterday"].push(booking);
      } else if (bDate.isAfter(lastWeek)) {
        groups["Last Week"].push(booking);
      } else if (bDate.isAfter(lastMonth)) {
        groups["Last Month"].push(booking);
      } else {
        groups["Long Ago"].push(booking);
      }
    });

    return groups;
  }, [allBookings]);

  return (
    <div className="p-6 bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95]">
      <h1 className="text-2xl font-bold mb-4">Admin - All Bookings</h1>

      {/* Filter Section (Group 1) */}
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block mb-1 text-sm text-[#4c1d95]">Therapy</label>
          <select
            value={therapyId}
            onChange={(e) => setTherapyId(e.target.value)}
            className="bg-white text-[#4c1d95] border border-[#d8b4fe] px-3 py-2 rounded"
          >
            <option value="">All</option>
            {therapies.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm text-[#4c1d95]">Month (YYYY-MM)</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-white text-[#4c1d95] border border-[#d8b4fe] px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-[#4c1d95]">Date (YYYY-MM-DD)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white text-[#4c1d95] border border-[#d8b4fe] px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-[#4c1d95]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white text-[#4c1d95] border border-[#d8b4fe] px-3 py-2 rounded"
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELED">CANCELED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Contact Filter: Email / Phone */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1">
          <label className="block mb-1 text-sm text-[#4c1d95]">Email or Phone</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="bg-white text-[#4c1d95] border border-[#d8b4fe] px-3 py-2 rounded w-full"
            placeholder="Enter email or phone"
          />
        </div>
      </div>

      {/* Reset Filters */}
      <div className="mb-4">
        <button
          onClick={handleReset}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Reset Filters
        </button>
        <button
          onClick={handleSearch}
          className="ml-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {/* Grouped Bookings Display */}
      {["Today", "Yesterday", "Last Week", "Last Month", "Long Ago"].map((group) => (
        <div key={group} className="mb-6">
          {groupedBookings[group].length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-2 text-[#4c1d95]">{group}</h2>
              <div className="overflow-auto">
                <table className="w-full text-left text-[#4c1d95] mb-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Therapies</th>
                      <th className="px-4 py-2">Mode</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Timeslot</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBookings[group].map((booking) => {
                      // Show "CANCELED" if isCanceled is true
                      const displayedStatus = booking.isCanceled
                        ? "CANCELED"
                        : booking.status;

                      const userName = booking.userId ? booking.userId.name : "No User";
                      const therapyNames = booking.therapies
                        .map((t) => t.name)
                        .join(", ");

                      return (
                        <tr key={booking._id} className="border-b border-[#d8b4fe]">
                          <td className="px-4 py-2">{userName}</td>
                          <td className="px-4 py-2">{therapyNames}</td>
                          <td className="px-4 py-2">{booking.mode}</td>
                          <td className="px-4 py-2">{booking.email || "N/A"}</td>
                          <td className="px-4 py-2">{booking.date}</td>
                          <td className="px-4 py-2">
                            {booking.timeslot.from} - {booking.timeslot.to}
                          </td>
                          <td className="px-4 py-2">{displayedStatus}</td>
                          <td className="px-4 py-2">
                            <Link
                              to={`/admin-dashboard/bookings/detail/${booking._id}`}
                              className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ))}

      {allBookings.length === 0 && (
        <p className="text-center text-[#4c1d95]">No bookings found.</p>
      )}
    </div>
  );
}
