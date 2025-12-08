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

// Default ID sementara untuk memastikan form bisa disubmit jika fetch kategori gagal (401)
const TEMP_CATEGORY_ID_PLACEHOLDER = 'temp-id-ganti-dengan-uuid'; 

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
                // Tidak menggunakan loading state penuh agar form tetap muncul
                try {
                    const response = await axios.get<Category[]>(`${API_BASE_URL}/categories`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`, // Pastikan formatnya benar
                        },
                    });
                    
                    setCategories(response.data);
                    
                    if (response.data.length > 0) {
                        setFormData(prev => ({ 
                            ...prev, 
                            categoryId: response.data[0].id 
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, categoryId: TEMP_CATEGORY_ID_PLACEHOLDER }));
                        setError('Warning: No categories found. Using temporary ID. Please create one.');
                    }
                } catch (err) {
                    const axiosError = err as AxiosError<{ message: string }>;
                    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                         // Jika fetch gagal 401/403, tampilkan peringatan
                         setError('CRITICAL: Cannot load categories (401/403). JWT Validation is failing on the backend.');
                    } else {
                         setError(`Warning: Failed to load categories: ${axiosError.response?.data?.message || axiosError.message}`);
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
        
        // PENTING: Mencegah submit jika masih menggunakan placeholder ID
        if (formData.categoryId === TEMP_CATEGORY_ID_PLACEHOLDER && categories.length === 0) {
             setError("Category ID harus diisi dengan ID valid dari database Anda untuk menguji Task Creation.");
             return;
        }
        if (!accessToken || !formData.title) {
             setError("Title and Category ID are required.");
             return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = new FormData();
            
            // Mengubah tipe boolean ke string untuk FormData
            payload.append('title', formData.title);
            payload.append('description', formData.description);
            payload.append('priority', formData.priority);
            payload.append('isPublic', String(formData.isPublic)); 
            payload.append('dueDate', formData.dueDate); 
            payload.append('categoryId', formData.categoryId); 

            if (file) {
                payload.append('file', file); 
            }

            // Panggilan POST /tasks
            const response = await axios.post(`${API_BASE_URL}/tasks`, payload, {
                headers: {
                    // PENTING: Memastikan token dikirim dengan format 'Bearer '
                    Authorization: `Bearer ${accessToken}`,
                    // Content-Type: 'multipart/form-data' TIDAK PERLU DITENTUKAN di sini
                    // Axios dan FormData akan menanganinya otomatis
                },
            });

            setSuccess(`Task created successfully! ID: ${response.data.id}`);
            
            // Reset form
            setFormData({ 
                title: '', 
                description: '', 
                priority: 'medium', 
                isPublic: true, 
                dueDate: '', 
                categoryId: categories.length > 0 ? categories[0].id : TEMP_CATEGORY_ID_PLACEHOLDER 
            });
            setFile(null);
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
             // Jika Create Task GAGAL karena 401/403 (TOKEN GAGAL)
             if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                 logout();
                 router.push('/auth/login');
                 setError('CRITICAL ERROR: TOKEN GAGAL VALIDASI (401/403). Segera cek ulang JWT Secret Key di backend NestJS Anda.');
            } else {
                 setError(axiosError.response?.data?.message || 'Failed to create task. Check network or server logs.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthReady) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Authenticating...</div>;
    }

    if (!user) {
        return <div className="text-center mt-5">Access Denied. Redirecting...</div>;
    }

    // --- RENDERING FORM ---
    return (
        <div className="container mt-4">
            <h1 className="mb-4 text-success">Create New Task ({user.username})</h1>
            
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm">
                
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
                        />
                    </Form.Group>
                    
                    <Form.Group as={Col} md="4" className="mb-3" controlId="categoryId">
                        <Form.Label>Category *
                            <Link href="/categories/new" className="ms-2 small text-primary">
                                (+ New Category)
                            </Link>
                        </Form.Label>
                        {categories.length > 0 ? (
                            // RENDER DROPDOWN JIKA KATEGORI BERHASIL DIMUAT
                            <Form.Select 
                                name="categoryId" 
                                value={formData.categoryId} 
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                <option value="" disabled>Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        ) : (
                            // RENDER INPUT TEKS JIKA GAGAL FETCH
                            <>
                            <Form.Control 
                                type="text"
                                name="categoryId"
                                placeholder="Enter a valid Category ID (e.g., UUID)"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                isInvalid={formData.categoryId === TEMP_CATEGORY_ID_PLACEHOLDER}
                            />
                            <Form.Text className="text-muted">
                                *ID Kategori harus valid dari database Anda.
                            </Form.Text>
                            </>
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
                    <Form.Label>Attach File (Optional)</Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    <Form.Text className="text-muted">Max file size depends on server limits.</Form.Text>
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
                    disabled={loading || !formData.title || formData.categoryId === TEMP_CATEGORY_ID_PLACEHOLDER}
                >
                    {loading ? <Spinner animation="border" size="sm" /> : 'Create Task'}
                </Button>
            </Form>
        </div>
    );
};

export default NewTaskPage;