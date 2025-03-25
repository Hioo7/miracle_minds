"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon, UserCircleIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext"; // Assuming this context exists
import axios from "axios";
import logo from "../assets/logo.png";  // <-- Import your local logo file here

const navigation = [];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);

  // USE CONTEXT
  const { cartItems, fetchCartItems } = useCart();

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setUserRole(role || "");
    if (token) {
      fetchCartItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole("");
    navigate("/login");
  };

  return (
    <header className="inset-x-0 top-4 z-50 m-4 rounded-md sticky bg-gradient-to-tr from-[#af235e] to-[#241d88]">
      <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 fixed -top-5 left-0">
            <span className="sr-only">Miracle Minds</span>
            {/* Use the imported `logo` here */}
            <img
              alt="Miracle Minds"
              src={logo}
              className="h-40 w-auto drop-shadow-[0px_4px_8px_rgba(0,0,0,0.5)] filter contrast-150 saturate-125"
            />
          </Link>
        </div>

        {/* "Are you expert?" Link */}
        {!isLoggedIn && (
          <div className="hidden lg:flex">
            <Link
              to="/expert-signup"
              className="text-sm font-semibold text-gray-200 hover:text-white"
            >
              Are you Expert?
            </Link>
          </div>
        )}

        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-semibold text-gray-200 hover:text-white"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-6 items-center">
          {isLoggedIn && userRole === "GENERAL" && (
            <div className="relative">
              <button
                onClick={() => setCartDropdownOpen(!cartDropdownOpen)}
                className="relative text-gray-200 hover:text-white"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {cartItems.length}
                  </span>
                )}
              </button>
              {cartDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg z-50">
                  <h3 className="px-4 py-2 text-sm font-semibold text-gray-200">
                    Cart Items
                  </h3>
                  {cartItems.length > 0 ? (
                    <ul className="divide-y divide-gray-700">
                      {cartItems.map((item) => (
                        <li key={item._id} className="px-4 py-2 text-sm text-gray-200">
                          <div>{item.therapies[0]?.name || "Therapy"}</div>
                          <div className="text-xs text-gray-400">
                            {item.date} | {item.timeslot.from} - {item.timeslot.to}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-400">No items in cart.</p>
                  )}
                  <Link
                    to="/dashboard/cart"
                    className="block px-4 py-2 text-center text-sm font-semibold text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    View Cart
                  </Link>
                </div>
              )}
            </div>
          )}

          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-200 hover:text-white focus:outline-none"
              >
                <UserCircleIcon className="h-6 w-6 text-gray-200" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-50">
                  {/* Role-based dashboard link */}
                  {userRole === "EXPERT" ? (
                    <Link
                      to="/expert-dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                    >
                      Expert Dashboard
                    </Link>
                  ) : userRole === "ADMIN" ? (
                    <Link
                      to="/admin-dashboard/users"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                    >
                      Admin Dashboard
                    </Link>
                  ) : userRole === "SUBADMIN" ? (
                    <Link
                      to="/subadmin-dashboard"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                    >
                      SubAdmin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard/home"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                    >
                      Dashboard
                    </Link>
                  )}

                  {/* Example: Edit Profile link */}
                  <Link
                    to="/edit-profile"
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    Edit Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-200 hover:text-white"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </nav>

      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50 bg-gray-800 bg-opacity-75" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-700">
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              {/* Use the same imported `logo` here as well */}
              <img
                alt="Miracle Minds"
                src={logo}
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Icon in Mobile Menu */}
          {isLoggedIn && userRole === "GENERAL" && (
            <div className="mt-4">
              <button
                onClick={() => setCartDropdownOpen(!cartDropdownOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-200 hover:text-white"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                <span>Cart</span>
                {cartItems.length > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {cartItems.length}
                  </span>
                )}
              </button>
              {cartDropdownOpen && (
                <div className="mt-2 w-full bg-gray-800 rounded-md shadow-lg">
                  <h3 className="px-4 py-2 text-sm font-semibold text-gray-200">
                    Cart Items
                  </h3>
                  {cartItems.length > 0 ? (
                    <ul className="divide-y divide-gray-700">
                      {cartItems.map((item) => (
                        <li key={item._id} className="px-4 py-2 text-sm text-gray-200">
                          <div>{item.therapies[0]?.name || "Therapy"}</div>
                          <div className="text-xs text-gray-400">
                            {item.date} | {item.timeslot.from} - {item.timeslot.to}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-400">No items in cart.</p>
                  )}
                  <Link
                    to="/dashboard/cart"
                    className="block px-4 py-2 text-center text-sm font-semibold text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    View Cart
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-700">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    {item.name}
                  </a>
                ))}
                {!isLoggedIn && (
                  <a
                    href="/expert-signup"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Are you Expert?
                  </a>
                )}
              </div>

              <div className="py-6">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
