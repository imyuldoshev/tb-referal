import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', price: '' });
  
  // Modals state
  const [editingCourse, setEditingCourse] = useState(null); // Agar null bo'lmasa, Edit modal ochiladi
  const [deletingId, setDeletingId] = useState(null); // Agar null bo'lmasa, Delete modal ochiladi

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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
    } catch (err) {
      alert("Xatolik: " + err.message);
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
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/courses/${deletingId}`);
      setDeletingId(null);
      fetchCourses();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kurslar</h2>
          <p className="text-gray-500">Barcha mavjud kurslarni boshqarish</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Yangi Kurs Qo'shish
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleAddCourse} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kurs nomi</label>
              <input 
                type="text" 
                required
                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Narxi (so'm)</label>
              <input 
                type="number" 
                required
                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                value={newCourse.price}
                onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
              />
            </div>
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 h-[42px]">
              Saqlash
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl mb-4">
              {course.title.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
            <p className="text-2xl font-bold text-blue-600">
              {course.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">so'm</span>
            </p>
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setEditingCourse(course)} 
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Tahrirlash"
              >
                <Edit2 size={18}/>
              </button>
              <button 
                onClick={() => setDeletingId(course.id)} 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="O'chirish"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Hali hech qanday kurs qo'shilmagan
          </div>
        )}
      </div>

      {/* Tahrirlash (Edit) Modali */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Kursni tahrirlash</h3>
              <button onClick={() => setEditingCourse(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurs nomi</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Narxi (so'm)</label>
                <input 
                  type="number" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={editingCourse.price}
                  onChange={(e) => setEditingCourse({...editingCourse, price: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
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
            <p className="text-gray-500 mb-6">Siz bu kursni butunlay o'chirib tashlamoqchisiz. Bu amalni orqaga qaytarib bo'lmaydi.</p>
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
