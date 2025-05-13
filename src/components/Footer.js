import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-auto py-4">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm">
          Logistics Portal &copy; {new Date().getFullYear()} - All rights reserved
        </p>
      </div>
    </footer>
  );
}