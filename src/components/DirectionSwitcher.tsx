'use client';

import { useState, useEffect } from 'react';

type Direction = 'a' | 'b' | 'c' | 'd';

const DIRECTIONS: { key: Direction; label: string; title: string; colorClass: string }[] = [
  { key: 'a', label: 'A', title: 'Apple Chess — calm, precision, air', colorClass: 'switcher-a' },
  { key: 'b', label: 'B', title: 'Nintendo Chess — joy, warmth, delight', colorClass: 'switcher-b' },
  { key: 'c', label: 'C', title: 'Luxury Chess — craft, wood, brass', colorClass: 'switcher-c' },
  { key: 'd', label: 'D', title: 'Digital Chess 2026 — responsive, alive', colorClass: 'switcher-d' },
];

export default function DirectionSwitcher() {
  const [direction, setDirection] = useState<Direction>('a');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('chess-direction') as Direction) : null;
    const initial: Direction = saved && ['a','b','c','d'].includes(saved) ? saved : 'a';
    setDirection(initial);
    document.documentElement.setAttribute('data-direction', initial);
  }, []);

  const handleSwitch = (dir: Direction) => {
    setDirection(dir);
    document.documentElement.setAttribute('data-direction', dir);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chess-direction', dir);
    }
    setIsExpanded(false);
  };

  const current = DIRECTIONS.find((d) => d.key === direction);

  return (
    <div className="direction-switcher">
      {isExpanded && (
        <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.key}
              onClick={() => handleSwitch(dir.key)}
              className={`${dir.colorClass} ${direction === dir.key ? 'active' : ''}`}
              title={dir.title}
            >
              {dir.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${current?.colorClass || 'switcher-a'} active`}
        title={`Текущее направление: ${current?.title || 'Apple Chess'}`}
      >
        {isExpanded ? '✕' : current?.label}
      </button>
    </div>
  );
}
