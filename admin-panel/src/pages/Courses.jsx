import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { Plus, Edit2, Trash2, X, AlertTriangle , Loader2} from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', price: '' });
  
  // Modals state
  const [editingCourse, setEditingCourse] = useState(null); // Agar null bo'lmasa, Edit modal ochiladi
  const [deletingId, setDeletingId] = useState(null); // Agar null bo'lmasa, Delete modal ochiladi

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally { setIsLoading(false); } };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', {
        title: newCourse.title,
        price: parseInt(newCourse.price)
      });
      setNewCourse({ title: '', price: '' });
      setShowAddForm(false);
      fetchCourses();
      toast.success("Kurs muvaffaqiyatli qo'shildi!");
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } 
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/courses/${editingCourse.id}`, {
        title: editingCourse.title,
        price: parseInt(editingCourse.price)
      });
      setEditingCourse(null);
      fetchCourses();
      toast.success("Kurs muvaffaqiyatli yangilandi!");
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/courses/${deletingId}`);
      setDeletingId(null);
      fetchCourses();
      toast.success("Kurs o'chirildi!");
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  return (
    <div className="space-y-4 min-[446px]:space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl min-[446px]:text-2xl font-bold text-[var(--color-text-main)]">Kurslar</h2>
          <p className="text-xs min-[446px]:text-sm text-[var(--color-text-muted)]">Barcha mavjud kurslarni boshqarish</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[var(--color-brand-orange)] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#e06c17] transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Yangi Kurs Qo'shish
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[var(--color-panel-dark)] p-4 min-[446px]:p-6 rounded-xl shadow-sm border border-[var(--color-border-dark)]">
          <form onSubmit={handleAddCourse} className="flex flex-col min-[446px]:flex-row gap-4 items-start min-[446px]:items-end">
            <div className="w-full min-[446px]:flex-1">
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Kurs nomi</label>
              <input type="text" 
                required
                className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
              />
            </div>
            <div className="w-full min-[446px]:flex-1">
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Narxi (so'm)</label>
              <input type="number" 
                required
                className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                value={newCourse.price}
                onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full min-[446px]:w-auto bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 h-[42px]">
              Saqlash
            </button>
          </form>
        </div>
      )}

      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-panel-dark)] rounded-xl border border-[var(--color-border-dark)] animate-in fade-in duration-300">
          <Loader2 className="animate-spin text-[var(--color-brand-orange)] mb-4" size={32} />
          <p className="text-[var(--color-text-muted)] font-medium">Kurslar yuklanmoqda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-[446px]:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {courses.map(course => (
          <div key={course.id} className="bg-[var(--color-panel-dark)] p-4 min-[446px]:p-6 rounded-xl shadow-sm border border-[var(--color-border-dark)] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 min-[446px]:w-12 min-[446px]:h-12 bg-[var(--color-brand-orange)]/20 rounded-lg flex items-center justify-center text-[var(--color-brand-orange)] font-bold text-lg min-[446px]:text-xl mb-3 min-[446px]:mb-4">
              {course.title.charAt(0)}
            </div>
            <h3 className="text-base min-[446px]:text-lg font-bold text-[var(--color-text-main)] mb-1">{course.title}</h3>
            <p className="text-xl min-[446px]:text-2xl font-bold text-[var(--color-brand-orange)]">
              {course.price.toLocaleString()} <span className="text-xs min-[446px]:text-sm font-normal text-[var(--color-text-muted)]">so'm</span>
            </p>
            <div className="flex gap-2 justify-end mt-3 min-[446px]:mt-4 pt-3 min-[446px]:pt-4 border-t border-[var(--color-border-dark)]">
              <button 
                onClick={() => setEditingCourse(course)} 
                className="p-2 text-[#64748b] hover:text-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/10 rounded transition-colors"
                title="Tahrirlash"
              >
                <Edit2 size={18}/>
              </button>
              <button 
                onClick={() => setDeletingId(course.id)} 
                className="p-2 text-[#64748b] hover:text-red-600 hover:bg-red-500/100/10 rounded transition-colors"
                title="O'chirish"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full p-8 text-center text-[var(--color-text-muted)] bg-[var(--color-panel-dark)] rounded-xl border border-dashed border-[var(--color-border-dark)]">
            Hali hech qanday kurs qo'shilmagan
          </div>
        )}
      </div>
      )}

      {/* Tahrirlash (Edit) Modali */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-[var(--color-border-dark)] flex justify-between items-center">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Kursni tahrirlash</h3>
              <button onClick={() => setEditingCourse(null)} className="text-[#64748b] hover:bg-[#1e262c] p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Kurs nomi</label>
                <input type="text" 
                  required
                  className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Narxi (so'm)</label>
                <input type="number" 
                  required
                  className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] w-full border border-[var(--color-border-dark)] rounded-lg p-2 outline-none focus:border-[var(--color-brand-orange)]"
                  value={editingCourse.price}
                  onChange={(e) => setEditingCourse({...editingCourse, price: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 text-[var(--color-text-muted)] bg-[#1e262c] rounded-lg hover:bg-[#2d3741] font-medium">
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
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel-dark)] rounded-xl shadow-lg w-full max-w-sm text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">Ishonchingiz komilmi?</h3>
            <p className="text-[var(--color-text-muted)] mb-6">Siz bu kursni butunlay o'chirib tashlamoqchisiz. Bu amalni orqaga qaytarib bo'lmaydi.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingId(null)} className="px-6 py-2 text-[var(--color-text-muted)] bg-[#1e262c] rounded-lg hover:bg-[#2d3741] font-medium w-full">
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
