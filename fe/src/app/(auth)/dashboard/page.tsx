"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, userEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard'); 
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    
    return <p className="text-center mt-8">Loading dashboard...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-xl">Welcome, {userEmail || 'User'}!</p>
      <p className="mt-4">This is your protected dashboard area.</p>
      {/* Add your dashboard content here */}
    </div>
  );
}