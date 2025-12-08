// pages/tasks/new.tsx

import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { Button, Form, Alert, Spinner, Col, Row } from 'react-bootstrap';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

interface NewTaskData {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    isPublic: boolean;
    dueDate: string;
    categoryId: string;
}

// Default ID sementara untuk memastikan form bisa disubmit jika fetch kategori gagal
const TEMP_CATEGORY_ID_PLACEHOLDER = 'temp-id-placeholder'; 

const NewTaskPage: React.FC = () => {
    const { user, accessToken, isAuthReady, logout } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState<NewTaskData>({
        title: '',
        description: '',
        priority: 'medium',
        isPublic: true,
        dueDate: '',
        categoryId: TEMP_CATEGORY_ID_PLACEHOLDER, 
    });

    const [file, setFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // --- LOGIKA FETCH CATEGORIES ---
    useEffect(() => {
        if (isAuthReady && !user) {
            router.push('/auth/login');
            return;
        }

        if (accessToken) {
            const fetchCategories = async () => {
                try {
                    const response = await axios.get<Category[]>(`${API_BASE_URL}/categories`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    
                    setCategories(response.data);
                    
                    if (response.data.length > 0) {
                        setFormData(prev => ({ 
                            ...prev, 
                            categoryId: response.data[0].id 
                        }));
                    } else {
                        // Tetap gunakan placeholder jika tidak ada kategori
                        setFormData(prev => ({ ...prev, categoryId: TEMP_CATEGORY_ID_PLACEHOLDER }));
                    }
                } catch (err) {
                    const axiosError = err as AxiosError<{ message: string }>;
                    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                         setError('Session expired. Please re-login to load categories.');
                    } else {
                         // Jangan block user sepenuhnya, biarkan mereka mencoba input manual jika perlu
                         console.error("Failed to fetch categories", axiosError);
                    }
                } 
            };
            fetchCategories();
        } 
    }, [isAuthReady, user, router, accessToken]); 

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    // --- HANDLE SUBMISSION (TASK CREATION) ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Validasi: Cegah submit jika categoryId masih placeholder
        if (formData.categoryId === TEMP_CATEGORY_ID_PLACEHOLDER && categories.length === 0) {
             setError("You must create a Category first before creating a Task.");
             return;
        }
        
        if (!accessToken || !formData.title) {
             setError("Title is required.");
             return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // FIX: Menggunakan JSON Object, bukan FormData
            const payload = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                isPublic: formData.isPublic, // Kirim boolean asli
                categoryId: formData.categoryId,
                // Konversi string date dari input HTML ke ISO string untuk backend
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
            };

            // Catatan: File 'file' diabaikan di sini karena endpoint POST /tasks 
            // backend saat ini hanya menerima JSON dan tidak memproses upload file.

            const response = await axios.post(`${API_BASE_URL}/tasks`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json', // Pastikan header JSON
                },
            });

            setSuccess(`Task "${response.data.title}" created successfully!`);
            
            // Reset form state
            setFormData({ 
                title: '', 
                description: '', 
                priority: 'medium', 
                isPublic: true, 
                dueDate: '', 
                categoryId: categories.length > 0 ? categories[0].id : TEMP_CATEGORY_ID_PLACEHOLDER 
            });
            setFile(null); // Reset file input UI

        } catch (err) {
            const axiosError = err as AxiosError<{ message: string | string[] }>;
            
             if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                 logout();
                 router.push('/auth/login');
                 setError('Session expired. Please login again.');
            } else {
                 const msg = axiosError.response?.data?.message;
                 // Gabungkan pesan error jika berupa array (dari class-validator)
                 const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to create task.');
                 setError(displayMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthReady) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Authenticating...</div>;
    }

    if (!user) {
        return <div className="text-center mt-5">Redirecting to login...</div>;
    }

    return (
        <div className="container mt-4">
            <h1 className="mb-4 text-success">Create New Task</h1>
            
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
                
                <Row>
                    <Form.Group as={Col} className="mb-3" controlId="title">
                        <Form.Label>Title *</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter task title"
                        />
                    </Form.Group>
                    
                    <Form.Group as={Col} md="4" className="mb-3" controlId="categoryId">
                        <Form.Label>Category *
                            <Link href="/categories/new" className="ms-2 small text-primary" style={{textDecoration: 'none'}}>
                                (+ New)
                            </Link>
                        </Form.Label>
                        {categories.length > 0 ? (
                            <Form.Select 
                                name="categoryId" 
                                value={formData.categoryId} 
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        ) : (
                            <Form.Control 
                                type="text"
                                value="No categories found. Please create one."
                                disabled
                                className="text-muted"
                            />
                        )}
                    </Form.Group>
                </Row>
                
                <Form.Group className="mb-3" controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Optional description"
                    />
                </Form.Group>

                <Row>
                    <Form.Group as={Col} md="4" className="mb-3" controlId="priority">
                        <Form.Label>Priority</Form.Label>
                        <Form.Select 
                            name="priority" 
                            value={formData.priority} 
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group as={Col} md="4" className="mb-3" controlId="dueDate">
                        <Form.Label>Due Date (Optional)</Form.Label>
                        <Form.Control
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Form.Group>
                </Row>

                <Form.Group className="mb-3" controlId="file">
                    <Form.Label>Attach File (Disabled temporarily)</Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        disabled={true} 
                        title="File upload is handled separately in this version"
                    />
                    <Form.Text className="text-muted">
                        *File upload is currently disabled in this form.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="isPublic">
                    <Form.Check
                        type="checkbox"
                        label="Make this Task Publicly Visible"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Form.Group>

                <Button 
                    variant="success" 
                    type="submit" 
                    disabled={loading || !formData.title || categories.length === 0}
                    className="w-100"
                >
                    {loading ? <Spinner animation="border" size="sm" /> : 'Create Task'}
                </Button>
            </Form>
        </div>
    );
};

export default NewTaskPage;