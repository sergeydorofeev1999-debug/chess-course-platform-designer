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
    <div className="collectible-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2E6B7A]/10 flex items-center justify-center">
            <span className="text-sm">📈</span>
          </div>
          <span className="font-bold text-[#1A1816]">Прогресс курса</span>
        </div>
        <span className="font-bold text-[#2E6B7A] text-lg">{percent}%</span>
      </div>
      
      <div className="progress-premium mb-2">
        <div style={{ width: `${percent}%` }} />
      </div>
      
      <p className="text-xs text-[#9E9892]">{completedCount} из {totalLessons} уроков пройдено</p>
    </div>
  );
}
