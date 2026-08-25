import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Trash2 } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        api.get('/students_full'),
        api.get('/courses')
      ]);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (referralId, newStatus) => {
    if(!referralId) return;
    try {
      await api.patch(`/referrals/${referralId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Bu o'quvchini va unga tegishli hamma takliflarni butunlay o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/students/${id}`);
      fetchData();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const name = s.full_name?.toLowerCase() || '';
    return name.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">O'quvchilar va Referallar</h2>
          <p className="text-gray-500">Talabalar ro'yxati va ularning taklif holati</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ism bo'yicha qidiruv..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-medium text-gray-600">O'quvchi</th>
              <th className="p-4 font-medium text-gray-600">Taklif qildi (Inviter)</th>
              <th className="p-4 font-medium text-gray-600">Referal Statusi</th>
              <th className="p-4 font-medium text-gray-600">Harakatlar</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">Hech qanday ma'lumot topilmadi</td></tr>
            ) : (
              filteredStudents.map(student => {
                // Supabase one-to-many relationship returns an array.
                const refInfo = student.referral_info && student.referral_info.length > 0 
                  ? student.referral_info[0] 
                  : null;

                return (
                  <tr key={student.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-gray-500">{student.phone || student.telegram_id}</p>
                    </td>
                    <td className="p-4">
                      {refInfo ? (
                         <p className="font-medium text-blue-600">{refInfo.inviter?.full_name}</p>
                      ) : (
                         <span className="text-gray-400 italic">O'zi kelgan</span>
                      )}
                    </td>
                    <td className="p-4">
                      {refInfo ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          refInfo.status === 'active' ? 'bg-green-100 text-green-700' : 
                          refInfo.status === 'left' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {refInfo.status}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-between">
                        {refInfo ? (
                          <select 
                            className="border border-gray-300 rounded p-1 outline-none text-sm"
                            value={refInfo.status}
                            onChange={(e) => handleStatusChange(refInfo.id, e.target.value)}
                          >
                            <option value="pending">Kutilmoqda (Pending)</option>
                            <option value="active">Faol (Active)</option>
                            <option value="left">Ketdi (Left)</option>
                          </select>
                        ) : (
                          <span></span>
                        )}
                        <button 
                          onClick={() => handleDeleteStudent(student.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-4"
                          title="O'quvchini butunlay o'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
