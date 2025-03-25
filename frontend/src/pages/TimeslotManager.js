'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

export default function TimeslotManager() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [timeslots, setTimeslots] = useState([]);
  const [newSlot, setNewSlot] = useState({ from: '', to: '' });
  const [selectedDates, setSelectedDates] = useState([]);
  const [recurringDays, setRecurringDays] = useState([]); // For weekly days selection
  const [isLoading, setIsLoading] = useState(false);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch timeslots when the selected date changes
  useEffect(() => {
    const fetchTimeslots = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://miracle-minds.vercel.app/api/timeslots?date=${selectedDate.format('YYYY-MM-DD')}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTimeslots(response.data);
      } catch (error) {
        console.error('Error fetching timeslots:', error);
        toast.error('Failed to fetch timeslots. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeslots();
  }, [selectedDate]);

  // Add a new timeslot
  const addTimeslot = () => {
    if (newSlot.from && newSlot.to && newSlot.from < newSlot.to) {
      setTimeslots([...timeslots, newSlot]);
      setNewSlot({ from: '', to: '' });
    } else {
      toast.error('Invalid timeslot. Ensure "from" time is earlier than "to" time.');
    }
  };

  // Save timeslots to the backend
  const saveTimeslots = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { date: selectedDate.format('YYYY-MM-DD'), timeslots };
      await axios.post('https://miracle-minds.vercel.app/api/timeslots', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Timeslots saved successfully!');
    } catch (error) {
      console.error('Error saving timeslots:', error);
      toast.error('Failed to save timeslots. Please try again.');
    }
  };

  // Copy timeslots to selected dates
  const copyTimeslots = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date to copy timeslots.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = {
        sourceDate: selectedDate.format('YYYY-MM-DD'),
        targetDates: selectedDates.map((date) => date.format('YYYY-MM-DD')),
      };
      await axios.post('https://miracle-minds.vercel.app/api/timeslots/copy', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Timeslots copied successfully!');
      setSelectedDates([]);
    } catch (error) {
      console.error('Error copying timeslots:', error);
      toast.error('Failed to copy timeslots. Please try again.');
    }
  };

  // Apply recurring timeslots for selected weekdays
  const applyRecurringTimeslots = async () => {
    if (recurringDays.length === 0) {
      toast.error('Please select at least one day of the week.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = { sourceDate: selectedDate.format('YYYY-MM-DD'), recurringDays };
      await axios.post('https://miracle-minds.vercel.app/api/timeslots/recurring', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Recurring timeslots applied successfully!');
      setRecurringDays([]);
    } catch (error) {
      console.error('Error applying recurring timeslots:', error);
      toast.error('Failed to apply recurring timeslots. Please try again.');
    }
  };

  // Remove a timeslot
  const removeTimeslot = (index) => {
    setTimeslots(timeslots.filter((_, i) => i !== index));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-6 bg-gray-900 text-gray-200 rounded-md">
        <h1 className="text-2xl font-bold mb-4">Timeslot Manager</h1>

        {/* Select Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Date</label>
          <DatePicker
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            renderInput={({ inputRef, inputProps }) => (
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  {...inputProps}
                  className="bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2 w-full"
                />
              </div>
            )}
          />
        </div>

        {/* Add Timeslot */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Add Timeslot</label>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="time"
              value={newSlot.from}
              onChange={(e) => setNewSlot({ ...newSlot, from: e.target.value })}
              className="bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2"
            />
            <span>to</span>
            <input
              type="time"
              value={newSlot.to}
              onChange={(e) => setNewSlot({ ...newSlot, to: e.target.value })}
              className="bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2"
            />
            <button
              onClick={addTimeslot}
              className="bg-pink-600 text-white px-3 py-2 rounded-md hover:bg-pink-700"
            >
              Add Slot
            </button>
          </div>
        </div>

        {/* Timeslots List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Timeslots for {selectedDate.format('DD-MM-YYYY')}
          </h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-2">
              {timeslots.map((slot, index) => (
                <li
                  key={index}
                  className="bg-gray-800 px-4 py-2 rounded-md flex justify-between items-center"
                >
                  <span>
                    {slot.from} - {slot.to}
                  </span>
                  <button
                    onClick={() => removeTimeslot(index)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weekly Days Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Apply to Recurring Days</h2>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((day) => (
              <button
                key={day}
                onClick={() =>
                  setRecurringDays((prev) =>
                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                  )
                }
                className={`px-3 py-2 rounded-md ${
                  recurringDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                } hover:bg-purple-700`}
              >
                {day}
              </button>
            ))}
          </div>
          <button
            onClick={applyRecurringTimeslots}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Apply Recurring Timeslots
          </button>
        </div>

        {/* Copy Timeslots to Other Dates */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Copy Timeslots to Other Dates</label>
          <DatePicker
            value={null}
            onChange={(newDate) => {
              if (newDate && !selectedDates.some((date) => date.isSame(newDate, 'day'))) {
                setSelectedDates([...selectedDates, newDate]);
              }
            }}
            renderInput={({ inputRef, inputProps }) => (
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  {...inputProps}
                  className="bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2 w-full"
                  placeholder="Select dates to copy"
                />
              </div>
            )}
          />
          <div className="mt-2 space-x-2">
            {selectedDates.map((date, index) => (
              <span
                key={index}
                className="bg-gray-800 px-2 py-1 rounded-md text-sm"
              >
                {date.format('DD-MM-YYYY')}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={saveTimeslots}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Save Timeslots
          </button>
          <button
            onClick={copyTimeslots}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Copy Timeslots
          </button>
          <button
            onClick={() => setTimeslots([])}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </LocalizationProvider>
  );
}
