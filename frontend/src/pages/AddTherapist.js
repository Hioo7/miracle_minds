"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import uploadImage from "../helpers/uploadImage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function TherapistManager() {
  // List of all therapists in the system
  const [therapists, setTherapists] = useState([]);

  // Whether we're showing the "Add/Edit Therapist" modal
  const [showForm, setShowForm] = useState(false);

  // Whether we are editing an existing therapist or creating a new one
  const [isEditing, setIsEditing] = useState(false);

  // The ID of the therapist being edited (if isEditing = true)
  const [editId, setEditId] = useState(null);

  // The top-level fields for the therapist (name, about, photo, etc.)
  const [therapist, setTherapist] = useState({
    name: "",
    expertise: [],
    about: "",
    photo: "",
    supportedModes: [],
  });

  // The photo file (if user uploads a new one)
  const [photoFile, setPhotoFile] = useState(null);

  // List of all available therapies (for user to pick from)
  const [therapies, setTherapies] = useState([]);

  // ===================== AVAILABILITY (Date-based) =====================
  // userSlots = timeslots for the currently selected date
  const [userSlots, setUserSlots] = useState([]);
  // The date we’re currently editing timeslots for
  const [selectedDate, setSelectedDate] = useState(dayjs());
  // The new timeslot the user is adding, e.g. { from, to }
  const [newSlot, setNewSlot] = useState({ from: "", to: "" });

  // For Recurring & Copy
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [recurringDays, setRecurringDays] = useState([]);
  const [copyDates, setCopyDates] = useState([]);

  // Simple loading state for availability fetch
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // ===================== Fetch All Therapists & Therapies =====================
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const [therapistsRes, therapiesRes] = await Promise.all([
          axios.get("https://miracle-minds.vercel.app/api/therapists", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://miracle-minds.vercel.app/api/therapies", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setTherapists(therapistsRes.data);
        setTherapies(therapiesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data!", { position: "top-center" });
      }
    })();
  }, []);

  // ===================== Photo Handler =====================
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTherapist((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ===================== Create / Edit Therapist =====================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTherapist((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle checkboxes for "ONLINE", "OFFLINE"
  const toggleSupportedMode = (modeValue) => {
    if (therapist.supportedModes.includes(modeValue)) {
      setTherapist((prev) => ({
        ...prev,
        supportedModes: prev.supportedModes.filter((m) => m !== modeValue),
      }));
    } else {
      setTherapist((prev) => ({
        ...prev,
        supportedModes: [...prev.supportedModes, modeValue],
      }));
    }
  };

  // Expertise add/remove
  const addExpertise = (therapyItem) => {
    if (!therapist.expertise.includes(therapyItem.name)) {
      setTherapist((prev) => ({
        ...prev,
        expertise: [...prev.expertise, therapyItem.name],
      }));
    }
  };
  const removeExpertise = (therapyName) => {
    setTherapist((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((t) => t !== therapyName),
    }));
  };

  // Submit the basic therapist info (name, about, photo, etc.)
  const handleSubmitTherapist = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = therapist.photo;
      if (photoFile) {
        // Upload the photo
        const uploadResponse = await uploadImage(photoFile);
        photoUrl = uploadResponse.secure_url;
      }
      const token = localStorage.getItem("token");
      const payload = { ...therapist, photo: photoUrl };

      if (isEditing) {
        // Update existing
        await axios.put(`https://miracle-minds.vercel.app/api/therapists/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Therapist updated successfully!", { position: "top-center" });
      } else {
        // Create new
        const res = await axios.post("https://miracle-minds.vercel.app/api/therapists", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Therapist added successfully!", { position: "top-center" });
        // We get the new therapist ID from the response if needed:
        const newId = res.data.therapist._id;
        setEditId(newId); // so we can do availability changes if we want
        setIsEditing(true);
      }

      // Refresh the therapist list
      const therapistList = await axios.get("https://miracle-minds.vercel.app/api/therapists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTherapists(therapistList.data);
    } catch (error) {
      console.error("Error saving therapist:", error);
      toast.error("Failed to save therapist. Please try again.", { position: "top-center" });
    }
  };

  // Delete an existing therapist
  const deleteTherapist = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://miracle-minds.vercel.app/api/therapists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Therapist deleted successfully!", { position: "top-center" });
      setTherapists((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Error deleting therapist:", error);
      toast.error("Failed to delete therapist.", { position: "top-center" });
    }
  };

  // ===================== Availability (like ExpertAvailability) =====================
  // Whenever selectedDate changes, fetch that day's slots from the server
  useEffect(() => {
    if (isEditing && editId) {
      fetchDaySlots(); // fetch availability for the newly-selected date
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, editId]);

  const fetchDaySlots = async () => {
    if (!editId) return; // no therapist ID yet
    setIsLoadingSlots(true);
    try {
      const token = localStorage.getItem("token");
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const res = await axios.get(
        `https://miracle-minds.vercel.app/api/therapists/${editId}/availability?date=${dateStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserSlots(res.data || []);
    } catch (error) {
      console.error("Error fetching day slots:", error);
      toast.error("Failed to fetch day availability.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Add a new slot to userSlots (front-end only)
  const addSlot = () => {
    if (!newSlot.from || !newSlot.to) {
      toast.error("Please enter both 'from' and 'to' times.");
      return;
    }
    if (newSlot.from >= newSlot.to) {
      toast.error("'From' must be earlier than 'To'.");
      return;
    }
    setUserSlots((prev) => [...prev, { ...newSlot }]);
    setNewSlot({ from: "", to: "" });
  };

  // Remove a slot from userSlots array
  const removeSlot = (index) => {
    setUserSlots((prev) => prev.filter((_, i) => i !== index));
  };

  // Save the timeslots for the selectedDate to the server
  const handleSaveAvailability = async () => {
    if (!editId) {
      toast.error("No therapist ID found. Save or create the therapist first.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const dateStr = selectedDate.format("YYYY-MM-DD");
      await axios.post(
        `https://miracle-minds.vercel.app/api/therapists/${editId}/availability`,
        { date: dateStr, slots: userSlots },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability.");
    }
  };

  // ========== Apply Recurring Availability ==========
  const handleApplyRecurring = async () => {
    if (!editId) {
      toast.error("No therapist ID found. Save or create the therapist first.");
      return;
    }
    if (recurringDays.length === 0) {
      toast.error("Select at least one weekday for recurring availability.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const sourceDate = selectedDate.format("YYYY-MM-DD");
      await axios.post(
        `https://miracle-minds.vercel.app/api/therapists/${editId}/availability/recurring`,
        { sourceDate, recurringDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Recurring availability applied successfully!");
      setRecurringDays([]);
    } catch (error) {
      console.error("Error applying recurring availability:", error);
      toast.error("Failed to apply recurring availability.");
    }
  };

  // ========== Copy Availability to Multiple Dates ==========
  const handleCopyAvailability = async () => {
    if (!editId) {
      toast.error("No therapist ID found. Save or create the therapist first.");
      return;
    }
    if (copyDates.length === 0) {
      toast.error("Select at least one target date to copy to.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const sourceDate = selectedDate.format("YYYY-MM-DD");
      const targetDates = copyDates.map((d) => d.format("YYYY-MM-DD"));
      await axios.post(
        `https://miracle-minds.vercel.app/api/therapists/${editId}/availability/copy`,
        { sourceDate, targetDates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Availability copied successfully!");
      setCopyDates([]);
    } catch (error) {
      console.error("Error copying availability:", error);
      toast.error("Failed to copy availability.");
    }
  };

  // ===================== RENDER =====================
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-6 bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#4c1d95]">Therapist Manager</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
              setEditId(null);
              setTherapist({
                name: "",
                expertise: [],
                about: "",
                photo: "",
                supportedModes: [],
              });
              setUserSlots([]); // clear slots
              setNewSlot({ from: "", to: "" });
              setRecurringDays([]);
              setCopyDates([]);
              setSelectedDate(dayjs());
            }}
            className="bg-[#db2777] text-white px-4 py-2 rounded hover:bg-[#be185d]"
          >
            Add Therapist
          </button>
        </div>

        {/* Therapist List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapists.map((t) => (
            <div
              key={t._id}
              className="bg-[#f3e8ff] border border-[#d8b4fe] rounded p-4 flex flex-col items-center text-center"
            >
              <img
                src={t.photo}
                alt={t.name}
                className="h-32 w-32 rounded-full object-cover mb-4"
              />
              <h2 className="text-lg font-bold mb-1 text-[#4c1d95]">{t.name}</h2>
              <p className="text-sm text-[#4c1d95] mb-2">{t.expertise.join(", ")}</p>
              <p className="text-sm text-[#4c1d95] mb-2">{t.about}</p>
              <p className="text-sm text-[#4c1d95] mb-2">
                <span className="font-semibold">Modes:</span> {t.supportedModes.join(", ")}
              </p>
              <div className="flex space-x-2">
                <button
                  className="bg-[#db2777] text-white px-3 py-1 rounded hover:bg-[#be185d]"
                  onClick={() => {
                    // Start editing the therapist
                    setShowForm(true);
                    setIsEditing(true);
                    setEditId(t._id);
                    setTherapist({
                      name: t.name,
                      expertise: t.expertise,
                      about: t.about,
                      photo: t.photo,
                      supportedModes: t.supportedModes,
                    });
                    setUserSlots([]); // We'll fetch slots for a date once user picks it
                    setNewSlot({ from: "", to: "" });
                    setRecurringDays([]);
                    setCopyDates([]);
                    setSelectedDate(dayjs());
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-[#9333ea] text-white px-3 py-1 rounded hover:bg-[#7e22ce]"
                  onClick={() => deleteTherapist(t._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ADD/EDIT Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-[#4c1d95] bg-opacity-75 flex items-start justify-center z-50 py-8">
            <div className="bg-gradient-to-tr from-[#ffffff] to-[#ffffff] p-6 rounded-md w-full max-w-2xl overflow-y-auto max-h-[90vh] border border-[#d8b4fe]">
              <h2 className="text-xl font-bold mb-4 text-[#4c1d95]">
                {isEditing ? "Edit Therapist" : "Add Therapist"}
              </h2>

              {/* ========== 1) Basic Therapist Info ========== */}
              <form onSubmit={handleSubmitTherapist} className="space-y-4">
                {/* Photo */}
                <div className="flex flex-col items-center">
                  <label className="relative group cursor-pointer w-32 h-32 flex items-center justify-center rounded-full border-2 border-dashed border-[#d8b4fe] text-[#4c1d95]">
                    {therapist.photo ? (
                      <img
                        src={therapist.photo}
                        alt="Profile Preview"
                        className="w-32 h-32 object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-4xl">+</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <p className="mt-2 text-sm text-[#4c1d95]">
                    {therapist.photo ? "Change Profile Picture" : "Add Profile Picture"}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#4c1d95]">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={therapist.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#d8b4fe] rounded px-3 py-2 text-[#4c1d95]"
                    required
                  />
                </div>

                {/* Expertise */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#4c1d95]">Select Expertise</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#f3e8ff] p-3 rounded border border-[#d8b4fe]">
                    {therapies.map((therapy) => {
                      const selected = therapist.expertise.includes(therapy.name);
                      return (
                        <div
                          key={therapy._id}
                          onClick={() => addExpertise(therapy)}
                          className={`cursor-pointer rounded px-2 py-1 text-sm text-center transition ${
                            selected
                              ? "bg-[#db2777] text-white"
                              : "bg-[#f3e8ff] text-[#4c1d95] hover:bg-[#fbcfe8] hover:text-[#831843]"
                          }`}
                        >
                          {therapy.name}
                        </div>
                      );
                    })}
                  </div>
                  {therapist.expertise.length > 0 && (
                    <p className="mt-2 text-sm text-[#4c1d95]">
                      Selected: {therapist.expertise.join(", ")}
                    </p>
                  )}
                </div>

                {/* About */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#4c1d95]">About</label>
                  <textarea
                    name="about"
                    value={therapist.about}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#d8b4fe] rounded px-3 py-2 text-[#4c1d95]"
                    placeholder="Short description about the therapist"
                    rows="3"
                    required
                  ></textarea>
                </div>

                {/* Supported Modes */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#4c1d95]">Supported Modes</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center text-[#4c1d95]">
                      <input
                        type="checkbox"
                        name="supportedModes"
                        value="ONLINE"
                        checked={therapist.supportedModes.includes("ONLINE")}
                        onChange={() => toggleSupportedMode("ONLINE")}
                        className="mr-2"
                      />
                      Online
                    </label>
                    <label className="flex items-center text-[#4c1d95]">
                      <input
                        type="checkbox"
                        name="supportedModes"
                        value="OFFLINE"
                        checked={therapist.supportedModes.includes("OFFLINE")}
                        onChange={() => toggleSupportedMode("OFFLINE")}
                        className="mr-2"
                      />
                      Offline
                    </label>
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    className="bg-[#9333ea] hover:bg-[#7e22ce] text-white px-4 py-2 rounded"
                  >
                    {isEditing ? "Update Info" : "Save New Therapist"}
                  </button>
                </div>
              </form>

              {/* ========== 2) Availability Editor (only if editing) ========== */}
              {isEditing && editId && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4 text-[#4c1d95]">
                    Manage Availability for {therapist.name}
                  </h3>

                  {/* Date Picker to Select Which Date to Edit */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-[#4c1d95]">Select Date</label>
                    <DatePicker
                      value={selectedDate}
                      onChange={(newVal) => {
                        if (newVal) setSelectedDate(newVal);
                      }}
                      renderInput={({ inputRef, inputProps, disabled }) => (
                        <input
                          ref={inputRef}
                          {...inputProps}
                          disabled={disabled}
                          className="bg-white text-[#4c1d95] border border-[#d8b4fe] rounded-md px-3 py-2 w-full mb-2"
                        />
                      )}
                    />
                  </div>

                  {/* Add a new timeslot */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold mb-2 text-[#4c1d95]">Add Timeslot</h4>
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm text-[#4c1d95]">From</label>
                        <input
                          type="time"
                          value={newSlot.from}
                          onChange={(e) => setNewSlot({ ...newSlot, from: e.target.value })}
                          className="bg-white text-[#4c1d95] border border-[#d8b4fe] rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#4c1d95]">To</label>
                        <input
                          type="time"
                          value={newSlot.to}
                          onChange={(e) => setNewSlot({ ...newSlot, to: e.target.value })}
                          className="bg-white text-[#4c1d95] border border-[#d8b4fe] rounded px-3 py-2"
                        />
                      </div>
                      <button
                        onClick={addSlot}
                        className="bg-[#db2777] hover:bg-[#be185d] text-white px-4 py-2 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Existing slots for the chosen date */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold mb-2 text-[#4c1d95]">
                      Timeslots for {selectedDate.format("DD-MM-YYYY")}
                    </h4>
                    {isLoadingSlots ? (
                      <p className="text-[#4c1d95]">Loading...</p>
                    ) : userSlots.length === 0 ? (
                      <p className="text-[#4c1d95]">No timeslots added yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {userSlots.map((slot, idx) => (
                          <li
                            key={idx}
                            className="bg-[#f3e8ff] p-2 rounded flex justify-between items-center border border-[#d8b4fe]"
                          >
                            <span>
                              {slot.from} - {slot.to}
                            </span>
                            <button
                              onClick={() => removeSlot(idx)}
                              className="text-[#9333ea] hover:bg-[#fbcfe8] hover:text-[#831843]"
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={handleSaveAvailability}
                      className="mt-4 bg-[#9333ea] hover:bg-[#7e22ce] text-white px-4 py-2 rounded"
                    >
                      Save Availability for {selectedDate.format("DD-MM-YYYY")}
                    </button>
                  </div>

                  {/* Recurring Availability */}
                  <div className="mb-4 bg-[#f3e8ff] p-4 rounded border border-[#d8b4fe]">
                    <h4 className="text-md font-semibold mb-2 text-[#4c1d95]">Apply Recurring Availability</h4>
                    <p className="text-sm text-[#4c1d95] mb-2">
                      This will apply your current timeslots for {selectedDate.format("DD-MM-YYYY")}{" "}
                      to the selected weekdays for the next year.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {weekdays.map((day) => (
                        <button
                          key={day}
                          onClick={() =>
                            setRecurringDays((prev) =>
                              prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                            )
                          }
                          className={`px-3 py-1 rounded ${
                            recurringDays.includes(day)
                              ? "bg-[#db2777] text-white"
                              : "bg-[#f3e8ff] text-[#4c1d95] hover:bg-[#fbcfe8] hover:text-[#831843]"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {recurringDays.length > 0 && (
                      <p className="mb-2 text-sm text-[#4c1d95]">Selected: {recurringDays.join(", ")}</p>
                    )}
                    <button
                      onClick={handleApplyRecurring}
                      className="bg-[#9333ea] hover:bg-[#7e22ce] text-white px-4 py-2 rounded"
                    >
                      Apply Recurring
                    </button>
                  </div>

                  {/* Copy Availability */}
                  <div className="mb-4 bg-[#f3e8ff] p-4 rounded border border-[#d8b4fe]">
                    <h4 className="text-md font-semibold mb-2 text-[#4c1d95]">Copy Availability to Multiple Dates</h4>
                    <DatePicker
                      value={null}
                      onChange={(newDate) => newDate && setCopyDates([...copyDates, newDate])}
                      renderInput={({ inputRef, inputProps, disabled }) => (
                        <input
                          ref={inputRef}
                          {...inputProps}
                          disabled={disabled}
                          className="bg-white text-[#4c1d95] border border-[#d8b4fe] rounded-md px-3 py-2 w-full mb-2"
                          placeholder="Select target date"
                        />
                      )}
                    />
                    <div className="flex flex-wrap gap-2">
                      {copyDates.map((dt, i) => (
                        <span key={i} className="bg-white px-2 py-1 rounded text-sm border border-[#d8b4fe] text-[#4c1d95]">
                          {dt.format("DD-MM-YYYY")}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleCopyAvailability}
                      className="mt-3 bg-[#db2777] hover:bg-[#be185d] text-white px-4 py-2 rounded"
                    >
                      Copy Availability
                    </button>
                  </div>
                </div>
              )}

              {/* Close/Done Button */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                  }}
                  className="bg-[#9333ea] hover:bg-[#7e22ce] text-white px-4 py-2 rounded"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}
