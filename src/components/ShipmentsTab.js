import React from 'react';

export default function ShipmentsTab({ shipments, loading, fetchShipments }) {
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Shipments</h2>
        <button
          className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-md hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={fetchShipments}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : 'Refresh Shipments'}
        </button>
      </div>

      {shipments.length > 0 ? (
        <div className="mt-6 overflow-x-auto" style={{ maxWidth: '100%' }}>
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">ID</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Order</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Origin</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Destination</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Weight</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Dispatch</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Expected</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Actual</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((s, i) => {
                // Calculate delivery status
                const expectedDate = s.ExpectedDeliveryDate ? new Date(s.ExpectedDeliveryDate) : null;
                const actualDate = s.ActualDeliveryDate ? new Date(s.ActualDeliveryDate) : null;
                let status = 'Pending';
                let statusColor = 'gray';
                
                if (actualDate && expectedDate) {
                  if (actualDate < expectedDate) {
                    status = 'Early';
                    statusColor = 'green';
                  } else if (actualDate > expectedDate) {
                    status = 'Late';
                    statusColor = 'red';
                  } else {
                    status = 'On Time';
                    statusColor = 'blue';
                  }
                }

                return (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.ShipmentID}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{s.OrderID}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{s.Origin}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{s.Destination}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{s.Weight_kg}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(s.DispatchDate)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(s.ExpectedDeliveryDate)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(s.ActualDeliveryDate)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !loading && (
        <div className="mt-6 py-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <p className="mt-4 text-lg">No shipments found</p>
          <p className="text-sm">Click the button above to fetch your shipments</p>
        </div>
      )}
    </div>
  );
}