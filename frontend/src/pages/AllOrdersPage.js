"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AllOrdersPage() {
  const [allBookings, setAllBookings] = useState([]);

  useEffect(() => {
    const handlePageReload = () => {
      const hasReloaded = sessionStorage.getItem('hasReloadedAllOrdersPage');
      if (!hasReloaded) {
        sessionStorage.setItem('hasReloadedAllOrdersPage', 'true');
        window.location.reload();
      } else {
        sessionStorage.removeItem('hasReloadedAllOrdersPage');
        fetchAllBookings();
      }
    };

    handlePageReload();
  }, []);

  const fetchAllBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('User not authenticated!', {
          position: 'top-center',
          autoClose: 3000,
        });
        return;
      }

      const response = await axios.get('https://miracle-minds.vercel.app/api/bookings/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllBookings(response.data);
    } catch (error) {
      toast.error('Error fetching all bookings!', {
        position: 'top-center',
        autoClose: 3000,
      });
      console.error('Error fetching all bookings:', error);
    }
  };

  /**
   * Helper function to check if a booking is in the past:
   *  - Combine booking.date + booking.timeslot.from to create a datetime
   *  - Parse using dayjs and compare with current time
   */
  const isPastBooking = (booking) => {
    const dateTimeString = `${booking.date} ${booking.timeslot.from}`;
    const bookingDateTime = dayjs(dateTimeString, 'YYYY-MM-DD hh:mm A');
    return bookingDateTime.isBefore(dayjs());
  };

  // Filter bookings to show only those that are in the past
  const pastBookings = allBookings.filter((booking) => isPastBooking(booking));

  return (
    <div className="p-8 bg-gradient-to-br from-purple-900 via-pink-600 to-white min-h-screen">
      <h1 className="text-4xl font-extrabold text-white mb-8 text-center">
        Past Orders
      </h1>

      {pastBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-purple-800 rounded-lg">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b border-purple-700 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  Therapy
                </th>
                <th className="px-6 py-3 border-b border-purple-700 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 border-b border-purple-700 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  Timeslot
                </th>
                <th className="px-6 py-3 border-b border-purple-700 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pastBookings.map((booking) => {
                const therapyName = booking.therapies[0]?.name || 'N/A';
                const formattedDate = dayjs(booking.date).format('MMMM D, YYYY');
                const formattedTimeslot = `${booking.timeslot.from} - ${booking.timeslot.to}`;
                return (
                  <tr key={booking._id} className="hover:bg-purple-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {therapyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formattedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formattedTimeslot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-600 text-white">
                        Completed
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-white text-2xl">No past orders found.</p>
      )}
    </div>
  );
}
