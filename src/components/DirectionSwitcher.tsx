'use client';

import { useState } from 'react';

type Direction = 'a' | 'b' | 'c' | 'd';

interface Props {
  onChange?: (dir: Direction) => void;
}

const BUTTONS: { key: Direction; label: string; accent: string }[] = [
  { key: 'a', label: 'A', accent: '#0071E3' },
  { key: 'b', label: 'B', accent: '#FF6B35' },
  { key: 'c', label: 'C', accent: '#B8956A' },
  { key: 'd', label: 'D', accent: '#00D4AA' },
];

export default function DirectionSwitcher({ onChange }: Props) {
  const [active, setActive] = useState<Direction>('a');

  const handleClick = (dir: Direction) => {
    setActive(dir);
    document.documentElement.setAttribute('data-direction', dir);
    localStorage.setItem('chess-direction', dir);
    onChange?.(dir);
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="flex gap-1 p-1.5 rounded-xl"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleClick(btn.key)}
            className="w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center"
            style={{
              background: active === btn.key ? btn.accent : 'transparent',
              color: active === btn.key ? '#fff' : 'var(--text-tertiary)',
              opacity: active === btn.key ? 1 : 0.6,
            }}
            title={btn.key === 'a' ? 'Apple Chess' : btn.key === 'b' ? 'Nintendo Chess' : btn.key === 'c' ? 'Luxury Chess' : 'Digital Chess'}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
