import React from 'react';
import Link from 'next/link';
import styles from './rootHeader.module.css';

const RootHeader = () => {
  return (
    <header className="w-full md:max-w-4xl mx-auto px-4 md:px-16 py-8 md:py-16 mb-12">
      <div className="prose lg:prose-xl mx-auto">
        <Link className="no-underline" href="/">
          <h1 className="text-6xl lg:text-8xl font-extrabold mb-0 lg:mb-0">
            lukas<span className="text-sky-600">.log</span>
          </h1>
        </Link>
      </div>
    </header>
  );
};

export default RootHeader;
