// src/pages/tasks/[id]/edit.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { API_BASE_URL } from '../../../utils/api';
import { Task, UpdateTaskPayload, Priority } from '../../../types/task';
import { Category } from '../../../types/category';

const EditTaskPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskData, setTaskData] = useState<Task | null>(null);
  const [formData, setFormData] = useState<UpdateTaskPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Task Detail and Categories
  useEffect(() => {
    if (!id || !accessToken) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Task Detail
        const taskResponse = await fetch(`${API_BASE_URL}/tasks/${id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!taskResponse.ok) throw new Error('Failed to fetch task details.');
        const task: Task = await taskResponse.json();
        setTaskData(task);
        
        // Populate form data for initial state
        // FIX: dueDate sekarang valid dan di-format (menggunakan .toLocaleDateString() agar sesuai input type="date")
        setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            isCompleted: task.isCompleted,
            isPublic: task.isPublic,
            // Format tanggal ke YYYY-MM-DD untuk input HTML type="date"
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
            categoryId: task.categoryId
        });

        // Fetch Categories
        const catResponse = await fetch(`${API_BASE_URL}/categories`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!catResponse.ok) throw new Error('Failed to fetch categories');
        const catData = await catResponse.json();
        setCategories(catData);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, accessToken]);

  // FIX: Perbaikan untuk mengatasi redline 'checked'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const target = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: target.type === 'checkbox' ? target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id) return;

    setIsSubmitting(true);
    setError(null);
    
    // Konversi string kosong ke null untuk Description dan dueDate jika kosong
    const payload: UpdateTaskPayload = {
      ...formData,
      description: formData.description === '' ? null : formData.description,
      dueDate: formData.dueDate === '' ? null : formData.dueDate,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update task. Status: ${response.status}`);
      }

      alert('Task updated successfully!');
      router.push(`/tasks/${id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading task data...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!taskData) return <div className="p-8">Task data not available.</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Edit Task: {taskData.title}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ... (Title, Description, Category, Priority fields remain the same) ... */}
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium">Priority</label>
            <select
              name="priority"
              value={formData.priority || 'medium'}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* isCompleted */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isCompleted"
              checked={!!formData.isCompleted}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Is Completed</label>
          </div>

          {/* isPublic */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={!!formData.isPublic}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Is Public</label>
          </div>

          {error && <p className="text-red-500">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default EditTaskPage;