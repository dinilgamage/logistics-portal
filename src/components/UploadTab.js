import React from 'react';

export default function UploadTab({ file, setFile, status, handleUpload }) {
  // Determine if we're currently in uploading state
  const isUploading = status.includes('Uploading');
  
  // Only show success or error messages, not the uploading status
  const showStatusMessage = status.includes('✅') || status.includes('❌');
  
  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-center">Upload Shipment Data</h2>
      <p className="mb-6 text-gray-600 text-center">
        Upload your Excel sheet containing shipment information.
      </p>
      
      <div className="flex flex-col items-center">
        <label className="flex flex-col items-center justify-center w-64 h-64 bg-white text-blue-600 rounded-lg shadow-lg tracking-wide border-2 border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors duration-200">
          <svg className="w-20 h-20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
          </svg>
          <span className="mt-4 text-base leading-normal text-center">
            {file ? file.name : "Select a file"}
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={e => setFile(e.target.files[0])}
            disabled={isUploading}
          />
        </label>
        
        <button
          className="w-64 mt-6 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-md hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : "Upload Data"}
        </button>
      </div>
      
      {/* Only show success or error messages, not loading state */}
      {showStatusMessage && (
        <div className={`mt-6 p-4 rounded-md ${
          status.includes('❌') 
            ? 'bg-red-50 text-red-700' 
            : 'bg-green-50 text-green-700'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}