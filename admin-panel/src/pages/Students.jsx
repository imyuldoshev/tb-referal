import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Search, Trash2, Edit2, X, Eye, AlertTriangle, Book, PlusCircle, Users, Link as LinkIcon , Loader2} from 'lucide-react';

export default function Students({ archiveMode = false }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  
  // Tahrirlash (Edit) Modali
  const [editingStudent, setEditingStudent] = useState(null);
  
  // O'chirish (Delete) Modali
  const [confirmDialog, setConfirmDialog] = useState(null);

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

  const [botUsername, setBotUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, coursesRes, botRes] = await Promise.all([
        api.get('/students_full'),
        api.get('/courses'),
        api.get('/bot-info').catch(() => ({ data: { username: '' } }))
      ]);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
      if (botRes.data?.username) setBotUsername(botRes.data.username);
    } catch (err) {
      console.error(err);
    } finally { setIsLoading(false); } };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (referralId, newStatus) => {
    if(!referralId) return;
    try {
      await api.patch(`/referrals/${referralId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };



  const handleClearArchive = () => {
    setConfirmDialog({
      title: "Arxivni tozalash",
      message: "Barcha arxivlangan o'quvchilarni butunlay o'chirib tashlaysizmi? Bu amalni ortga qaytarib bo'lmaydi!",
      actionText: "Ha, tozalansin",
      onConfirm: async () => {
        try {
          await api.delete('/students_archive/clear');
          fetchData();
          toast.success("Arxiv tozalandi!");
        } catch (err) {
          toast.error("Xatolik: " + err.message);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      title: "O'quvchilarni o'chirish",
      message: `Siz rostdan ham belgilangan ${selectedIds.length} ta o'quvchini o'chirmoqchimisiz?`,
      actionText: "Ha, o'chirilsin",
      onConfirm: async () => {
        try {
          await api.post('/students/bulk-delete', { ids: selectedIds });
          setSelectedIds([]);
          fetchData();
          toast.success("O'quvchilar o'chirildi!");
        } catch (err) {
          toast.error("Xatolik: " + err.message);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students_manual', newStudentData);
      setIsAddModalOpen(false);
      setNewStudentData({ full_name: '', phone: '', inviter_id: '', course_id: '', status: 'pending' });
      fetchData();
      toast.success("O'quvchi qo'shildi!");
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleCopyLink = (student) => {
    if (student.telegram_id !== null) {
      toast.success("âœ… Ushbu o'quvchi allaqachon botga ulangan!");
      return;
    }
    const link = botUsername ? `https://t.me/${botUsername}?start=LINK_${student.id}` : `LINK_${student.id}`;
    navigator.clipboard.writeText(link);
    toast.success(`O'quvchini botga ulash havolasi nusxalandi!`);
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
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleViewInvites = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await api.get(`/students/${student.id}/invited`);
      setInvitedList(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      toast.error("Taklif qilinganlarni yuklashda xatolik: " + err.message);
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
      toast.error("Skidkani hisoblashda xatolik: " + err.message);
    }
  };

  const confirmEnroll = async () => {
    try {
      await api.post(`/students/${enrollData.student.id}/enroll`, { course_id: enrollData.course.id });
      setEnrollData(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Xatolik: " + err.message);
      setEnrollData(null); // xato bo'lsa ham modalni yopamiz (masalan allaqachon qo'shilgan bo'lsa)
    }
  };

  const filteredStudents = students.filter(s => {
    // Determine if student has completed registration
    const isCompleted = s.full_name !== 'pending' && s.phone;
    
    if (archiveMode && isCompleted) return false;
    if (!archiveMode && !isCompleted) return false;

    if (!archiveMode) {
      const isManual = s.referral_code?.startsWith('MANUAL_') || (!s.referral_code?.startsWith('REF_') && s.telegram_id === null);
      if (viewMode === 'manual' && !isManual) return false;
      if (viewMode === 'bot' && isManual) return false;
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
          <h2 className="text-2xl font-bold text-[var(--color-text-main)]">O'quvchilar</h2>
          <p className="text-[var(--color-text-muted)]">O'quvchilar ro'yxatini ko'rish usulini tanlang</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setViewMode('manual')}
            className="bg-[var(--color-panel-dark)] p-8 rounded-xl shadow-sm border border-[var(--color-border-dark)] cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)] rounded-full flex items-center justify-center">
              <PlusCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Qo'lda qo'shilganlar</h3>
              <p className="text-[var(--color-text-muted)] mt-2">Siz tomoningizdan tizimga kiritilgan o'quvchilar</p>
            </div>
          </div>

          <div 
            onClick={() => setViewMode('bot')}
            className="bg-[var(--color-panel-dark)] p-8 rounded-xl shadow-sm border border-[var(--color-border-dark)] cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)] rounded-full flex items-center justify-center">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Bot orqali kelganlar</h3>
              <p className="text-[var(--color-text-muted)] mt-2">Telegram botdan ro'yxatdan o'tgan o'quvchilar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-[446px]:space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all duration-300">
        <div>
          <div className="flex items-center gap-3">

            <h2 className="text-xl min-[446px]:text-2xl font-bold text-[var(--color-text-main)]">
              {archiveMode ? "Arxiv" : viewMode === 'manual' ? "Qo'lda qo'shilganlar" : viewMode === 'bot' ? "Bot o'quvchilari" : "O'quvchilar va Referallar"}
            </h2>
          </div>
          <p className="text-xs min-[446px]:text-sm text-[var(--color-text-muted)] mt-1">{archiveMode ? "Ro'yxatdan o'tishni tugallamagan talabalar" : "Talabalar ro'yxati va ularning taklif holati"}</p>
        </div>
        <div className="flex flex-col min-[446px]:flex-row flex-wrap gap-2 min-[446px]:gap-4 w-full lg:w-auto items-center min-h-[42px] transition-all duration-300 relative">
          {!archiveMode && viewMode === 'manual' && selectedIds.length === 0 && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-orange)] text-white rounded-lg hover:bg-[#e06c17] transition-all duration-300 w-full min-[446px]:w-auto justify-center animate-in zoom-in-95 whitespace-nowrap shrink-0"
            >
              <PlusCircle size={18} />
              O'quvchi qo'shish
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 animate-in zoom-in-95 whitespace-nowrap shrink-0"
            >
              <Trash2 size={18} />
              Tanlanganlarni o'chirish ({selectedIds.length})
            </button>
          )}
          {archiveMode && (
            <button
              onClick={handleClearArchive}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 animate-in zoom-in-95 whitespace-nowrap shrink-0"
            >
              <Trash2 size={18} />
              Barchasini tozalash
            </button>
          )}
          <select 
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)] bg-[var(--color-panel-dark)] w-full min-[446px]:w-auto"
          >
            <option value="all">Barcha kurslar</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <div className="relative w-full min-[446px]:w-auto">
            <input type="text" 
              placeholder="Ism bo'yicha qidiruv..." 
              className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] pl-10 pr-4 py-2 border border-[var(--color-border-dark)] rounded-lg outline-none focus:border-[var(--color-brand-orange)] w-full min-[446px]:w-64 bg-[var(--color-panel-dark)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-[#64748b]" />
          </div>
        </div>
      </div>

      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-panel-dark)] rounded-xl border border-[var(--color-border-dark)] animate-in fade-in duration-300 w-full">
          <Loader2 className="animate-spin text-[var(--color-brand-orange)] mb-4" size={32} />
          <p className="text-[var(--color-text-muted)] font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      ) : (
        <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-sm border border-[var(--color-border-dark)] overflow-hidden w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-[var(--color-bg-dark)] border-b border-[var(--color-border-dark)]">
                <th className="p-4 font-medium text-[var(--color-text-muted)] w-12">
                  <input type="checkbox" 
                    className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-4 h-4 rounded border-[var(--color-border-dark)] text-[var(--color-brand-orange)] focus:ring-[var(--color-brand-orange)] accent-[var(--color-brand-orange)] cursor-pointer"
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
                <th className="p-4 font-medium text-[var(--color-text-muted)]">O'quvchi</th>
                <th className="p-4 font-medium text-[var(--color-text-muted)]">O'qiyotgan Kursi</th>
                <th className="p-4 font-medium text-[var(--color-text-muted)]">Taklif qildi (Inviter)</th>
                <th className="p-4 font-medium text-[var(--color-text-muted)]">Referal Statusi</th>
                <th className="p-4 font-medium text-[var(--color-text-muted)] text-right">Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-[var(--color-text-muted)]">Hech qanday ma'lumot topilmadi</td></tr>
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
                    <tr key={student.id} className="border-b border-[var(--color-border-dark)] last:border-0 hover:bg-[var(--color-bg-dark)]">
                      <td className="p-4">
                        <input type="checkbox" 
                          className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-4 h-4 rounded border-[var(--color-border-dark)] text-[var(--color-brand-orange)] focus:ring-[var(--color-brand-orange)] accent-[var(--color-brand-orange)] cursor-pointer"
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
                            <span className="inline-flex items-center px-2 py-1 bg-amber-500/100/10 text-amber-500 text-xs font-semibold rounded-md border border-amber-500/30">
                              Ro'yxatdan o'tish tugallanmagan
                            </span>
                          </div>
                        ) : (
                          <p className="font-medium text-[var(--color-text-main)]">{student.full_name}</p>
                        )}
                        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                          {student.phone ? student.phone : <span className="text-[#64748b] text-xs">ID: {student.telegram_id}</span>}
                        </p>
                      </td>
                      <td className="p-4">
                        {courseNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {courseNames.map((cName, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-brand-orange)]/10 text-[var(--color-text-main)] text-xs font-medium rounded-md border border-[var(--color-border-dark)]">
                                <Book size={12} /> {cName}
                              </span>
                            ))}
                          </div>
                        )}
                        <select className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] border border-[var(--color-border-dark)] rounded p-1 outline-none text-xs bg-[var(--color-bg-dark)] w-full hover:border-[var(--color-brand-orange)] transition-colors min-w-[120px]"
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
                           <p className="font-medium text-[var(--color-brand-orange)]">{refInfo.inviter?.full_name}</p>
                        ) : (
                           <span className="text-[#64748b] italic text-sm">
                             {(student.referral_code?.startsWith('MANUAL_') || (!student.referral_code?.startsWith('REF_') && student.telegram_id === null)) ? "Qo'lda qo'shilgan" : "O'zi kelgan"}
                           </span>
                        )}
                      </td>
                      <td className="p-4">
                        {refInfo ? (
                          <select className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] border border-[var(--color-border-dark)] rounded p-1 outline-none text-sm bg-[var(--color-panel-dark)]"
                            value={refInfo.status}
                            onChange={(e) => handleStatusChange(refInfo.id, e.target.value)}
                          >
                            <option value="pending">Kutilmoqda (Pending)</option>
                            <option value="active">Faol (Active)</option>
                            <option value="left">Ketdi (Left)</option>
                          </select>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                              onClick={() => handleCopyLink(student)}
                              className={`p-2 rounded transition-colors ${student.telegram_id !== null ? 'text-green-500 hover:bg-green-500/100/10' : 'text-[#64748b] hover:text-purple-600 hover:bg-purple-500/100/10'}`}
                              title={student.telegram_id !== null ? "Botga ulangan" : "Botga ulash havolasini nusxalash"}
                          >
                              <LinkIcon size={18} />
                          </button>
                          <button 
                            onClick={() => handleViewInvites(student)} 
                            className="p-2 text-[#64748b] hover:text-green-600 hover:bg-green-500/100/10 rounded transition-colors"
                            title="Taklif qilgan o'quvchilarini ko'rish"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingStudent({...student, phone: student.phone || ''})} 
                            className="p-2 text-[#64748b] hover:text-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/10 rounded transition-colors"
                            title="O'quvchini tahrirlash"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setConfirmDialog({
                              title: "Ishonchingiz komilmi?",
                              message: "Siz bu o'quvchini va u bilan bog'liq hamma takliflarni butunlay o'chirib tashlamoqchisiz.",
                              actionText: "Ha, o'chirilsin",
                              onConfirm: async () => {
                                try {
                                  await api.delete(`/students/${student.id}`);
                                  fetchData();
                                  toast.success("O'quvchi o'chirildi!");
                                } catch (err) {
                                  toast.error("Xatolik: " + err.message);
                                }
                                setConfirmDialog(null);
                              }
                            })}
                            className="p-2 text-[#64748b] hover:text-red-600 hover:bg-red-500/100/10 rounded transition-colors"
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
      )}

      {/* --- MODALS --- */}

      {/* Kursga qo'shish (Enroll) Modali va Skidka hisoblash */}
      {enrollData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-[var(--color-border-dark)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)] rounded-full flex items-center justify-center">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-main)]">Kursga qo'shish</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">To'lov va chegirma hisob-kitobi</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[var(--color-bg-dark)] p-4 rounded-lg border border-[var(--color-border-dark)]">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--color-text-muted)]">O'quvchi:</span>
                  <span className="font-medium text-[var(--color-text-main)]">{enrollData.student.full_name}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--color-text-muted)]">Tanlangan kurs:</span>
                  <span className="font-medium text-[var(--color-brand-orange)]">{enrollData.course.title}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[var(--color-border-dark)]">
                  <span className="text-[var(--color-text-muted)]">Faol takliflari (odam):</span>
                  <span className="font-bold text-[var(--color-text-main)]">{enrollData.activeCount} ta</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Kursning asl narxi:</span>
                  <span className="text-[var(--color-text-muted)] line-through">{enrollData.basePrice.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Takliflar uchun chegirma:</span>
                  <span className="text-green-600 font-bold">-{enrollData.discountPercent}%</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-[var(--color-border-dark)]">
                  <span className="font-bold text-[var(--color-text-main)]">To'lashi kerak:</span>
                  <span className="font-bold text-[var(--color-brand-orange)]">{enrollData.finalPrice.toLocaleString()} so'm</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border-dark)] flex gap-3 justify-end bg-[var(--color-bg-dark)] rounded-b-xl">
              <button 
                onClick={() => setEnrollData(null)}
                className="px-4 py-2 text-[var(--color-text-muted)] bg-[var(--color-panel-dark)] border border-[var(--color-border-dark)] rounded-lg hover:bg-[var(--color-bg-dark)] font-medium transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={confirmEnroll}
                className="px-4 py-2 text-white bg-[var(--color-brand-orange)] rounded-lg hover:bg-[#e06c17] font-medium transition-colors"
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
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[var(--color-border-dark)] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-main)]">{selectedStudent.full_name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Taklif qilgan o'quvchilari va skidkasi</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-[#64748b] hover:bg-[#1e262c] p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex gap-4 mb-6">
                <div className="bg-[var(--color-brand-orange)]/10 p-4 rounded-lg flex-1 border border-[var(--color-border-dark)]">
                  <p className="text-sm text-[var(--color-brand-orange)] font-medium mb-1">Jami taklif qilinganlar</p>
                  <p className="text-2xl font-bold text-blue-900">{invitedList.length} ta</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg flex-1 border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-1">Faol o'quvchilar (Skidka %)</p>
                  <p className="text-2xl font-bold text-green-900">
                    {invitedList.filter(i => i.status === 'active').length * 5}% chegirma
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-[var(--color-text-main)] mb-4">Taklif qilingan o'quvchilar ro'yxati:</h4>
              
              {invitedList.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-center py-4 bg-[var(--color-bg-dark)] rounded-lg border border-dashed border-[var(--color-border-dark)]">
                  Ushbu o'quvchi hali hech kimni taklif qilmagan.
                </p>
              ) : (
                <div className="space-y-3">
                  {invitedList.map(invite => (
                    <div key={invite.id} className="flex justify-between items-center p-4 border border-[var(--color-border-dark)] rounded-lg hover:border-blue-300 transition-colors">
                      <div>
                        <p className="font-medium text-[var(--color-text-main)]">{invite.referee?.full_name}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{invite.referee?.phone}</p>
                        <p className="text-xs text-[var(--color-brand-orange)] mt-1">{invite.course?.title || "Kurs tanlanmagan"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invite.status === 'active' ? 'bg-green-100 text-green-700' : 
                        invite.status === 'left' ? 'bg-red-500/20 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invite.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[var(--color-border-dark)] text-right bg-[var(--color-bg-dark)] rounded-b-xl">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-[#1e262c] transition-colors"
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
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-[var(--color-border-dark)] flex justify-between items-center">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Yangi o'quvchi qo'shish</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748b] hover:bg-[#1e262c] p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Ism va Familiya</label>
                <input type="text" 
                  required
                  className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                  value={newStudentData.full_name}
                  onChange={(e) => setNewStudentData({...newStudentData, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Telefon raqam</label>
                <input type="text" 
                  required
                  className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                  value={newStudentData.phone}
                  onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})}
                />
              </div>
              
              <div className="pt-2 border-t border-[var(--color-border-dark)] mt-2">
                <p className="text-sm font-semibold text-[var(--color-text-main)] mb-2">Referal ma'lumotlari (Ixtiyoriy)</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Kim taklif qildi?</label>
                    <select className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)] text-sm"
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
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Qaysi kursga taklif qildi?</label>
                        <select className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)] text-sm"
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
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Referal holati</label>
                        <select className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)] text-sm"
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
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[var(--color-text-muted)] bg-[#1e262c] rounded-lg hover:bg-[#2d3741] font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-[var(--color-brand-orange)] rounded-lg hover:bg-[#e06c17] font-medium">
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
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-[var(--color-border-dark)] flex justify-between items-center">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">O'quvchini tahrirlash</h3>
              <button onClick={() => setEditingStudent(null)} className="text-[#64748b] hover:bg-[#1e262c] p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Ism va Familiya</label>
                <input type="text" 
                  required
                  className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Telefon raqam</label>
                <input type="text" 
                  required
                  className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 text-[var(--color-text-muted)] bg-[#1e262c] rounded-lg hover:bg-[#2d3741] font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-[var(--color-brand-orange)] rounded-lg hover:bg-[#e06c17] font-medium">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* O'chirish (Delete) Modali */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-sm text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">{confirmDialog.title}</h3>
            <p className="text-[var(--color-text-muted)] mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDialog(null)} className="px-6 py-2 text-[var(--color-text-muted)] bg-[#1e262c] rounded-lg hover:bg-[#2d3741] font-medium w-full">
                Yo'q
              </button>
              <button onClick={confirmDialog.onConfirm} className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium w-full">
                {confirmDialog.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

