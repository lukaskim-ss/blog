import React from 'react';
import Link from 'next/link';
import styles from './rootHeader.module.css';
import ThemeToggleButton from './themeToggleButton';

const RootHeader = () => {
  return (
    <header className="flex flex-row justify-between w-full md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16 py-8 md:py-16 mb-12">
      {/* <div className="prose lg:prose-xl mx-auto dark:prose-invert"> */}

      <h1 className="w-sm text-6xl lg:text-8xl font-extrabold mb-0 lg:mb-0 dark:text-[#ededed]">
        <Link className="no-underline" href="/">
          lukas<span className="text-sky-600">.log</span>
        </Link>
      </h1>
      {/* </div> */}
      <ThemeToggleButton />
    </header>
  );
};

export default RootHeader;
