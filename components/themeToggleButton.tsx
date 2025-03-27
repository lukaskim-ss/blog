'use client';
import React, { useState, useEffect } from 'react';
import styles from './themeToggleButton.module.css';
import { Sun, Moon } from '@deemlol/next-icons';

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
    <div>
      <input
        className={styles.checkbox}
        onChange={toggleTheme}
        checked={isDarkMode}
        id="checkbox"
        type="checkbox"
      />
      <label htmlFor="checkbox" className={styles.checkbox_label}>
        {/* <Moon className={styles.theme_icon} />
        <Sun className={styles.theme_icon} /> */}
        <span className={styles.ball}>
          <Sun className={styles.theme_icon_sun} />
          <Moon className={styles.theme_icon_moon} />
        </span>
      </label>
    </div>
  );
};

export default ThemeToggleButton;
