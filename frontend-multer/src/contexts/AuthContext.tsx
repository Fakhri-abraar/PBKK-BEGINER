// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
    username: string;
    email?: string; 
}

// FIX: Mendefinisikan AuthContextType yang BENAR
export interface AuthContextType {
    accessToken: string | null;
    user: User | null;
    isAuthReady: boolean; // State untuk kesiapan auth
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Kunci LocalStorage
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'userData';


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false); 

    // --- 1. MEMUAT DATA AWAL DARI LOCALSTORAGE ---
    useEffect(() => {
        const loadInitialAuth = () => {
            // Cek jika LocalStorage tersedia di browser
            if (typeof window !== 'undefined') {
                const storedToken = localStorage.getItem(TOKEN_KEY);
                const storedUser = localStorage.getItem(USER_KEY);
                
                if (storedToken && storedUser) {
                    try {
                        // Pastikan data user di-parse kembali dari JSON
                        const userData = JSON.parse(storedUser);
                        setAccessToken(storedToken);
                        setUser(userData);
                    } catch (e) {
                        // Handle error jika data corrupt
                        console.error("Failed to parse user data from storage:", e);
                        localStorage.removeItem(TOKEN_KEY);
                        localStorage.removeItem(USER_KEY);
                    }
                }
            }
            // Setelah selesai memuat (berhasil atau gagal), set isAuthReady ke true
            setIsAuthReady(true);
        };
        loadInitialAuth();
    }, []);

    // --- 2. FUNGSI LOGIN DENGAN PERSISTENCY ---
    const login = (token: string, userData: User) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
        }
        setAccessToken(token);
        setUser(userData);
    };

    // --- 3. FUNGSI LOGOUT DENGAN CLEARING STORAGE ---
    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
        setAccessToken(null);
        setUser(null);
    };
    
    const value: AuthContextType = {
        accessToken,
        user,
        isAuthReady,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};