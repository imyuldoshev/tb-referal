import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, UserPlus, BookOpen , Loader2} from 'lucide-react';

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-[var(--color-panel-dark)] p-4 sm:p-6 rounded-xl border border-[var(--color-border-dark)] shadow-sm flex flex-col items-center text-center gap-3">
      <div className={`p-3 min-[446px]:p-4 rounded-lg ${color} text-white flex items-center justify-center`}>
        {/* We clone the icon to adjust its size based on viewport if needed, or we just handle it via CSS */}
        <div className="w-5 h-5 min-[446px]:w-6 min-[446px]:h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-[var(--color-text-muted)] text-xs min-[446px]:text-sm font-medium">{title}</h3>
        <p className="text-xl min-[446px]:text-2xl font-bold text-[var(--color-text-main)]">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeReferrals: 0,
    totalCourses: 0
  });

  useEffect(() => {
    // Kichik dashboard statistikasi (Real loyihada alohida endpoint bo'lishi yaxshi)
    const fetchStats = async () => {
    setIsLoading(true);
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
    <div className="space-y-4 min-[446px]:space-y-6">
      <div>
        <h2 className="text-xl min-[446px]:text-2xl font-bold text-[var(--color-text-main)]">Dashboard</h2>
        <p className="text-xs min-[446px]:text-sm text-[var(--color-text-muted)]">Tizim bo'yicha umumiy statistika</p>
      </div>
      
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-panel-dark)] rounded-xl border border-[var(--color-border-dark)] animate-in fade-in duration-300">
          <Loader2 className="animate-spin text-[var(--color-brand-orange)] mb-4" size={32} />
          <p className="text-[var(--color-text-muted)] font-medium">Statistika yuklanmoqda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[1001px]:grid-cols-3 gap-4 min-[446px]:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <StatCard 
          title="Jami O'quvchilar" 
          value={stats.totalStudents} 
          icon={<Users />} 
          color="bg-[var(--color-brand-orange)]" 
        />
        <StatCard 
          title="Faol Referallar" 
          value={stats.activeReferrals} 
          icon={<UserPlus />} 
          color="bg-[#10b981]" 
        />
        <StatCard 
          title="Kurslar soni" 
          value={stats.totalCourses} 
          icon={<BookOpen />} 
          color="bg-[#3b82f6]" 
        />
      </div>
      )}
    </div>
  );
}
