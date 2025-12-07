// src/pages/tasks/[id]/index.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Task } from '../../../types/task'; 
import { useAuth } from '../../../contexts/AuthContext'; 
import { API_BASE_URL } from '../../../utils/api';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute'; 

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  // FIX: Menggunakan accessToken dan user
  const { accessToken, user } = useAuth(); 
  const [task, setTask] = useState<Task | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Cek Array.isArray(id) karena Next.js query bisa berupa string[]
    if (!id || !accessToken || Array.isArray(id)) return; 

    const fetchTask = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // FIX: Endpoint /tasks
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
    }
  };

  // FIX: Menangani null/undefined untuk isOwner
  const isOwner = !!user && !!task && task.author.username === user.username; 
  
  if (loading) return <div className="p-4 text-center">Loading task details...</div>;
  if (error) return <div className="p-4 text-danger text-center">Error: {error}</div>;
  if (!task) return <div className="p-4 text-center">Task data could not be loaded.</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <Link href="/tasks" className="text-primary hover:underline mb-4 d-inline-block">
            ← Back to My Tasks
        </Link>
        <h1 className="text-4xl font-extrabold mb-4">{task.title}</h1>
        
        <div className="mb-4 p-3 border rounded bg-light">
            <p><strong>Status:</strong> <span className={`fw-bold ${task.isCompleted ? 'text-success' : 'text-warning'}`}>{task.isCompleted ? 'COMPLETED' : 'PENDING'}</span></p>
            <p><strong>Priority:</strong> <span className={`fw-bold ${task.priority === 'high' ? 'text-danger' : task.priority === 'medium' ? 'text-orange' : 'text-info'}`}>{task.priority.toUpperCase()}</span></p>
            <p><strong>Category:</strong> {task.category.name}</p>
            <p><strong>Created By:</strong> {task.author.username}</p>
            <p><strong>Public:</strong> {task.isPublic ? 'Yes' : 'No'}</p>
            {task.dueDate && <p><strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>}
            {task.description && <p className="mt-3"><strong>Description:</strong> {task.description}</p>}
        </div>

        {task.filePath && (
            <div className="mb-4">
                <strong>Attachment:</strong> <a href={`${API_BASE_URL}/${task.filePath}`} target="_blank" rel="noopener noreferrer" className="text-primary">Download File</a>
            </div>
        )}

        {/* Action Buttons (Only for Owner) */}
        {isOwner && (
          <div className="mt-4 space-x-2">
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