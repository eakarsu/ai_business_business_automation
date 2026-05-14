'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="pl-60">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
