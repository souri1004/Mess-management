import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import QRScanner from './components/QRScanner'; // Import the scanner

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  
  // New state to toggle between Dashboard and Scanner
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'scanner'

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Wrong Password');
    }
  };

  // 1. LOGIN SCREEN (Unchanged)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Mess Admin Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Enter Admin Password" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-95"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN AREA
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm p-4 mb-6 flex justify-center gap-4">
        <button 
          onClick={() => setView('dashboard')}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            view === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Admin Dashboard
        </button>

        <button 
          onClick={() => setView('scanner')}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            view === 'scanner' 
              ? 'bg-green-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Open Scanner (Test)
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="container mx-auto p-4">
        {view === 'dashboard' ? (
          <Dashboard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
            <QRScanner />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;