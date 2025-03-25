import React from 'react'
import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-tr 
          from-[#af235e] to-[#241d88] rounded-lg shadow m-4">
      <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <a
            href="/"
            className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse"
          >
            <img
                          alt="Miracle Minds"
                          src={logo}
                          className="h-40 w-auto drop-shadow-[0px_4px_8px_rgba(0,0,0,0.5)] filter contrast-150 saturate-125"
                        />
          </a>
          <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-white sm:mb-0 dark:text-white">
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Licensing
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <hr className="my-6 border-white sm:mx-auto dark:border-white lg:my-8" />
        <span className="block text-sm text-white sm:text-center dark:text-white">
          © 2025{' '}
          
           All Rights Reserved.
        </span>
      </div>
    </footer>
  )
}
