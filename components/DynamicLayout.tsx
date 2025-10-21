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
      className={`flex-1 overflow-auto p-2 sm:p-4 md:p-6 transition-all duration-200 ${
        isVisible ? 'pt-16 sm:pt-20' : 'pt-2 sm:pt-4'
      }`}
    >
      {children}
    </main>
  );
}
