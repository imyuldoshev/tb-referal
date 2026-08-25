import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', price: '' });

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
      await api.post('/courses', newCourse);
      setNewCourse({ title: '', price: '' });
      setShowModal(false);
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
          <p className="text-gray-500">Barcha o'quv kurslari va ularning narxlari</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Yangi kurs
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-medium text-gray-600">ID</th>
              <th className="p-4 font-medium text-gray-600">Kurs nomi</th>
              <th className="p-4 font-medium text-gray-600">Narxi</th>
              <th className="p-4 font-medium text-gray-600">Sana</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">Kurslar mavjud emas</td></tr>
            ) : (
              courses.map((course, idx) => (
                <tr key={course.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{idx + 1}</td>
                  <td className="p-4 font-medium">{course.title}</td>
                  <td className="p-4 text-green-600 font-medium">{course.price.toLocaleString()} so'm</td>
                  <td className="p-4 text-gray-500">{new Date(course.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Yangi kurs qo'shish</h3>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kurs nomi</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Narxi (so'm)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >Bekor qilish</button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
