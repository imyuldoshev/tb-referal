import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Students from './pages/Students';
import Login from './pages/Login';
import { LayoutDashboard, BookOpen, Users, LogOut } from 'lucide-react';

function Sidebar({ onLogout }) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Kurslar', path: '/courses', icon: <BookOpen size={20} /> },
    { name: 'O\'quvchilar', path: '/students', icon: <Users size={20} /> },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">TB Referal</h1>
        <p className="text-sm text-gray-500">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === link.path 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut size={20} />
          Chiqish
        </button>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Sahifa yangilanganda xotirani tekshiramiz
    const auth = localStorage.getItem('is_admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('is_admin_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/students" element={<Students />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
