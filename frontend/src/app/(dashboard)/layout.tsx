'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { FullPageLoading, ErrorBoundary, ToastProvider } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <FullPageLoading message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ToastProvider>
      <ErrorBoundary>
        <PageLayout>{children}</PageLayout>
      </ErrorBoundary>
    </ToastProvider>
  );
}
