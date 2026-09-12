import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Students from './pages/Students';
import Login from './pages/Login';
import { LayoutDashboard, BookOpen, Users, LogOut, Menu, X, Archive } from 'lucide-react';

function Sidebar({ onLogout, isOpen, onClose }) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Kurslar', path: '/courses', icon: <BookOpen size={20} /> },
    { name: 'O\'quvchilar', path: '/students', icon: <Users size={20} /> },
    { name: 'Arxiv', path: '/archive', icon: <Archive size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`w-64 bg-white h-screen border-r border-gray-200 fixed left-0 top-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">TB Referal</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden text-gray-500 hover:text-gray-800 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => {
                // Close sidebar on mobile when navigating
                if (window.innerWidth < 768) {
                  onClose();
                }
              }}
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
    </>
  );
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 daqiqa (millisoniyalarda)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_time');
    setIsAuthenticated(false);
  };

  const checkAuth = () => {
    const authTime = localStorage.getItem('admin_auth_time');
    if (authTime) {
      if (Date.now() - parseInt(authTime) < SESSION_DURATION) {
        setIsAuthenticated(true);
        return;
      }
    }
    handleLogout();
  };

  useEffect(() => {
    checkAuth();
    const interval = setInterval(() => {
      checkAuth();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateActivity = () => {
      if (isAuthenticated) {
        localStorage.setItem('admin_auth_time', Date.now().toString());
      }
    };
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    
    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="flex bg-gray-50 min-h-screen font-sans">
        <Sidebar 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
          {/* Mobile Header */}
          <div className="md:hidden bg-white px-4 py-3 border-b border-gray-200 flex items-center sticky top-0 z-30 shadow-sm">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-1 -ml-1 rounded-md"
            >
              <Menu size={26} />
            </button>
            <h1 className="ml-3 text-lg font-bold text-blue-600">TB Referal</h1>
          </div>

          <div className="p-4 sm:p-6 md:p-8 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/students" element={<Students archiveMode={false} />} />
              <Route path="/archive" element={<Students archiveMode={true} />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
