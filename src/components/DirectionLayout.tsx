'use client';

import { useEffect } from 'react';
import DirectionSwitcher from './DirectionSwitcher';

export default function DirectionLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('chess-direction') as 'a' | 'b' | 'c' | 'd' | null;
    if (saved && ['a','b','c','d'].includes(saved)) {
      document.documentElement.setAttribute('data-direction', saved);
    }
  }, []);

  return (
    <>
      {children}
      <DirectionSwitcher />
    </>
  );
}
