// src/pages/tasks/index.tsx (MyTasksPage)

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute'; 
import { API_BASE_URL } from '../utils/api';
import { Task } from '../types/task'; 
import Link from 'next/link';

const MyTasksPage: React.FC = () => {
  const { accessToken, user } = useAuth(); 
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
        setLoading(false);
        return; 
    }

    const fetchMyTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/tasks/mytasks`, { 
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch my tasks.');
        }

        const data = await response.json();
        
        // FIX PENTING: Validasi data agar tasks.map tidak error
        if (Array.isArray(data)) {
            setTasks(data);
        } else {
            console.error("API returned non-array data for my tasks:", data);
            throw new Error('Server returned invalid data format. Expected array of tasks.');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setTasks([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [accessToken]);

  if (loading) return <div className="p-4 text-center">Loading My Tasks...</div>;
  if (error) return <div className="p-4 text-danger text-center">Error: {error}</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">My Tasks</h1>
        
        <Link href="/tasks/new" className="btn btn-success mb-4">
            Create New Task
        </Link>

        {tasks.length === 0 ? (
          <div className="alert alert-info">You have no tasks. Create one!</div>
        ) : (
          <div className="list-group">
            {tasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span className={task.isCompleted ? 'text-decoration-line-through' : ''}>
                    {task.title}
                </span>
                <span className={`badge ${task.isCompleted ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {task.isCompleted ? 'Completed' : 'Pending'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default MyTasksPage;