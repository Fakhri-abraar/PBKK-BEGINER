// src/pages/auth/register.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { API_BASE_URL } from '../../utils/api'; 

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        alert('Registration successful! You can now log in.');
        router.push('/auth/login');

    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Registration error: ${message}. Pastikan server backend berjalan.`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4" style={{ maxWidth: '400px' }}>
      <h1 className="text-3xl font-bold mb-4 text-center">Register</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <div className="form-text">Password minimal 6 karakter.</div>
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-3 text-center">
        Sudah punya akun? <Link href="/auth/login" className="text-primary">Login di sini</Link>
      </p>
    </div>
  );
};

export default RegisterPage;