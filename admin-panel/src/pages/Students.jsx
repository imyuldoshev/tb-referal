import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Search, Trash2, Edit2, X, Eye, AlertTriangle, Book, PlusCircle, Users } from 'lucide-react';

export default function Students({ archiveMode = false }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  
  // Tahrirlash (Edit) Modali
  const [editingStudent, setEditingStudent] = useState(null);
  
  // O'chirish (Delete) Modali
  const [deletingId, setDeletingId] = useState(null);

  // Ko'rish (View/Invites) Modali
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [invitedList, setInvitedList] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Kursga qo'shish (Enroll) Modali
  const [enrollData, setEnrollData] = useState(null); 
  // Ko'p o'chirish uchun (Bulk delete)
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Qaysi ro'yxatni ko'rish (manual yoki bot)
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view');
  
  const setViewMode = (mode) => {
    if (mode) {
      setSearchParams({ view: mode });
    } else {
      setSearchParams({});
    }
  };
  
  // Yangi o'quvchi qo'shish modali
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ full_name: '', phone: '', inviter_id: '', course_id: '', status: 'pending' });

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

  const handleClearArchive = async () => {
    if (!window.confirm("Barcha arxivlangan o'quvchilarni butunlay o'chirib tashlaysizmi? Bu amalni ortga qaytarib bo'lmaydi!")) return;
    
    try {
      await api.delete('/students_archive/clear');
      fetchData();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Siz rostdan ham belgilangan ${selectedIds.length} ta o'quvchini o'chirmoqchimisiz?`)) return;
    try {
      await api.post('/students/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students_manual', newStudentData);
      setIsAddModalOpen(false);
      setNewStudentData({ full_name: '', phone: '', inviter_id: '', course_id: '', status: 'pending' });
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

  const handleEnrollClick = async (student, courseId) => {
    if (!courseId) return;
    const course = courses.find(c => c.id === courseId);
    
    try {
      // O'quvchi nechta odam taklif qilganini tekshiramiz (skidka hisoblash uchun)
      const res = await api.get(`/students/${student.id}/invited`);
      const invites = res.data;
      const activeCount = invites.filter(i => i.status === 'active').length;
      
      // Har bir faol taklif uchun 5% skidka (masalan maksimal 100%)
      const rawDiscountPercent = activeCount * 5;
      const discountPercent = rawDiscountPercent > 100 ? 100 : rawDiscountPercent;
      
      const discountAmount = (course.price * discountPercent) / 100;
      const finalPrice = course.price - discountAmount;
      
      setEnrollData({
        student,
        course,
        activeCount,
        discountPercent,
        basePrice: course.price,
        finalPrice
      });
    } catch (err) {
      alert("Skidkani hisoblashda xatolik: " + err.message);
    }
  };

  const confirmEnroll = async () => {
    try {
      await api.post(`/students/${enrollData.student.id}/enroll`, { course_id: enrollData.course.id });
      setEnrollData(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Xatolik: " + err.message);
      setEnrollData(null); // xato bo'lsa ham modalni yopamiz (masalan allaqachon qo'shilgan bo'lsa)
    }
  };

  const filteredStudents = students.filter(s => {
    // Determine if student has completed registration
    const isCompleted = s.full_name !== 'pending' && s.phone;
    
    if (archiveMode && isCompleted) return false;
    if (!archiveMode && !isCompleted) return false;

    if (!archiveMode) {
      if (viewMode === 'manual' && s.telegram_id !== null) return false;
      if (viewMode === 'bot' && s.telegram_id === null) return false;
    }

    const term = searchQuery.toLowerCase();
    const name = s.full_name?.toLowerCase() || '';
    const matchesSearch = name.includes(term);

    let matchesCourse = true;
    if (filterCourse !== 'all') {
      const inReferralCourse = s.referral_info && s.referral_info.some(r => r.course && r.course.id === filterCourse);
      const inEnrolledCourse = s.enrolled_courses && s.enrolled_courses.some(ec => ec.course && ec.course.id === filterCourse);
      matchesCourse = inReferralCourse || inEnrolledCourse;
    }

    return matchesSearch && matchesCourse;
  });

  if (!archiveMode && !viewMode) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">O'quvchilar</h2>
          <p className="text-gray-500">O'quvchilar ro'yxatini ko'rish usulini tanlang</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setViewMode('manual')}
            className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <PlusCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Qo'lda qo'shilganlar</h3>
              <p className="text-gray-500 mt-2">Siz tomoningizdan tizimga kiritilgan o'quvchilar</p>
            </div>
          </div>

          <div 
            onClick={() => setViewMode('bot')}
            className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bot orqali kelganlar</h3>
              <p className="text-gray-500 mt-2">Telegram botdan ro'yxatdan o'tgan o'quvchilar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-[446px]:space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">

            <h2 className="text-xl min-[446px]:text-2xl font-bold text-gray-900">
              {archiveMode ? "Arxiv" : viewMode === 'manual' ? "Qo'lda qo'shilganlar" : viewMode === 'bot' ? "Bot o'quvchilari" : "O'quvchilar va Referallar"}
            </h2>
          </div>
          <p className="text-xs min-[446px]:text-sm text-gray-500 mt-1">{archiveMode ? "Ro'yxatdan o'tishni tugallamagan talabalar" : "Talabalar ro'yxati va ularning taklif holati"}</p>
        </div>
        <div className="flex flex-col min-[446px]:flex-row gap-2 min-[446px]:gap-4 w-full lg:w-auto items-center">
          {!archiveMode && viewMode === 'manual' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full min-[446px]:w-auto justify-center"
            >
              <PlusCircle size={18} />
              O'quvchi qo'shish
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Tanlanganlarni o'chirish ({selectedIds.length})
            </button>
          )}
          {archiveMode && (
            <button
              onClick={handleClearArchive}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Barchasini tozalash
            </button>
          )}
          <select 
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500 bg-white w-full min-[446px]:w-auto"
          >
            <option value="all">Barcha kurslar</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <div className="relative w-full min-[446px]:w-auto">
            <input 
              type="text" 
              placeholder="Ism bo'yicha qidiruv..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 w-full min-[446px]:w-64 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-medium text-gray-600 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredStudents.map(s => s.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="p-4 font-medium text-gray-600">O'quvchi</th>
                <th className="p-4 font-medium text-gray-600">O'qiyotgan Kursi</th>
                <th className="p-4 font-medium text-gray-600">Taklif qildi (Inviter)</th>
                <th className="p-4 font-medium text-gray-600">Referal Statusi</th>
                <th className="p-4 font-medium text-gray-600 text-right">Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Hech qanday ma'lumot topilmadi</td></tr>
              ) : (
                filteredStudents.map(student => {
                  const refInfo = student.referral_info && student.referral_info.length > 0 
                    ? student.referral_info[0] 
                    : null;

                  // Kurslarini topish
                  let courseNames = [];
                  if (refInfo && refInfo.course) courseNames.push(refInfo.course.title);
                  if (student.enrolled_courses) {
                    student.enrolled_courses.forEach(ec => {
                      if (ec.course && !courseNames.includes(ec.course.title)) {
                        courseNames.push(ec.course.title);
                      }
                    });
                  }

                  return (
                    <tr key={student.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, student.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== student.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        {student.full_name === 'pending' ? (
                          <div className="mb-1">
                            <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-200">
                              Ro'yxatdan o'tish tugallanmagan
                            </span>
                          </div>
                        ) : (
                          <p className="font-medium text-gray-900">{student.full_name}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-0.5">
                          {student.phone ? student.phone : <span className="text-gray-400 text-xs">ID: {student.telegram_id}</span>}
                        </p>
                      </td>
                      <td className="p-4">
                        {courseNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {courseNames.map((cName, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                                <Book size={12} /> {cName}
                              </span>
                            ))}
                          </div>
                        )}
                        <select 
                          className="border border-gray-300 rounded p-1 outline-none text-xs bg-gray-50 w-full hover:border-blue-400 transition-colors min-w-[120px]"
                          value="" // Doim bo'sh turadi, chunki bu faqat harakat (action)
                          onChange={(e) => handleEnrollClick(student, e.target.value)}
                        >
                          <option value="">+ Kursga qo'shish...</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        {refInfo ? (
                           <p className="font-medium text-blue-600">{refInfo.inviter?.full_name}</p>
                        ) : (
                           <span className="text-gray-400 italic text-sm">O'zi kelgan</span>
                        )}
                      </td>
                      <td className="p-4">
                        {refInfo ? (
                          <select 
                            className="border border-gray-300 rounded p-1 outline-none text-sm bg-white"
                            value={refInfo.status}
                            onChange={(e) => handleStatusChange(refInfo.id, e.target.value)}
                          >
                            <option value="pending">Kutilmoqda (Pending)</option>
                            <option value="active">Faol (Active)</option>
                            <option value="left">Ketdi (Left)</option>
                          </select>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Kursga qo'shish (Enroll) Modali va Skidka hisoblash */}
      {enrollData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Kursga qo'shish</h3>
                  <p className="text-sm text-gray-500">To'lov va chegirma hisob-kitobi</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">O'quvchi:</span>
                  <span className="font-medium text-gray-900">{enrollData.student.full_name}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tanlangan kurs:</span>
                  <span className="font-medium text-blue-600">{enrollData.course.title}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Faol takliflari (odam):</span>
                  <span className="font-bold text-gray-900">{enrollData.activeCount} ta</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kursning asl narxi:</span>
                  <span className="text-gray-500 line-through">{enrollData.basePrice.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Takliflar uchun chegirma:</span>
                  <span className="text-green-600 font-bold">-{enrollData.discountPercent}%</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">To'lashi kerak:</span>
                  <span className="font-bold text-blue-600">{enrollData.finalPrice.toLocaleString()} so'm</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setEnrollData(null)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={confirmEnroll}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Tasdiqlash va Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Yangi o'quvchi qo'shish Modali */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Yangi o'quvchi qo'shish</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism va Familiya</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={newStudentData.full_name}
                  onChange={(e) => setNewStudentData({...newStudentData, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={newStudentData.phone}
                  onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})}
                />
              </div>
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Referal ma'lumotlari (Ixtiyoriy)</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kim taklif qildi?</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500 text-sm"
                      value={newStudentData.inviter_id}
                      onChange={(e) => setNewStudentData({...newStudentData, inviter_id: e.target.value})}
                    >
                      <option value="">-- Tanlanmagan --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.phone || 'Nomsiz'})</option>
                      ))}
                    </select>
                  </div>
                  
                  {newStudentData.inviter_id && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qaysi kursga taklif qildi?</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500 text-sm"
                          value={newStudentData.course_id}
                          onChange={(e) => setNewStudentData({...newStudentData, course_id: e.target.value})}
                          required={!!newStudentData.inviter_id}
                        >
                          <option value="">-- Kursni tanlang --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Referal holati</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500 text-sm"
                          value={newStudentData.status}
                          onChange={(e) => setNewStudentData({...newStudentData, status: e.target.value})}
                        >
                          <option value="pending">Kutishda (Pending)</option>
                          <option value="active">Faol (Active - chegirma beriladi)</option>
                          <option value="left">Ketgan (Left)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium">
                  Qo'shish
                </button>
              </div>
            </form>
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
