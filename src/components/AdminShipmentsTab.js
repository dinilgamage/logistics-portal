import React, { useState } from 'react';

export default function AdminShipmentsTab({ adminShipments, loading, companyIds, shipmentsByCompany }) {
  const [selectedCompany, setSelectedCompany] = useState('all'); // Default to 'all'
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get shipments to display based on selected company
  const filteredShipments = selectedCompany === 'all' 
    ? adminShipments 
    : shipmentsByCompany[selectedCompany] || [];
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Company Shipments</h2>
        
        {/* Company filter dropdown with matching styling */}
        <div className="flex items-center">
          <div className="w-64 mr-2">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Companies</option>
              {companyIds.map(companyId => (
                <option key={companyId} value={companyId}>
                  {companyId} ({shipmentsByCompany[companyId].length} shipments)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Company info badge - only show when filtering */}
      {selectedCompany !== 'all' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">Company:</span> {selectedCompany}
              <span className="ml-4 text-sm text-gray-500">
                Showing {filteredShipments.length} shipments
              </span>
            </div>
            <button
              onClick={() => setSelectedCompany('all')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {filteredShipments.length > 0 ? (
        <div className="mt-6 overflow-x-auto" style={{ maxWidth: '100%' }}>
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Company</th>
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
              {filteredShipments.map((s, i) => {
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
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.CompanyID}</td>
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
          <p className="text-sm">Use the filter above to view company shipments</p>
        </div>
      )}
    </div>
  );
}