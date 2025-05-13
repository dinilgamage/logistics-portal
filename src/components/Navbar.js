import React from 'react';

export default function Navbar({ user, handleSignOut }) {
  return (
    <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="ml-2 text-white text-xl font-bold">XYZ Logistics Portal</span>
          </div>
          <div className="flex items-center">
            <div className="flex flex-col items-end mr-4">
              <span className="text-white font-medium">{user.username}</span>
              <span className="text-blue-100 text-sm">{user.attributes.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}