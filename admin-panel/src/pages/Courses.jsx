import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', price: '' });

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

  const handleEditClick = (course) => {
    setEditingId(course.id);
    setEditForm({ title: course.title, price: course.price });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.patch(`/courses/${id}`, {
        title: editForm.title,
        price: parseInt(editForm.price)
      });
      setEditingId(null);
      fetchCourses();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham ushbu kursni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
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
            {editingId === course.id ? (
              <div className="space-y-4">
                <input 
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2"
                />
                <input 
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2"
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => handleSaveEdit(course.id)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Check size={20}/></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded"><X size={20}/></button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl mb-4">
                  {course.title.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {course.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">so'm</span>
                </p>
                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => handleEditClick(course)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={18}/></button>
                  <button onClick={() => handleDelete(course.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={18}/></button>
                </div>
              </>
            )}
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Hali hech qanday kurs qo'shilmagan
          </div>
        )}
      </div>
    </div>
  );
}
