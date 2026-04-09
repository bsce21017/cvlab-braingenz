'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { removeToken, type AuthUser } from '@/lib/auth';

interface AdminAuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, signOut: authSignOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const adminRoles = ['admin', 'service_role', 'super_admin'];

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }
    const hasAdmin = adminRoles.includes(user.role);
    setIsAdmin(hasAdmin);
    return hasAdmin;
  };

  const signOut = async () => {
    await authSignOut();
    setIsAdmin(false);
  };

  useEffect(() => {
    if (loading) return;

    if (user) {
      const hasAdmin = adminRoles.includes(user.role);
      setIsAdmin(hasAdmin);
      if (!hasAdmin) {
        setError(null);
      }
    } else {
      setIsAdmin(false);
    }
    setIsLoading(false);
  }, [user, loading]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        error,
        checkAdminStatus,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
