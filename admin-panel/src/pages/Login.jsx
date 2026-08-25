import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parolni tekshirish (Vercel Environment dan yoki default 'admin123' dan olamiz)
    const CORRECT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem('is_admin_authenticated', 'true');
      onLogin();
    } else {
      setError("Noto'g'ri parol kiritdingiz!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panelga kirish</h1>
          <p className="text-gray-500 text-sm mt-1">Davom etish uchun parolni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parol</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="••••••••"
              required
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-medium p-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
}
