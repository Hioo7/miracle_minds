"use client";

import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

// Example admin pages with "permission" fields
const adminPages = [
  {
    name: "Create Booking",
    path: "/admin-dashboard/create-bookings",
    permission: "create-booking",
  },
  {
    name: "Manage Users",
    path: "/admin-dashboard/users",
    permission: "manage-users",
  },
  {
    name: "Manage Therapies",
    path: "/admin-dashboard/therapy-manager",
    permission: "manage-therapy",
  },
  {
    name: "Add and Manage Expert",
    path: "/admin-dashboard/add-expert",
    permission: "add-expert",
  },
  {
    name: "Timeslot Manager",
    path: "/admin-dashboard/timeslots",
    permission: "timeslot-manager",
  },
  {
    name: "Upcoming Meetings",
    path: "/admin-dashboard/upcoming",
    permission: "upcoming-meetings",
  },
  {
    name: "All Bookings",
    path: "/admin-dashboard/all-bookings",
    permission: "all-bookings",
  },
  {
    name: "Manage Sub-Admins",
    path: "/admin-dashboard/subadmin-manager",
    permission: "sub-admins",
  },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // optional
  const navigate = useNavigate();

  useEffect(() => {
    // 1) Check role from localStorage
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      // Not admin => redirect or show unauthorized
      console.warn("User role is not ADMIN, redirecting to /unauthorized");
      navigate("/unauthorized");
      return;
    }

    // 2) Read permissions from localStorage
    let perms = [];
    const permsStr = localStorage.getItem("permissions");
    if (permsStr) {
      try {
        perms = JSON.parse(permsStr);
      } catch (err) {
        console.error("Error parsing permissions from localStorage:", err);
      }
    }

    // 3) If you store isSuperAdmin as a string "true" or "false"
    const superFlag = localStorage.getItem("isSuperAdmin") === "true";

    // Set states
    setPermissions(perms || []);
    setIsSuperAdmin(superFlag);

    // Debug logs
    console.log("AdminDashboard: role =>", role);
    console.log("AdminDashboard: permissions =>", perms);
    console.log("AdminDashboard: isSuperAdmin =>", superFlag);

    // If you want, you can also fetch the user from an API to confirm
    /*
    // e.g. GET /api/user/me
    axios.get('https://miracle-minds.vercel.app/api/user/me', { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
      const user = res.data;
      if (user.role !== 'ADMIN') navigate('/unauthorized');
      setPermissions(user.permissions || []);
      setIsSuperAdmin(user.isSuperAdmin === true);
      console.log("Fetched user =>", user);
    })
    .catch(err => console.error("Error fetching user:", err));
    */
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("isSuperAdmin");
    navigate("/login");
  };

  return (
    <div className="flex flex-col lg:flex-row m-4 rounded-md bg-gradient-to-tr 
          from-[#ede9fe] to-[#f3e8ff] text-[#4c1d95] h-screen">
      {/* Mobile Hamburger */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#f3e8ff]">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#4c1d95] p-2 rounded-md hover:bg-[#fbcfe8] hover:text-[#831843] focus:outline-none"
        >
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`lg:w-1/5 w-full bg-[#f3e8ff] p-4 lg:block ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <h2 className="text-lg font-semibold mb-6 hidden lg:block">Admin Panel</h2>
        <ul className="space-y-4">
          {adminPages.map((page) => {
            // If super admin => show all pages, else check permission
            const canView = isSuperAdmin || permissions.includes(page.permission);
            if (!canView) {
              return null;
            }

            return (
              <li key={page.name}>
                <Link
                  to={page.path}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-[#fbcfe8] hover:text-[#831843]"
                >
                  {page.name}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={handleSignOut}
              className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium hover:bg-[#fbcfe8] hover:text-[#831843]"
            >
              Sign Out
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="lg:w-4/5 w-full p-6 overflow-auto h-full bg-gradient-to-tr 
          from-[#ffffff] to-[#ffffff]">
        <Outlet />
      </div>
    </div>
  );
}