"use client";

import { useState, useEffect } from "react";
import axios from "axios";
// 1) Import the xlsx library
import * as XLSX from "xlsx";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [updatedRole, setUpdatedRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2) Add a roleFilter state
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("https://miracle-minds.vercel.app/api/admin/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err.response || err.message);
        setError(
          err.response?.data?.message || "Failed to load users. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId) => {
    try {
      await axios.put(
        `https://miracle-minds.vercel.app/api/admin/users/${userId}/role`,
        { role: updatedRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: updatedRole } : user
        )
      );
      setEditingRole(null);
    } catch (err) {
      console.error("Error updating role:", err.response || err.message);
      alert("Failed to update role. Please try again.");
    }
  };

  // 3) Derive filteredUsers based on the roleFilter
  const filteredUsers = roleFilter === "ALL"
    ? users
    : users.filter((user) => user.role === roleFilter);

  // 4) Export to Excel function
  const handleExportExcel = () => {
    if (!filteredUsers.length) {
      alert("No users to export!");
      return;
    }

    // Convert array of user objects into array of plain JSON rows
    const dataForExcel = filteredUsers.map((user) => ({
      Name: user.name,
      Phone: user.phone || "N/A",
      DateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toLocaleDateString("en-GB")
        : "N/A",
      Address: user.address || "",
      Email: user.email,
      Role: user.role,
    }));

    // Create a new workbook and a new worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataForExcel);

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "FilteredUsers");

    // Generate and download the Excel file
    XLSX.writeFile(wb, "filtered_users.xlsx");
  };

  if (loading) {
    return <div className="text-gray-200">Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-gray-200 rounded-md">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      {/* Role Filter */}
      <div className="flex items-center mb-4 gap-2">
        <label htmlFor="roleFilter" className="text-sm font-medium">
          Filter by Role:
        </label>
        <select
          id="roleFilter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-2 py-1"
        >
          <option value="ALL">ALL</option>
          <option value="GENERAL">GENERAL</option>
          <option value="EXPERT">EXPERT</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
        >
          Export to Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Date of Birth
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Address
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-200 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-b border-gray-700">
                <td className="px-6 py-4 text-sm text-gray-300">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {user.phone || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {user.dateOfBirth
                    ? new Date(user.dateOfBirth).toLocaleDateString("en-GB")
                    : "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {user.address || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {editingRole === user._id ? (
                    <select
                      value={updatedRole}
                      onChange={(e) => setUpdatedRole(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-2 py-1"
                    >
                      <option value="GENERAL">GENERAL</option>
                      <option value="EXPERT">EXPERT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {editingRole === user._id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRoleChange(user._id)}
                        className="bg-pink-600 text-white px-3 py-1 rounded-md hover:bg-pink-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRole(null)}
                        className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRole(user._id);
                        setUpdatedRole(user.role);
                      }}
                      className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
