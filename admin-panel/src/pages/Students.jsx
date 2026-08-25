import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Trash2, Edit2, X, Check } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tahrirlash uchun statelar
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });

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

  const handleEditClick = (student) => {
    setEditingId(student.id);
    setEditForm({ full_name: student.full_name || '', phone: student.phone || '' });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.patch(`/students/${id}`, {
        full_name: editForm.full_name,
        phone: editForm.phone
      });
      setEditingId(null);
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
                const refInfo = student.referral_info && student.referral_info.length > 0 
                  ? student.referral_info[0] 
                  : null;

                const isEditing = editingId === student.id;

                return (
                  <tr key={student.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input 
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                            className="w-full border border-gray-300 rounded p-1 text-sm outline-none"
                            placeholder="Ism familiya"
                          />
                          <input 
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            className="w-full border border-gray-300 rounded p-1 text-sm outline-none"
                            placeholder="Telefon raqam"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-gray-500">{student.phone || student.telegram_id}</p>
                        </>
                      )}
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
                        {/* Status o'zgartirish (faqat referali borlar uchun) */}
                        <div className="flex-1">
                          {refInfo && !isEditing && (
                            <select 
                              className="border border-gray-300 rounded p-1 outline-none text-sm"
                              value={refInfo.status}
                              onChange={(e) => handleStatusChange(refInfo.id, e.target.value)}
                            >
                              <option value="pending">Kutilmoqda (Pending)</option>
                              <option value="active">Faol (Active)</option>
                              <option value="left">Ketdi (Left)</option>
                            </select>
                          )}
                        </div>

                        {/* Tahrirlash va O'chirish tugmalari */}
                        <div className="flex items-center gap-1 ml-4">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(student.id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Saqlash"><Check size={18}/></button>
                              <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded" title="Bekor qilish"><X size={18}/></button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEditClick(student)} 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="O'quvchini tahrirlash"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(student.id)} 
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="O'quvchini butunlay o'chirish"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
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
