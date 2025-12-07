// src/components/ProtectedRoute.tsx

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext'; 

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthReady } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    // Jika Auth siap dan user tidak ada, redirect ke login
    if (isAuthReady && !user) {
      router.push('/auth/login');
    }
  }, [user, isAuthReady, router]);

  // Tampilkan loading screen sampai otentikasi siap
  if (!isAuthReady || !user) {
    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
  }

  // Jika otentikasi siap dan user ada, tampilkan konten
  return <>{children}</>;
};

export default ProtectedRoute;