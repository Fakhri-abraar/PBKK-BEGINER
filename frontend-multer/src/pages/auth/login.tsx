// pages/auth/login.tsx

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import Link from 'next/link';

// Pastikan path ini benar
import { useAuth } from '../../contexts/AuthContext'; 
import { API_BASE_URL } from '../../utils/api'; 

const LoginPage: React.FC = () => {
    const { login, user, isAuthReady } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Jika user sudah login dan AuthContext sudah siap, redirect ke My Tasks
    useEffect(() => {
        if (isAuthReady && user) {
            router.push('/tasks/my');
        }
    }, [isAuthReady, user, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username,
                password,
            });

            // Asumsi response.data mengandung: { accessToken, username, email }
            const { accessToken, username: responseUsername, email } = response.data;
            
            // Simpan status login ke context (dan LocalStorage melalui AuthContext)
            login(accessToken, { username: responseUsername, email });

            // FIX KRITIS: Redirect ke halaman yang benar
            router.push('/tasks/my'); 

        } catch (err) {
            const axiosError = err as AxiosError;
            // Tampilkan pesan error dari server jika ada
            const errorMessage = axiosError.response?.data?.message || 'Login failed. Check your credentials.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    // Tampilkan spinner jika AuthContext sedang memuat data dari LocalStorage
    if (!isAuthReady) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Initializing App...</div>;
    }

    // Jika user sudah login (sudah ter-*redirect* oleh useEffect), tidak perlu render form
    if (user) {
        return <div className="text-center mt-5">You are already logged in.</div>;
    }

    return (
        <div className="row justify-content-center mt-5">
            <div className="col-md-5">
                <div className="card shadow-lg">
                    <div className="card-header bg-primary text-white text-center">
                        <h2>Login to Task Manager</h2>
                    </div>
                    <div className="card-body p-4">
                        {error && <Alert variant="danger">{error}</Alert>}
                        
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="formBasicUsername">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" disabled={loading || !username || !password} className="w-100">
                                {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
                            </Button>
                        </Form>
                    </div>
                    <div className="card-footer text-center">
                        Don't have an account?{' '}
                        <Link href="/auth/register" passHref legacyBehavior>
                            <a className="text-primary">Register here</a>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;