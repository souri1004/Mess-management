import React, { useState } from 'react';
import Scanner from './Scanner';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [currentMeal, setCurrentMeal] = useState('Breakfast');
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [file, setFile] = useState(null);

  // Timeline State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/api/admin/upload-students`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
    } catch (err) {
      alert("Upload failed");
    }
  };

  // --- CSV GENERATOR FUNCTION ---
  const downloadReport = async () => {
     if (!startDate || !endDate) {
         return alert("Please select both Start Date and End Date");
     }

     try {
       setIsDownloading(true);
       
       // 1. Fetch Data
       const res = await axios.get(`${API_URL}/api/admin/report`, {
           params: { startDate, endDate }
       });

       const data = res.data;

       if (data.length === 0) {
           setIsDownloading(false);
           return alert("No records found for this date range.");
       }

       // 2. Convert JSON to CSV
       const headers = ["Date", "Time", "Roll_No", "Name", "Meal_Type"];
       const csvRows = [
           headers.join(','), // Header Row
           ...data.map(row => [
               row.Date,
               row.Time,
               row.Roll_No,
               `"${row.Name}"`, // Quote name to handle spaces
               row.Meal_Type
           ].join(','))
       ];

       const csvString = csvRows.join('\n');

       // 3. Trigger Download
       const blob = new Blob([csvString], { type: 'text/csv' });
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.setAttribute('hidden', '');
       a.setAttribute('href', url);
       a.setAttribute('download', `Mess_Report_${startDate}_to_${endDate}.csv`);
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       
       setIsDownloading(false);

     } catch(err) {
         console.error(err);
         setIsDownloading(false);
         alert("Error generating report");
     }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Section */}
      <div className="bg-slate-900 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold tracking-tight mb-6">Mess Management System</h1>
          
          {/* Meal Tabs */}
          <div className="flex flex-wrap justify-center gap-4">
            {meals.map(meal => (
              <button 
                key={meal} 
                onClick={() => setCurrentMeal(meal)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  currentMeal === meal 
                    ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {meal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Info Bar */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <span className="text-lg text-slate-600">
            Current Session: <strong className="text-blue-600 uppercase tracking-wide">{currentMeal}</strong>
          </span>
          <button 
            onClick={() => setShowAdminTools(!showAdminTools)}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 underline underline-offset-4"
          >
            {showAdminTools ? 'Hide Admin Tools' : 'Show Admin Tools'}
          </button>
        </div>

        {/* Scanner Component */}
        <Scanner currentMeal={currentMeal} />

        {/* Admin Tools Panel */}
        {showAdminTools && (
          <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Admin Controls</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* CSV Upload */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Update Student List (CSV)</label>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button 
                    onClick={handleFileUpload}
                    className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-black transition"
                  >
                    Upload
                  </button>
                </div>
              </div>

              {/* Reports Section with Timeline */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Download Report (Timeline)</label>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <span className="text-xs text-slate-500 block mb-1">From:</span>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="text-xs text-slate-500 block mb-1">To:</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    <button 
                    onClick={downloadReport}
                    disabled={isDownloading}
                    className={`w-full text-white px-4 py-2 rounded-md transition shadow-sm font-medium ${
                        isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    >
                    {isDownloading ? 'Generating CSV...' : 'Download CSV Report 📥'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;