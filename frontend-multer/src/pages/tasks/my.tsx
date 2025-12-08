// pages/tasks/my.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { Task } from '../../types/task';
import { Button, Card, Col, Row, Spinner, Alert } from 'react-bootstrap';

// Definisikan tipe untuk respons paginasi
interface PaginatedTasksResponse {
    data: Task[];
    total: number;
    limit: number;
    page: number;
}

const MyTasksPage: React.FC = () => {
    const { user, accessToken, isAuthReady, logout } = useAuth();
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- LOGIKA PROTECTED ROUTE DAN REDIRECT ---
    useEffect(() => {
        // Jika Auth sudah siap TAPI user tidak ada, arahkan ke halaman login
        if (isAuthReady && !user) {
            router.push('/auth/login');
        }
    }, [isAuthReady, user, router]);


    // --- LOGIKA DATA FETCHING ---
    useEffect(() => {
        // HANYA fetch jika token sudah tersedia
        if (!accessToken) {
            // Jika isAuthReady true tapi token null, berarti user belum login, 
            // biarkan guard di atas yang me-redirect.
            if(isAuthReady) setLoading(false);
            return; 
        }

        const fetchMyTasks = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Menggunakan axios untuk kemudahan error handling dan header
                const response = await axios.get<PaginatedTasksResponse>(`${API_BASE_URL}/tasks`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`, // Wajib menyertakan token
                        'Content-Type': 'application/json',
                    },
                });

                const paginatedData = response.data;
                
                if (paginatedData && Array.isArray(paginatedData.data)) {
                    setTasks(paginatedData.data);
                } else {
                    throw new Error('Server returned invalid data format for tasks list.');
                }

            } catch (err) {
                const axiosError = err as AxiosError<{ message: string }>;
                if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                    // Jika token invalid atau expired
                    logout();
                    router.push('/auth/login');
                    setError('Session expired. Please log in again.');
                } else {
                    setError(axiosError.response?.data?.message || 'An unknown error occurred during task fetching.');
                }
                setTasks([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchMyTasks();
    }, [accessToken, isAuthReady, logout, router]);

    // --- GUARD DAN LOADING AWAL (Fix "Cannot read properties of null") ---
    // Jika Auth belum siap (sedang memuat LocalStorage), tampilkan Spinner
    if (!isAuthReady) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Authenticating...</div>;
    }

    // Jika Auth sudah siap TAPI user null, tampilkan pesan redirect (user akan dialihkan oleh useEffect)
    if (!user) {
         return <div className="text-center mt-5">Access Denied. Redirecting...</div>;
    }

    // --- RENDERING SETELAH AUTH SUKSES ---
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                {/* Akses user.username kini aman karena user dipastikan tidak null */}
                <h1 className="text-primary">My Tasks ({user.username})</h1> 
                <Link href="/tasks/new" passHref legacyBehavior>
                    <Button variant="success">
                        + Create New Task
                    </Button>
                </Link>
            </div>
            
            {loading ? (
                <div className="text-center"><Spinner animation="border" /> Loading tasks...</div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : tasks.length === 0 ? (
                <Alert variant="info">You have no tasks yet. Create one now!</Alert>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {tasks.map((task) => (
                        <Col key={task.id}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <Card.Title className={task.isCompleted ? 'text-decoration-line-through text-muted' : ''}>
                                        {task.title}
                                    </Card.Title>
                                    <Card.Subtitle className={`mb-2 small ${task.isCompleted ? 'text-success' : 'text-warning'}`}>
                                        Status: {task.isCompleted ? 'Completed' : 'Pending'} | Priority: **{task.priority}**
                                    </Card.Subtitle>
                                    <Card.Text className="text-muted small">
                                        Due Date: {task.dueDate || 'N/A'}
                                    </Card.Text>
                                    {/* Link ke halaman edit yang telah Anda buat sebelumnya */}
                                    <Link href={`/tasks/${task.id}/edit`} passHref legacyBehavior>
                                        <Button variant="outline-primary" size="sm" className="me-2">Edit/View</Button>
                                    </Link>
                                </Card.Body>
                                {task.filePath && (
                                    <Card.Footer className="bg-light">
                                        <small className="text-info">
                                            Attachment: {task.filePath.split('/').pop()}
                                        </small>
                                    </Card.Footer>
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default MyTasksPage;