import React from 'react';
import Link from 'next/link';
import styles from './rootHeader.module.css';
import ThemeToggleButton from './themeToggleButton';

const RootHeader = () => {
  return (
    <header className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16 py-12 mb-12">
      <div className="flex flex-row justify-between items-center max-w-[65ch] lg:max-w-3xl mx-auto ">
        <h1 className="text-6xl lg:text-8xl font-extrabold dark:text-[#ededed]">
          <Link className="no-underline" href="/">
            lukas<span className="text-sky-600">.log</span>
          </Link>
        </h1>

        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default RootHeader;
