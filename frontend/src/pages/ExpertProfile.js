"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import uploadImage from "../helpers/uploadImage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ExpertProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    expertise: [],
    about: "",
    photo: "",
    // NEW: array for supportedModes
    supportedModes: [],
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [therapies, setTherapies] = useState([]);
  const navigate = useNavigate();

  // Fetch profile and therapies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // 1) Get existing expert profile
        let fetchedProfile = null;
        try {
          const resProfile = await axios.get("https://miracle-minds.vercel.app/api/expert/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchedProfile = resProfile.data;
        } catch (err) {
          if (err.response && err.response.status === 404) {
            fetchedProfile = null;
          } else {
            toast.error("Failed to fetch profile");
          }
        }

        // 2) Get therapies for selection
        const resTherapies = await axios.get("https://miracle-minds.vercel.app/api/therapies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTherapies(resTherapies.data);

        // If we found a profile, load it into formData
        if (fetchedProfile) {
          setProfile(fetchedProfile);
          setFormData({
            name: fetchedProfile.name,
            expertise: fetchedProfile.expertise,
            about: fetchedProfile.about,
            photo: fetchedProfile.photo,
            // load the array or default to empty
            supportedModes: fetchedProfile.supportedModes || [],
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Toggle create/edit mode
  const handleCreateOrEditProfile = () => setEditing(true);

  // handle text changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Photo changes
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle a therapy
  const handleToggleTherapy = (therapyName) => {
    setFormData((prev) => {
      const isSelected = prev.expertise.includes(therapyName);
      if (isSelected) {
        return {
          ...prev,
          expertise: prev.expertise.filter((t) => t !== therapyName),
        };
      } else {
        return {
          ...prev,
          expertise: [...prev.expertise, therapyName],
        };
      }
    });
  };

  // NEW: handle toggling a mode in supportedModes
  const handleToggleMode = (mode) => {
    setFormData((prev) => {
      const isSelected = prev.supportedModes.includes(mode);
      if (isSelected) {
        return {
          ...prev,
          supportedModes: prev.supportedModes.filter((m) => m !== mode),
        };
      } else {
        return {
          ...prev,
          supportedModes: [...prev.supportedModes, mode],
        };
      }
    });
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = formData.photo;
      if (photoFile) {
        const uploadRes = await uploadImage(photoFile);
        photoUrl = uploadRes.secure_url;
      }

      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        expertise: formData.expertise,
        about: formData.about,
        photo: photoUrl,
        supportedModes: formData.supportedModes, // add this
      };

      let res;
      if (profile) {
        // Update
        res = await axios.put("https://miracle-minds.vercel.app/api/expert/profile", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Profile updated successfully!");
      } else {
        // Create
        res = await axios.post("https://miracle-minds.vercel.app/api/expert/profile", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Profile created successfully!");
      }

      setProfile(res.data);
      setFormData({
        name: res.data.name,
        expertise: res.data.expertise,
        about: res.data.about,
        photo: res.data.photo,
        supportedModes: res.data.supportedModes,
      });
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expert Profile</h1>
        {!editing && (
          <button
            onClick={handleCreateOrEditProfile}
            className={`px-4 py-2 rounded ${
              profile ? "bg-[#db2777] hover:bg-[#be185d]" : "bg-[#9333ea] hover:bg-[#7e22ce]"
            } text-white`}
          >
            {profile ? "Edit Profile" : "Create Profile"}
          </button>
        )}
      </div>

      {/* Editing Form */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto space-y-6 bg-[#f3e8ff] p-6 rounded-lg shadow-lg border border-[#d8b4fe]"
        >
          {/* Profile picture */}
          <div className="flex flex-col items-center">
            <label className="relative group cursor-pointer w-32 h-32 flex items-center justify-center rounded-full border-2 border-dashed border-[#d8b4fe] text-[#4c1d95]">
              {formData.photo ? (
                <img
                  src={formData.photo}
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
              {formData.photo ? "Change Profile Picture" : "Add Profile Picture"}
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white border border-[#d8b4fe] rounded px-3 py-2 text-[#4c1d95]"
              required
            />
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-semibold mb-1">Select Expertise</label>
            <div className="grid grid-cols-2 gap-2 bg-[#f3e8ff] p-3 rounded border border-[#d8b4fe]">
              {therapies.map((therapy) => {
                const selected = formData.expertise.includes(therapy.name);
                return (
                  <div
                    key={therapy._id}
                    onClick={() => handleToggleTherapy(therapy.name)}
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
            {formData.expertise.length > 0 && (
              <p className="mt-2 text-sm">
                Selected: {formData.expertise.join(", ")}
              </p>
            )}
          </div>

          {/* About */}
          <div>
            <label className="block text-sm font-semibold mb-1">About</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              className="w-full bg-white border border-[#d8b4fe] rounded px-3 py-2 text-[#4c1d95]"
              rows="4"
              required
            />
          </div>

          {/* NEW: Mode Selection (ONLINE, OFFLINE) */}
          <div>
            <label className="block text-sm font-semibold mb-1">Supported Modes</label>
            <div className="flex flex-wrap gap-3">
              {["ONLINE", "OFFLINE"].map((modeOption) => {
                const selected = formData.supportedModes.includes(modeOption);
                return (
                  <div
                    key={modeOption}
                    onClick={() => handleToggleMode(modeOption)}
                    className={`cursor-pointer px-3 py-1 rounded text-sm transition ${
                      selected
                        ? "bg-[#9333ea] text-white"
                        : "bg-[#f3e8ff] text-[#4c1d95] hover:bg-[#fbcfe8] hover:text-[#831843]"
                    }`}
                  >
                    {modeOption}
                  </div>
                );
              })}
            </div>
            {formData.supportedModes.length > 0 && (
              <p className="mt-2 text-sm">
                Selected Modes: {formData.supportedModes.join(", ")}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="bg-[#9333ea] hover:bg-[#7e22ce] text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#db2777] hover:bg-[#be185d] text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Display Profile if not editing & profile exists */}
      {!editing && profile && (
        <div className="max-w-xl mx-auto bg-[#f3e8ff] p-6 rounded-lg shadow-lg flex flex-col items-center border border-[#d8b4fe]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="h-32 w-32 rounded-full object-cover mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
          <p className="mb-2">
            <span className="font-semibold">Expertise:</span> {profile.expertise.join(", ")}
          </p>
          <p className="mb-2">
            <span className="font-semibold">About:</span> {profile.about}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Supported Modes:</span>{" "}
            {profile.supportedModes?.join(", ") || "ONLINE"}
          </p>
        </div>
      )}

      {/* If no profile & not editing => prompt create */}
      {!editing && !profile && (
        <div className="text-center mt-4">
          <p>No profile found. Click "Create Profile" to add your expert profile.</p>
        </div>
      )}
    </div>
  );
}
