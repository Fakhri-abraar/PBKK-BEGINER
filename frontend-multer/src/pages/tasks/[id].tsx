// src/pages/tasks/[id]/index.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Task } from '../../types/task'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { API_BASE_URL } from '../../utils/api';
import Link from 'next/link';
// FIX: Pastikan ProtectedRoute di-import
import ProtectedRoute from '../../components/ProtectedRoute'; 

// FIX: Ganti nama fungsi dari PostDetails ke TaskDetailPage
const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  // FIX: Destructuring menggunakan accessToken dan user, BUKAN token
  const { accessToken, user } = useAuth(); 
  const [task, setTask] = useState<Task | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Gunakan id dan accessToken
    if (!id || !accessToken) return; 

    const fetchTask = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // FIX: Ganti endpoint /posts menjadi /tasks
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch task. Status: ${response.status}`);
        }

        const data: Task = await response.json(); 
        setTask(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, accessToken]); 

  const handleDelete = async () => {
    if (!task || !window.confirm(`Are you sure you want to delete task: ${task.title}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to delete task. Status: ${response.status}`);
        }

        alert('Task deleted successfully!');
        router.push('/tasks'); 
    } catch (err) {
        alert(`Deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Delete error:', err);
    }
  };

  // FIX: Menghilangkan error Type 'boolean | null | undefined' is not assignable to type 'boolean'.
  // Kita memastikan user ada dan task ada sebelum membandingkan.
  // Asumsi: task.author.username adalah string. user.username juga string.
  const isOwner = !!user && !!task && task.author.username === user.username; 
  
  if (loading) return <div className="p-8">Loading task details...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!task) return <div className="p-8">Task data could not be loaded.</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <Link href="/tasks" className="text-blue-600 hover:underline mb-4 block">
            ← Back to My Tasks
        </Link>
        <h1 className="text-4xl font-extrabold mb-4">{task.title}</h1>
        
        {/* ... (Sisa tampilan detail task) ... */}
        {isOwner && (
          <div className="mt-8 space-x-4">
            <button
              onClick={() => router.push(`/tasks/${task.id}/edit`)}
              className="btn btn-warning me-2"
            >
              Edit Task
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              Delete Task
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default TaskDetailPage;