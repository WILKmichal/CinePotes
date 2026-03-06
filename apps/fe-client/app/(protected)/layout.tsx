'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * ProtectedLayout Component
 * Provides client-side authentication protection for routes
 * Checks for access token in sessionStorage and redirects to home if not present
 * 
 * Usage: Wrap protected routes with this component
 * Example: Move lobby, selection, classement, profile, mes-listes into (protected) folder
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has access token in sessionStorage
    const token = sessionStorage.getItem('access_token');
    const isGuest = sessionStorage.getItem('is_guest') === 'true';

    if (!token && !isGuest) {
      // No authentication found, redirect to home
      router.replace('/');
    } else {
      // User is authenticated or guest, allow access
      setIsAuthenticated(true);
    }
  }, [router]);

  // Show nothing while checking authentication (prevent flash of protected content)
  if (isAuthenticated === null) {
    return null;
  }

  return <>{children}</>;
}
