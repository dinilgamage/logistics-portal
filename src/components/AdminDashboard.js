import React, { useState, useEffect } from 'react';
import AnalyticsTab from './AnalyticsTab';
import AdminShipmentsTab from './AdminShipmentsTab';

export default function AdminDashboard({ fetchAdminShipments }) {
  const [adminShipments, setAdminShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [activeTab, setActiveTab] = useState('analytics');
  
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const shipments = await fetchAdminShipments();
        setAdminShipments(shipments || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdminData();
  }, [fetchAdminShipments]);
  
  // Group shipments by company
  const shipmentsByCompany = adminShipments.reduce((acc, shipment) => {
    const companyId = shipment.CompanyID || 'unknown';
    if (!acc[companyId]) {
      acc[companyId] = [];
    }
    acc[companyId].push(shipment);
    return acc;
  }, {});
  
  // Get all company IDs for the dropdown
  const companyIds = Object.keys(shipmentsByCompany).sort();
  
  // Get shipments to display based on selected company
  const filteredShipments = selectedCompany === 'all' 
    ? adminShipments 
    : shipmentsByCompany[selectedCompany] || [];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span className="ml-2 text-blue-600">Loading Admin Dashboard...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="py-12 flex flex-col items-center justify-center text-red-500">
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-4 text-lg">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Admin Dashboard</h2>
      
      {/* System Overview Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Companies</p>
            <p className="text-2xl font-bold">{companyIds.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Shipments</p>
            <p className="text-2xl font-bold">{adminShipments.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Avg Shipments per Company</p>
            <p className="text-2xl font-bold">
              {companyIds.length > 0 
                ? Math.round(adminShipments.length / companyIds.length) 
                : 0}
            </p>
          </div>
        </div>
      </div>
      
      {/* Admin Dashboard Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics View
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'shipments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Shipments View
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'analytics' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Company Data</h3>
            <div className="w-64">
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
          
          {/* Analytics for filtered data */}
          <div className="border border-gray-200 rounded-lg p-4">
            <AnalyticsTab shipments={filteredShipments} loading={false} />
          </div>
        </div>
      ) : (
        <div>
          {/* Shipments table with company filter */}
          <AdminShipmentsTab 
            adminShipments={adminShipments} 
            loading={loading} 
            companyIds={companyIds} 
            shipmentsByCompany={shipmentsByCompany} 
          />
        </div>
      )}
    </div>
  );
}