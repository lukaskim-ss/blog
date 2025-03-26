'use client';
import React, { useState, useEffect } from 'react';

const ThemeToggleButton: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode === null) return; // Prevent toggling before initialization
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    if (newIsDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (isDarkMode === null) {
    // Prevent rendering until the theme is initialized
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: isDarkMode ? '#333' : '#fff',
        color: isDarkMode ? '#fff' : '#333',
        transition: 'all 0.3s ease',
      }}
    >
      {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    </button>
  );
};

export default ThemeToggleButton;
