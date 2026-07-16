'use client';

import { useState, useEffect } from 'react';

interface Props {
  totalLessons: number;
  serverProgressMap: Record<string, boolean>;
}

export default function CourseProgress({ totalLessons, serverProgressMap }: Props) {
  const [completedCount, setCompletedCount] = useState(
    () => Object.values(serverProgressMap).filter(Boolean).length
  );

  useEffect(() => {
    setCompletedCount(Object.values(serverProgressMap).filter(Boolean).length);
  }, [serverProgressMap]);

  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-hover)' }}
          >
            <span className="text-sm">📈</span>
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Прогресс курса</span>
        </div>
        <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{percent}%</span>
      </div>
      
      <div className="progress-bar mb-2">
        <div style={{ width: `${percent}%` }} />
      </div>
      
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {completedCount} из {totalLessons} уроков пройдено
      </p>
    </div>
  );
}
