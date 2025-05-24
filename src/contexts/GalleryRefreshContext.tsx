'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

type GalleryRefreshContextType = {
  refreshTrigger: number;
  triggerRefresh: () => void;
};

const GalleryRefreshContext = createContext<GalleryRefreshContextType | undefined>(undefined);

export function GalleryRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    console.log('🔄 Gallery refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <GalleryRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </GalleryRefreshContext.Provider>
  );
}

export function useGalleryRefresh() {
  const context = useContext(GalleryRefreshContext);

  if (context === undefined) {
    throw new Error('useGalleryRefresh must be used within a GalleryRefreshProvider');
  }

  return context;
}
