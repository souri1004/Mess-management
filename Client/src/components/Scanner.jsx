import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Scanner = ({ currentMeal }) => {
  const [inputVal, setInputVal] = useState('');
  const [status, setStatus] = useState({ type: 'idle', msg: 'Ready to Scan' });
  const [studentDetails, setStudentDetails] = useState(null);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null); // <--- NEW: Stores the cleanup timer ID

  // Focus Management (Keep input focused)
  useEffect(() => {
    const focusInput = () => {
      if(inputRef.current) inputRef.current.focus();
    };
    focusInput();
    document.addEventListener('click', focusInput);
    return () => document.removeEventListener('click', focusInput);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleScan = async (e) => {
    if (e.key === 'Enter') {
      const qrCode = inputVal;
      setInputVal(''); // Clear input immediately for the next scan
      
      if (!qrCode.trim()) return;

      // 1. INTERRUPT: Clear any previous reset timer running
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      try {
        setStatus({ type: 'processing', msg: 'Verifying...' });
        
        const res = await axios.post(`${API_URL}/api/attendance/mark`, {
          qrCode,
          mealType: currentMeal 
        });

        // Success State
        setStatus({ type: 'success', msg: 'ACCESS GRANTED' });
        setStudentDetails(res.data.student);
        
        // 2. SET NEW TIMER: Wait 2s, then reset (unless interrupted by next scan)
        timerRef.current = setTimeout(() => {
            setStatus({ type: 'idle', msg: 'Ready to Scan' });
            setStudentDetails(null);
        }, 2000);

      } catch (err) {
        // Error State
        const errorMsg = err.response?.data?.message || 'Error';
        setStatus({ type: 'error', msg: errorMsg });
        setStudentDetails(null);
        
        // 2. SET NEW TIMER for Error too
        timerRef.current = setTimeout(() => {
            setStatus({ type: 'idle', msg: 'Ready to Scan' });
        }, 2000);
      }
    }
  };

  // Styles
  const getStatusStyles = () => {
    switch (status.type) {
      case 'success': return 'bg-green-500 border-green-600 text-white scale-105 shadow-green-200';
      case 'error': return 'bg-red-500 border-red-600 text-white shake shadow-red-200';
      case 'processing': return 'bg-yellow-400 border-yellow-500 text-white';
      default: return 'bg-white border-slate-200 text-slate-800 shadow-xl';
    }
  };

  return (
    <div className={`relative w-full h-80 rounded-3xl border-4 flex flex-col justify-center items-center transition-all duration-200 shadow-2xl overflow-hidden ${getStatusStyles()}`}>
      
      {/* Icon */}
      <div className="mb-4">
        {status.type === 'idle' && (
           <div className="w-16 h-16 border-4 border-slate-300 rounded-lg flex items-center justify-center animate-pulse">
             <span className="text-3xl">📷</span>
           </div>
        )}
        {status.type === 'success' && <span className="text-6xl animate-bounce">✅</span>}
        {status.type === 'error' && <span className="text-6xl animate-pulse">❌</span>}
      </div>

      {/* Main Message */}
      <h2 className="text-4xl font-black uppercase tracking-wider text-center px-4">
        {status.msg}
      </h2>
      
      {/* Student Details */}
      {studentDetails && (
        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center min-w-[200px] border border-white/30">
          <h3 className="text-2xl font-bold">{studentDetails.name}</h3>
          <p className="text-lg opacity-90 font-mono">{studentDetails.id}</p>
        </div>
      )}

      {/* Hidden Input for USB Scanner */}
      <input 
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleScan}
        style={{ opacity: 0, position: 'absolute' }}
        autoComplete="off"
      />
    </div>
  );
};

export default Scanner;