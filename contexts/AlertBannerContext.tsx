'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AlertBannerContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  alertCount: number;
  setAlertCount: (count: number) => void;
}

const AlertBannerContext = createContext<AlertBannerContextType | undefined>(undefined);

export function AlertBannerProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  return (
    <AlertBannerContext.Provider value={{
      isVisible,
      setIsVisible,
      alertCount,
      setAlertCount
    }}>
      {children}
    </AlertBannerContext.Provider>
  );
}

export function useAlertBanner() {
  const context = useContext(AlertBannerContext);
  if (context === undefined) {
    throw new Error('useAlertBanner must be used within an AlertBannerProvider');
  }
  return context;
}
