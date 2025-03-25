"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

export default function TherapyBooking() {
  // Step 1: Therapy
  const [therapies, setTherapies] = useState([]);
  const [selectedTherapies, setSelectedTherapies] = useState([]);

  // Step 2: Mode
  const [mode, setMode] = useState(null);

  // Step 3: Profile
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");

  // Step 4: Date
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Step 5: Timeslot
  const [timeslots, setTimeslots] = useState([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);

  // Current step (1..5)
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        // Therapies
        const therapyRes = await axios.get("https://miracle-minds.vercel.app/api/therapies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTherapies(therapyRes.data);

        // Profiles
        const userRes = await axios.get("https://miracle-minds.vercel.app/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userProfiles = userRes.data?.profiles || [];
        setProfiles(userProfiles);

        // if exactly 1, auto-select
        if (userProfiles.length === 1) {
          setSelectedProfile(userProfiles[0]._id);
        }
      } catch (error) {
        toast.error("Error fetching therapies or profiles!", {
          position: "top-center",
          autoClose: 3000,
        });
        console.error("Error:", error);
      }
    };
    fetchData();
  }, []);

  // whenever profile, therapies, date, mode changes => GET /timeslots
  useEffect(() => {
    const fetchTimeslots = async () => {
      if (!selectedProfile || selectedTherapies.length === 0 || !mode) {
        setTimeslots([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const dateStr = selectedDate.format("YYYY-MM-DD");
        const therapyIds = selectedTherapies.join(",");

        const url = `https://miracle-minds.vercel.app/api/bookings/timeslots?date=${dateStr}&mode=${mode}&therapies=${therapyIds}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let avail = res.data || [];
        // filter out past times if date is "today"
        const todayStr = dayjs().format("YYYY-MM-DD");
        if (dateStr === todayStr) {
          const now = dayjs();
          avail = avail.filter((slot) => {
            const slotTime = dayjs(`${dateStr} ${slot.from}`, "YYYY-MM-DD HH:mm");
            return slotTime.isAfter(now);
          });
        }

        setTimeslots(avail);
        setSelectedTimeslot(null);
      } catch (error) {
        console.error("Error fetching timeslots:", error);
        toast.error("Error fetching timeslots!", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    };
    fetchTimeslots();
  }, [selectedProfile, selectedTherapies, selectedDate, mode]);

  // step nav
  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // step 1: single therapy selection
  const handleTherapySelection = (therapyId) => {
    setSelectedTherapies([therapyId]);
  };

  // step 2: mode
  const handleModeSelection = (chosenMode) => {
    setMode(chosenMode);
  };

  // step 4: date nav
  const handlePreviousDate = () => {
    const newDate = selectedDate.subtract(1, "day");
    if (newDate.isBefore(dayjs(), "day")) {
      toast.warning("Cannot go to a past date!");
      return;
    }
    setSelectedDate(newDate);
  };
  const handleNextDate = () => {
    setSelectedDate(selectedDate.add(1, "day"));
  };

  // final step => add to cart => /book
  const addToCart = async () => {
    if (
      !selectedProfile ||
      selectedTherapies.length === 0 ||
      !selectedTimeslot ||
      !mode
    ) {
      toast.error("Please select all required fields!", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        therapies: selectedTherapies,
        date: selectedDate.format("YYYY-MM-DD"),
        timeslot: {
          from: selectedTimeslot.from,
          to: selectedTimeslot.to,
        },
        profileId: selectedProfile,
        mode,
        // pass the chosen therapist ID
        therapistId: selectedTimeslot.therapistId,
      };

      const resp = await axios.post("https://miracle-minds.vercel.app/api/bookings/book", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(resp.data.message || "Added to cart successfully!", {
        position: "top-center",
        autoClose: 3000,
      });

      // reset
      setSelectedTherapies([]);
      setMode(null);
      setSelectedTimeslot(null);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(
        error.response?.data?.message || "Failed to add to cart. Please try again.",
        { position: "top-center", autoClose: 3000 }
      );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 p-8">
        <div className="max-w-5xl mx-auto bg-purple-800 rounded-lg shadow-2xl p-8">
          {/* Step Nav */}
          <div className="flex justify-between mb-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="bg-purple-900 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 5}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Step 1: Select Therapy */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-6 text-center">
                Select Therapy
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {therapies.map((therapy) => {
                  const isSelected = selectedTherapies.includes(therapy._id);
                  return (
                    <div
                      key={therapy._id}
                      onClick={() => handleTherapySelection(therapy._id)}
                      className={`cursor-pointer p-6 rounded-lg transition transform hover:scale-105 border ${
                        isSelected
                          ? "border-pink-400 bg-pink-100"
                          : "border-purple-600 bg-purple-700"
                      }`}
                    >
                      <h3 className="text-xl font-bold text-white mb-2">
                        {therapy.name}
                      </h3>
                      <p className="text-sm text-purple-200">
                        {therapy.description || "No description provided."}
                      </p>
                      <p className="mt-3 font-semibold text-pink-400">
                        ₹{therapy.cost}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Choose Mode */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-6 text-center">
                Choose Mode of Session
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div
                  onClick={() => handleModeSelection("ONLINE")}
                  className={`cursor-pointer p-8 rounded-lg transition transform hover:scale-105 text-center ${
                    mode === "ONLINE" ? "bg-pink-600 text-white" : "bg-purple-900 text-purple-200"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">Online</h3>
                  <p className="text-sm">Conduct via video call.</p>
                </div>
                <div
                  onClick={() => handleModeSelection("OFFLINE")}
                  className={`cursor-pointer p-8 rounded-lg transition transform hover:scale-105 text-center ${
                    mode === "OFFLINE" ? "bg-pink-600 text-white" : "bg-purple-900 text-purple-200"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">Offline</h3>
                  <p className="text-sm">In-person at our center.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Profile */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-6 text-center">
                Select Profile
              </h2>
              {profiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profiles.map((profile) => (
                    <div
                      key={profile._id}
                      onClick={() => setSelectedProfile(profile._id)}
                      className={`cursor-pointer p-6 rounded-lg transition transform hover:scale-105 text-center border ${
                        selectedProfile === profile._id
                          ? "bg-pink-600 text-white border-pink-400"
                          : "bg-purple-900 text-purple-200 border-purple-600 hover:bg-purple-800"
                      }`}
                    >
                      {profile.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-purple-200 mb-4">
                    No profiles available. Please create one.
                  </p>
                  <Link
                    to="/dashboard/edit-profile"
                    className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
                  >
                    Add Profile
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Date */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-6 text-center">
                Select Date
              </h2>
              <DateCalendar
                value={selectedDate}
                onChange={(newVal) => newVal && setSelectedDate(newVal)}
                className="bg-purple-900 rounded-lg p-6 shadow-lg"
                disablePast
              />
            </div>
          )}

          {/* Step 5: Select Timeslot */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-6 text-center">
                Select Timeslot
              </h2>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePreviousDate}
                  className="bg-purple-900 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                >
                  Previous Date
                </button>
                <p className="text-xl font-semibold text-purple-200">
                  {selectedDate.format("YYYY-MM-DD")}
                </p>
                <button
                  onClick={handleNextDate}
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
                >
                  Next Date
                </button>
              </div>
              {timeslots.length === 0 ? (
                <p className="text-center text-xl text-purple-200">
                  No timeslots available for this date.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timeslots.map((slot, idx) => {
                    const isSelected =
                      selectedTimeslot &&
                      selectedTimeslot.from === slot.from &&
                      selectedTimeslot.to === slot.to;

                    let tileClasses = "";
                    if (slot.hasExpert === false) {
                      tileClasses = "bg-red-600 text-white cursor-not-allowed";
                    } else {
                      tileClasses = isSelected
                        ? "bg-pink-600 text-white"
                        : "bg-purple-900 text-purple-200 hover:bg-purple-800 cursor-pointer";
                    }
                    return (
                      <div
                        key={idx}
                        onClick={() => slot.hasExpert && setSelectedTimeslot(slot)}
                        className={`p-6 rounded-lg text-center transition transform hover:scale-105 ${tileClasses}`}
                      >
                        <p className="text-lg font-bold">
                          {slot.from} - {slot.to}
                        </p>
                        {slot.hasExpert && slot.therapistName && (
                          <p className="mt-2 text-sm text-green-300">
                            {slot.therapistName}
                          </p>
                        )}
                        {slot.hasExpert === false && (
                          <p className="mt-2 font-bold">No Expert Available</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={addToCart}
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
}
