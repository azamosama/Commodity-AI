'use client';

import React from 'react';
import { useAlertBanner } from '@/contexts/AlertBannerContext';

interface DynamicLayoutProps {
  children: React.ReactNode;
}

export function DynamicLayout({ children }: DynamicLayoutProps) {
  const { isVisible } = useAlertBanner();

  return (
    <main 
      className={`flex-1 overflow-auto p-4 sm:p-6 transition-all duration-200 ${
        isVisible ? 'pt-20' : 'pt-4'
      }`}
    >
      {children}
    </main>
  );
}
