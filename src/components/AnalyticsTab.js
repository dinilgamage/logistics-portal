import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';

export default function AnalyticsTab({ shipments, loading }) {
  const [originStats, setOriginStats] = useState([]);
  const [destinationStats, setDestinationStats] = useState([]);
  const [weightDistribution, setWeightDistribution] = useState([]);
  const [monthlyShipments, setMonthlyShipments] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]); // Add this for route analysis
  const [deliveryPerformance, setDeliveryPerformance] = useState([]); // Add this for delivery performance
  const [performanceStats, setPerformanceStats] = useState({ // Summary stats for performance
    onTime: 0,
    early: 0, 
    late: 0,
    unknown: 0,
    avgDelay: 0
  });
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Refs for PDF export
  const analyticsRef = useRef(null);
  
  useEffect(() => {
    if (shipments.length > 0) {
      generateAnalytics();
    }
  }, [shipments]);
  
  const generateAnalytics = () => {
    // Origin statistics
    const originCounts = shipments.reduce((acc, ship) => {
      acc[ship.Origin] = (acc[ship.Origin] || 0) + 1;
      return acc;
    }, {});
    
    const originData = Object.keys(originCounts).map(origin => ({
      name: origin,
      count: originCounts[origin],
    })).sort((a, b) => b.count - a.count);
    
    setOriginStats(originData);
    
    // Destination statistics
    const destCounts = shipments.reduce((acc, ship) => {
      acc[ship.Destination] = (acc[ship.Destination] || 0) + 1;
      return acc;
    }, {});
    
    const destData = Object.keys(destCounts).map(dest => ({
      name: dest,
      count: destCounts[dest],
    })).sort((a, b) => b.count - a.count);
    
    setDestinationStats(destData);
    
    // Weight distribution
    // Create weight ranges
    const weightRanges = [
      { range: '0-10', min: 0, max: 10, count: 0 },
      { range: '11-50', min: 11, max: 50, count: 0 },
      { range: '51-100', min: 51, max: 100, count: 0 },
      { range: '101-500', min: 101, max: 500, count: 0 },
      { range: '501+', min: 501, max: Infinity, count: 0 },
    ];
    
    shipments.forEach(ship => {
      const weight = parseFloat(ship.Weight_kg);
      const range = weightRanges.find(r => weight >= r.min && weight <= r.max);
      if (range) range.count++;
    });
    
    setWeightDistribution(weightRanges);
    
    // Monthly shipment trends
    const months = {};
    shipments.forEach(ship => {
      // Assuming DispatchDate is in format YYYY-MM-DD
      const date = new Date(ship.DispatchDate);
      if (!isNaN(date.getTime())) {
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[monthYear] = (months[monthYear] || 0) + 1;
      }
    });
    
    const monthData = Object.keys(months).sort().map(month => ({
      month,
      count: months[month]
    }));
    
    setMonthlyShipments(monthData);
    
    // NEW: Route Analysis (Origin + Destination pairs)
    const routeCounts = shipments.reduce((acc, ship) => {
      const route = `${ship.Origin} → ${ship.Destination}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {});
    
    const routeData = Object.keys(routeCounts).map(route => ({
      name: route,
      count: routeCounts[route],
    })).sort((a, b) => b.count - a.count);
    
    setTopRoutes(routeData);
    
    // NEW: Delivery Performance Analysis
    const deliveryData = shipments.map(ship => {
      // Parse real dates from the shipment data
      const dispatchDate = new Date(ship.DispatchDate);
      const expectedDate = ship.ExpectedDeliveryDate ? new Date(ship.ExpectedDeliveryDate) : null;
      const actualDate = ship.ActualDeliveryDate ? new Date(ship.ActualDeliveryDate) : null;
      
      // Skip if we don't have both expected and actual dates
      if (!expectedDate || !actualDate) {
        return {
          id: ship.ShipmentID,
          origin: ship.Origin,
          destination: ship.Destination,
          dispatchDate: ship.DispatchDate,
          estimatedDelivery: ship.ExpectedDeliveryDate || "N/A",
          actualDelivery: ship.ActualDeliveryDate || "N/A",
          daysVariance: null,
          status: "Unknown"
        };
      }
      
      // Calculate if delivery was on time, early, or late
      let status;
      const diffDays = Math.round((actualDate - expectedDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 0) status = "Early";
      else if (diffDays === 0) status = "On Time";
      else status = "Late";
      
      return {
        id: ship.ShipmentID,
        origin: ship.Origin,
        destination: ship.Destination,
        dispatchDate: ship.DispatchDate,
        estimatedDelivery: ship.ExpectedDeliveryDate || "N/A",
        actualDelivery: ship.ActualDeliveryDate || "N/A",
        daysVariance: diffDays,
        status
      };
    });
    
    setDeliveryPerformance(deliveryData);
    
    // Calculate performance statistics
    const onTime = deliveryData.filter(d => d.status === "On Time").length;
    const early = deliveryData.filter(d => d.status === "Early").length;
    const late = deliveryData.filter(d => d.status === "Late").length;
    const unknown = deliveryData.filter(d => d.status === "Unknown").length;
    
    // Calculate average delay for shipments with actual delivery data
    const delayData = deliveryData
      .filter(d => d.daysVariance !== null)
      .map(d => d.daysVariance);
    
    const avgDelay = delayData.length > 0 
      ? delayData.reduce((sum, val) => sum + val, 0) / delayData.length
      : 0;
    
    setPerformanceStats({
      onTime,
      early,
      late,
      unknown,
      avgDelay: parseFloat(avgDelay.toFixed(1))
    });
  };
  
  // Export to PDF function
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Logistics Analytics Report", 15, 15);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 22);
    doc.text(`Total shipments analyzed: ${shipments.length}`, 15, 29);
    
    // Shipment summary
    doc.setFontSize(16);
    doc.text("Shipment Summary", 15, 40);
    
    const summaryData = [
      ["Total Shipments", shipments.length],
      ["Unique Origins", originStats.length],
      ["Unique Destinations", destinationStats.length],
      ["Avg Weight (kg)", (shipments.reduce((sum, s) => sum + parseFloat(s.Weight_kg), 0) / shipments.length).toFixed(1)]
    ];
    
    doc.autoTable({
      startY: 45,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: 'grid'
    });
    
    // Top routes
    doc.setFontSize(16);
    doc.text("Top Routes", 15, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Route", "Shipments"]],
      body: topRoutes.slice(0, 5).map(r => [r.name, r.count]),
      theme: 'grid'
    });
    
    // Delivery performance
    doc.setFontSize(16);
    doc.text("Delivery Performance", 15, doc.lastAutoTable.finalY + 15);
    
    const perfSummary = [
      ["On Time Deliveries", performanceStats.onTime],
      ["Early Deliveries", performanceStats.early],
      ["Late Deliveries", performanceStats.late],
      ["Unknown Status", performanceStats.unknown],
      ["Average Delay (days)", performanceStats.avgDelay]
    ];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Metric", "Value"]],
      body: perfSummary,
      theme: 'grid'
    });
    
    // Save the PDF
    doc.save("logistics-analytics.pdf");
  };
  
  // Export to Excel function
  const exportToExcel = () => {
    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ["Logistics Analytics Summary"],
      ["Generated on", new Date().toLocaleDateString()],
      [""],
      ["Metric", "Value"],
      ["Total Shipments", shipments.length],
      ["Unique Origins", originStats.length],
      ["Unique Destinations", destinationStats.length],
      ["Average Weight (kg)", (shipments.reduce((sum, s) => sum + parseFloat(s.Weight_kg), 0) / shipments.length).toFixed(1)],
      ["On Time Deliveries", performanceStats.onTime],
      ["Early Deliveries", performanceStats.early],
      ["Late Deliveries", performanceStats.late],
      ["Average Delay (days)", performanceStats.avgDelay]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    // Top routes sheet
    const routesHeaders = ["Route", "Number of Shipments"];
    const routesData = [routesHeaders, ...topRoutes.map(r => [r.name, r.count])];
    const routesWs = XLSX.utils.aoa_to_sheet(routesData);
    XLSX.utils.book_append_sheet(wb, routesWs, "Top Routes");
    
    // Delivery performance sheet
    const perfHeaders = ["Shipment ID", "Origin", "Destination", "Estimated Delivery", "Actual Delivery", "Days Variance", "Status"];
    const perfData = [
      perfHeaders,
      ...deliveryPerformance.map(d => [
        d.id,
        d.origin,
        d.destination,
        d.estimatedDelivery,
        d.actualDelivery,
        d.daysVariance !== null ? d.daysVariance : "N/A",
        d.status
      ])
    ];
    const perfWs = XLSX.utils.aoa_to_sheet(perfData);
    XLSX.utils.book_append_sheet(wb, perfWs, "Delivery Performance");
    
    // Monthly trends sheet
    const trendsHeaders = ["Month", "Shipment Count"];
    const trendsData = [trendsHeaders, ...monthlyShipments.map(m => [m.month, m.count])];
    const trendsWs = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(wb, trendsWs, "Monthly Trends");
    
    // Generate Excel file and initiate download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'logistics-analytics.xlsx');
  };

    if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <span className="ml-2 text-blue-600">Loading analytics...</span>
      </div>
    );
  }
  
  if (shipments.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Shipment Analytics</h2>
        <div className="py-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-lg">No shipment data available</p>
          <p className="text-sm">First load your shipments in the "View Shipments" tab</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6" ref={analyticsRef}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Shipment Analytics</h2>
        
        {/* Export buttons */}
        <div className="flex space-x-3">
          <button 
            onClick={exportToPDF}
            className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"></path>
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"></path>
            </svg>
            Export PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd"></path>
              <path fillRule="evenodd" d="M5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd"></path>
            </svg>
            Export Excel
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Summary Metrics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Shipment Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Total Shipments</p>
              <p className="text-2xl font-bold">{shipments.length}</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Unique Origins</p>
              <p className="text-2xl font-bold">{originStats.length}</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Unique Destinations</p>
              <p className="text-2xl font-bold">{destinationStats.length}</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Avg Weight (kg)</p>
              <p className="text-2xl font-bold">
                {(shipments.reduce((sum, s) => sum + parseFloat(s.Weight_kg), 0) / shipments.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Weight Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Weight Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weightDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* NEW: Delivery Performance Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-3">Delivery Performance</h3>
        
        {/* Delivery Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">On Time Deliveries</p>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-blue-600">
                {performanceStats.onTime}
              </p>
              <p className="text-sm text-gray-500 ml-2 mb-1">
                ({performanceStats.onTime + performanceStats.early + performanceStats.late > 0 
                  ? ((performanceStats.onTime / (performanceStats.onTime + performanceStats.early + performanceStats.late)) * 100).toFixed(1) 
                  : 0}%)
              </p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">Early Deliveries</p>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-green-600">
                {performanceStats.early}
              </p>
              <p className="text-sm text-gray-500 ml-2 mb-1">
                ({performanceStats.onTime + performanceStats.early + performanceStats.late > 0 
                  ? ((performanceStats.early / (performanceStats.onTime + performanceStats.early + performanceStats.late)) * 100).toFixed(1) 
                  : 0}%)
              </p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">Late Deliveries</p>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-red-600">
                {performanceStats.late}
              </p>
              <p className="text-sm text-gray-500 ml-2 mb-1">
                ({performanceStats.onTime + performanceStats.early + performanceStats.late > 0 
                  ? ((performanceStats.late / (performanceStats.onTime + performanceStats.early + performanceStats.late)) * 100).toFixed(1) 
                  : 0}%)
              </p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">Avg Delay/Early (days)</p>
            <p className={`text-2xl font-bold ${performanceStats.avgDelay < 0 ? 'text-green-600' : performanceStats.avgDelay > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {performanceStats.avgDelay > 0 ? '+' : ''}{performanceStats.avgDelay}
            </p>
          </div>
        </div>
        
        {/* Delivery Performance Table - Top 5 Items */}
        <div className="overflow-hidden border-b border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveryPerformance
                .filter(delivery => delivery.status !== "Unknown")
                .slice(0, 5)
                .map((delivery, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{delivery.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delivery.origin} → {delivery.destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delivery.estimatedDelivery}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delivery.actualDelivery}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${delivery.status === 'Early' ? 'bg-green-100 text-green-800' : 
                        delivery.status === 'On Time' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {delivery.status} {delivery.daysVariance !== null && (
                        <>({delivery.daysVariance > 0 ? '+' : ''}{delivery.daysVariance} days)</>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {deliveryPerformance.filter(delivery => delivery.status !== "Unknown").length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No delivery performance data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Origin & Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Top Origins */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Top Origins</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={originStats.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {originStats.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Top Destinations */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Top Destinations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={destinationStats.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {destinationStats.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* NEW: Top Routes */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-3">Top Routes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRoutes.slice(0, 5)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Number of Shipments" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Monthly Trend */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Monthly Shipment Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyShipments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}