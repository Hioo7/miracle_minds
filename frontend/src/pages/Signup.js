'use client';

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function CreateAccount() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [assessment, setAssessmentDone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assessment) {
      toast.error("Please select if the assessment is already done.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    // Phone validation: must start with [6-9] and be 10 digits total
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.error(
        "Invalid phone number. Must start with 6-9 and be 10 digits.",
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
      return;
    }
    try {
      const response = await axios.post(
        "https://miracle-minds.vercel.app/api/auth/signup",
        {
          name,
          email,
          phone,
          assessment,
          password,
        }
      );
      toast.success(response.data.message, {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.error || "An error occurred",
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
    }
  };

  return (
    <section className="bg-gradient-to-tr from-purple-900 via-pink-600 to-white m-4 rounded-md">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        
        <div className="w-full bg-white rounded-lg shadow-xl sm:max-w-3xl xl:p-0">
          <div className="p-8 space-y-6 md:space-y-8 sm:p-10">
            <h1 className="text-2xl font-extrabold text-center text-purple-800">
              Create an Account
            </h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-purple-800 mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-purple-100 border border-purple-300 text-purple-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-purple-800 mb-2"
                  >
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-purple-100 border border-purple-300 text-purple-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Phone & Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-purple-800 mb-2"
                  >
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-purple-100 border border-purple-300 text-purple-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="9876543210"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="assessmentDone"
                    className="block text-sm font-medium text-purple-800 mb-2"
                  >
                    Assessment Done?
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="yes"
                        name="assessmentDone"
                        value="yes"
                        onChange={(e) => setAssessmentDone(e.target.value)}
                        className="w-4 h-4 text-pink-600 bg-purple-100 border-purple-300 focus:ring-pink-500"
                      />
                      <label htmlFor="yes" className="ml-2 text-sm text-purple-900">
                        Yes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="no"
                        name="assessmentDone"
                        value="no"
                        onChange={(e) => setAssessmentDone(e.target.value)}
                        className="w-4 h-4 text-pink-600 bg-purple-100 border-purple-300 focus:ring-pink-500"
                      />
                      <label htmlFor="no" className="ml-2 text-sm text-purple-900">
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-purple-800 mb-2"
                  >
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-purple-100 border border-purple-300 text-purple-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-600 hover:text-purple-800"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-purple-800 mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirm-password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-purple-100 border border-purple-300 text-purple-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-600 hover:text-purple-800"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-white bg-pink-600 hover:bg-pink-700 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Create an Account
              </button>

              <p className="text-sm font-light text-purple-800 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-pink-600 hover:underline"
                >
                  Login here
                </Link>
              </p>
              <p className="text-sm font-light text-purple-800 text-center">
                <Link
                  to="/forgot-password"
                  className="font-medium text-pink-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
