import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, UserPlus, BookOpen } from 'lucide-react';

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-lg ${color} text-white`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeReferrals: 0,
    totalCourses: 0
  });

  useEffect(() => {
    // Kichik dashboard statistikasi (Real loyihada alohida endpoint bo'lishi yaxshi)
    const fetchStats = async () => {
      try {
        const [studentsRes, coursesRes] = await Promise.all([
          api.get('/students'),
          api.get('/courses')
        ]);
        
        // Hozirgi referallar DB'dan kelyapti deb faraz qilamiz
        setStats({
          totalStudents: studentsRes.data.length,
          activeReferrals: 0, // Buni keyinchalik backendda sanash mumkin
          totalCourses: coursesRes.data.length
        });
      } catch (err) {
        console.error("Xatolik:", err);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Tizim bo'yicha umumiy statistika</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Jami O'quvchilar" 
          value={stats.totalStudents} 
          icon={<Users size={24} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Faol Referallar" 
          value={stats.activeReferrals} 
          icon={<UserPlus size={24} />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Kurslar soni" 
          value={stats.totalCourses} 
          icon={<BookOpen size={24} />} 
          color="bg-purple-500" 
        />
      </div>
    </div>
  );
}
