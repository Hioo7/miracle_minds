'use client';

import { useState, useEffect } from "react";
import axios from "axios";

export default function TherapyManager() {
  const [therapies, setTherapies] = useState([]);
  const [newTherapy, setNewTherapy] = useState({ name: "", description: "", cost: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchTherapies = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://miracle-minds.vercel.app/api/therapies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTherapies(response.data);
      } catch (error) {
        console.error("Error fetching therapies:", error);
      }
    };

    fetchTherapies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTherapy((prev) => ({ ...prev, [name]: value }));
  };

  const saveTherapy = async () => {
    try {
      const token = localStorage.getItem("token");
      if (isEditing) {
        const response = await axios.put(
          `https://miracle-minds.vercel.app/api/therapies/update/${editId}`,
          newTherapy,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTherapies(therapies.map((t) => (t._id === editId ? response.data.therapy : t)));
      } else {
        const response = await axios.post(
          "https://miracle-minds.vercel.app/api/therapies/add",
          newTherapy,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTherapies([...therapies, response.data.therapy]);
      }
      setNewTherapy({ name: "", description: "", cost: "" });
      setIsEditing(false);
      setEditId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving therapy:", error);
    }
  };

  const deleteTherapy = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://miracle-minds.vercel.app/api/therapies/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTherapies(therapies.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Error deleting therapy:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-200 rounded-md relative">
      <h1 className="text-2xl font-bold mb-4">Therapy Manager</h1>

      {/* Add Therapy Button */}
      <button
        className="absolute top-6 right-6 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
        onClick={() => {
          setShowForm(true);
          setIsEditing(false);
          setNewTherapy({ name: "", description: "", cost: "" });
        }}
      >
        Add Therapy
      </button>

      {/* Therapy List Table */}
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full bg-gray-800 text-gray-200 rounded-md">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Cost</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {therapies.map((therapy) => (
              <tr key={therapy._id} className="border-b border-gray-700">
                <td className="px-4 py-2 text-sm">{therapy.name}</td>
                <td className="px-4 py-2 text-sm">{therapy.description}</td>
                <td className="px-4 py-2 text-sm">₹{therapy.cost}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex space-x-2">
                    <button
                      className="bg-pink-600 text-white px-3 py-1 rounded-md hover:bg-pink-700"
                      onClick={() => {
                        setNewTherapy(therapy);
                        setIsEditing(true);
                        setEditId(therapy._id);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                      onClick={() => deleteTherapy(therapy._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-md w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Therapy" : "Add Therapy"}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={newTherapy.name}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={newTherapy.description}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2"
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cost</label>
              <input
                type="number"
                name="cost"
                value={newTherapy.cost}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-gray-300 border border-gray-600 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveTherapy}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
