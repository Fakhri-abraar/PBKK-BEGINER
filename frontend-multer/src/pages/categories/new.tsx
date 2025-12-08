// pages/categories/new.tsx

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api'; 
import Link from 'next/link';

const NewCategoryPage: React.FC = () => {
    const { user, isAuthReady, accessToken, logout } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthReady && !user) {
            router.push('/auth/login');
        }
    }, [isAuthReady, user, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!accessToken) {
             setError("Authentication token missing. Please re-login.");
             logout();
             return;
        }

        if (!name.trim()) {
            setError("Category name cannot be empty.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Panggilan POST /categories
            const response = await axios.post(`${API_BASE_URL}/categories`, { name }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`, 
                    'Content-Type': 'application/json',
                },
            });

            setSuccess(`Category "${response.data.name}" created successfully! Redirecting...`);
            
            // Redirect ke halaman New Task setelah sukses (memuat ulang kategori)
            setTimeout(() => {
                router.push('/tasks/new');
            }, 1000); 

        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            
            if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                 // Ini yang menangkap error 401 dari backend
                 logout(); 
                 router.push('/auth/login'); 
                 setError('Session expired. Please log in again. (Backend rejected the token)');
            } else {
                 const errorMessage = axiosError.response?.data?.message || 'Failed to create category.';
                 setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };
    
    if (!isAuthReady) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Authenticating...</div>;
    }

    if (!user) {
        return <div className="text-center mt-5">Redirecting...</div>;
    }

    return (
        <div className="row justify-content-center mt-5">
            <div className="col-md-6">
                <h2 className="text-success mb-4">Create New Category</h2>
                {success && <Alert variant="success">{success}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm">
                    <Form.Group className="mb-3" controlId="categoryName">
                        <Form.Label>Category Name *</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., Work, Personal, Shopping"
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                            required
                            disabled={loading}
                        />
                    </Form.Group>

                    <Button 
                        variant="success" 
                        type="submit" 
                        disabled={loading || !name.trim()} 
                        className="w-100"
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : 'Create Category'}
                    </Button>
                </Form>
                
                <div className="mt-3 text-center">
                    <Link href="/tasks/new" className="text-primary small">
                        ← Back to New Task
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NewCategoryPage;