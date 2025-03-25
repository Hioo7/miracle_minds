'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Welcome() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Fetch username from the backend
    const fetchUserName = async () => {
      try {
        const response = await axios.get('https://miracle-minds.vercel.app/api/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setUserName(response.data.name);
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('User'); // Fallback name
      }
    };

    fetchUserName();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-pink-500 to-white text-gray-900 p-6">
      <h1 className="text-4xl font-bold text-white drop-shadow-lg animate-pulse">
        Welcome, {userName}!
      </h1>
      <p className="mt-6 text-lg text-pink-900 text-center max-w-2xl">
        Miracle minds is dedicated to delivering innovative solutions that empower
        businesses and individuals alike. We strive to create technology that
        inspires and connects people in meaningful ways.
      </p>
    </div>
  );
}
