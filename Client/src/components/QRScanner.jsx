import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('');
  
  // This key controls the scanner. Changing it forces the camera to restart.
  const [scanKey, setScanKey] = useState(0); 

  useEffect(() => {
    // 1. Initialize the scanner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 5, 
        qrbox: { width: 250, height: 250 } 
      },
      false
    );

    // 2. Success Handler
    const onScanSuccess = async (decodedText) => {
      scanner.clear(); // Stop the camera
      setScanResult(decodedText); // Show the result
      await markAttendance(decodedText); // Send to backend
    };

    // 3. Render the scanner
    scanner.render(onScanSuccess, (error) => {
      // Ignore scan failures (happens every frame no QR is found)
    });

    // 4. Cleanup on unmount
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner. ", error));
    };
  }, [scanKey]); // <--- dependency array: Re-runs this effect when scanKey changes

  const markAttendance = async (qrCodeHash) => {
    try {
      setStatus('⏳ Marking attendance...');
      
      // FIXED: Endpoint is now '/mark' and we send a default 'mealType'
      const response = await axios.post(`${API_URL}/api/attendance/mark`, {
        qrCode: qrCodeHash,
        mealType: 'Breakfast' // Defaulting to Breakfast for this test component
      });

      if (response.data.success) {
        setStatus(`✅ Success: ${response.data.student.name} - ${response.data.mealType}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error marking attendance';
      setStatus(`❌ Failed: ${errorMsg}`);
    }
  };

  const handleNextStudent = () => {
    setScanResult(null); // Clear the result text
    setStatus('');       // Clear the success/fail message
    setScanKey(prev => prev + 1); // Increment key -> This restarts the useEffect (Camera)
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Mess Entry Scanner (Camera Test)</h2>
      
      {/* The key prop is crucial here. When scanKey changes, 
         React completely removes this div and creates a new one, 
         ensuring the scanner renders cleanly.
      */}
      <div key={scanKey} id="reader" style={{ width: '400px', margin: '0 auto' }}></div>

      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd' }}>
        <h3>Scanned Code: {scanResult || 'Scanning...'}</h3>
        <h3 style={{ color: status.includes('Success') ? 'green' : 'red' }}>
          {status}
        </h3>
        
        {/* Only show this button after a scan */}
        {scanResult && (
          <button 
            onClick={handleNextStudent} 
            style={{ 
              padding: '10px 20px', 
              marginTop: '10px', 
              background: 'blue', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Scan Next Student
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;