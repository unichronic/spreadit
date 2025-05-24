"use client"; // This is a Client Component

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // For App Router navigation

interface AuthContextType {
  token: string | null;
  userEmail: string | null; // Or a full user object
  isAuthenticated: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial token check
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage on initial load
    const storedToken = localStorage.getItem('authToken');
    const storedEmail = localStorage.getItem('userEmail');
    console.log('AuthContext: Checking localStorage on mount');
    console.log('Stored token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'null');
    console.log('Stored email:', storedEmail);
    
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
      console.log('AuthContext: Token and email loaded from localStorage');
    } else {
      console.log('AuthContext: No valid token/email found in localStorage');
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, email: string) => {
    console.log('AuthContext: Login called with token:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
    console.log('AuthContext: Login called with email:', email);
    
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userEmail', email);
    
    console.log('AuthContext: Token and email saved to localStorage');
  };

  const logout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    router.push('/login'); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ token, userEmail, isAuthenticated: !!token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};