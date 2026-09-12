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
      localStorage.setItem('admin_auth_time', Date.now().toString());
      onLogin();
    } else {
      setError("Noto'g'ri parol kiritdingiz!");
    }
  };

  return (
    <div className="min-h-screen bg-[#1e262c] flex items-center justify-center p-4">
      <div className="bg-[var(--color-panel-dark)] p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[var(--color-brand-orange)]/20 p-3 rounded-full text-[var(--color-brand-orange)] mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Admin Panelga kirish</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Davom etish uchun parolni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">Parol</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--color-border-dark)] rounded-lg p-3 outline-none focus:border-[var(--color-brand-orange)] focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="••••••••"
              required
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          
          <button 
            type="submit"
            className="w-full bg-[var(--color-brand-orange)] text-white font-medium p-3 rounded-lg hover:bg-[#e06c17] transition-colors"
          >
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
}
