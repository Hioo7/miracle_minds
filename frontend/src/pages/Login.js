'use client';

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      const normalizedRole = role.toUpperCase();
      if (normalizedRole === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (normalizedRole === "EXPERT") {
        navigate("/expert-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://miracle-minds.vercel.app/api/auth/login", {
        email,
        password,
      });

      toast.success(response.data.message || "Login successful!", {
        position: "top-center",
        autoClose: 3000,
      });

      const { token, role, permissions, isSuperAdmin } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role || "GENERAL");
      localStorage.setItem("permissions", JSON.stringify(permissions || []));
      localStorage.setItem("isSuperAdmin", isSuperAdmin ? "true" : "false");

      if (role === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (role === "EXPERT") {
        navigate("/expert-dashboard");
      } else {
        navigate("/dashboard");
      }

      window.location.reload();
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred. Please try again.",
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
      console.error("Login error:", error);
    }
  };

  return (
    <section className="bg-gradient-to-tr from-purple-900 via-pink-600 to-white m-4 rounded-md">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a
          href="#"
          className="flex items-center mb-6 text-3xl font-extrabold text-white"
        >
          Miracle Minds
        </a>
        <div className="w-full bg-white rounded-lg shadow-xl sm:max-w-md xl:p-0">
          <div className="p-6 space-y-6 sm:p-8">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-gray-900 text-center">
              Sign in to your account
            </h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5"
                  placeholder="name@company.com"
                  required
                />
              </div>
              {/* Password Field */}
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Forgot Password */}
              <div className="text-sm text-right">
                <Link
                  to="/forgot-password"
                  className="font-medium text-pink-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full text-white bg-pink-600 hover:bg-pink-700 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Login
              </button>
              {/* Sign Up Link */}
              <p className="text-sm font-light text-gray-500 text-center">
                Don’t have an account yet?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-pink-600 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
