import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Trash2, Edit2, X, Eye, AlertTriangle } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tahrirlash (Edit) Modali
  const [editingStudent, setEditingStudent] = useState(null);
  
  // O'chirish (Delete) Modali
  const [deletingId, setDeletingId] = useState(null);

  // Ko'rish (View/Invites) Modali
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [invitedList, setInvitedList] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  const confirmDelete = async () => {
    try {
      await api.delete(`/students/${deletingId}`);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/students/${editingStudent.id}`, {
        full_name: editingStudent.full_name,
        phone: editingStudent.phone
      });
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleViewInvites = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await api.get(`/students/${student.id}/invited`);
      setInvitedList(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      alert("Taklif qilinganlarni yuklashda xatolik: " + err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const name = s.full_name?.toLowerCase() || '';
    return name.includes(term);
  });

  return (
    <div className="space-y-6 relative">
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
                        {/* Status o'zgartirish (faqat referali borlar uchun) */}
                        <div className="flex-1">
                          {refInfo && (
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

                        {/* Tahrirlash, Ko'rish va O'chirish tugmalari */}
                        <div className="flex items-center gap-1 ml-4">
                          <button 
                            onClick={() => handleViewInvites(student)} 
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Taklif qilgan o'quvchilarini ko'rish"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingStudent({...student, phone: student.phone || ''})} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="O'quvchini tahrirlash"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setDeletingId(student.id)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="O'quvchini butunlay o'chirish"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* --- MODALS --- */}

      {/* Ko'rish (View/Invites) Modali */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.full_name}</h3>
                <p className="text-sm text-gray-500">Taklif qilgan o'quvchilari va skidkasi</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg flex-1 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Jami taklif qilinganlar</p>
                  <p className="text-2xl font-bold text-blue-900">{invitedList.length} ta</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg flex-1 border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-1">Faol o'quvchilar (Skidka %)</p>
                  <p className="text-2xl font-bold text-green-900">
                    {invitedList.filter(i => i.status === 'active').length * 5}% chegirma
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-4">Taklif qilingan o'quvchilar ro'yxati:</h4>
              
              {invitedList.length === 0 ? (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  Ushbu o'quvchi hali hech kimni taklif qilmagan.
                </p>
              ) : (
                <div className="space-y-3">
                  {invitedList.map(invite => (
                    <div key={invite.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{invite.referee?.full_name}</p>
                        <p className="text-sm text-gray-500">{invite.referee?.phone}</p>
                        <p className="text-xs text-blue-600 mt-1">{invite.course?.title || "Kurs tanlanmagan"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invite.status === 'active' ? 'bg-green-100 text-green-700' : 
                        invite.status === 'left' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invite.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 text-right bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tahrirlash (Edit) Modali */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">O'quvchini tahrirlash</h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism va Familiya</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* O'chirish (Delete) Modali */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm text-center p-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ishonchingiz komilmi?</h3>
            <p className="text-gray-500 mb-6">Siz bu o'quvchini va u bilan bog'liq hamma takliflarni butunlay o'chirib tashlamoqchisiz.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingId(null)} className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium w-full">
                Yo'q, qoladi
              </button>
              <button onClick={confirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium w-full">
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
