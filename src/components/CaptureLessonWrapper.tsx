'use client';

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';

const CaptureBoard = dynamic(() => import('./CaptureBoard'), { ssr: false });

function MassiveStar({ filled }: { filled: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill={filled ? '#FFFFFF' : 'none'} stroke={filled ? 'none' : '#9CA3AF'} strokeWidth="2">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  );
}

interface Props {
  lesson: any;
  allLessons?: any[];
  courseId?: string;
  levels: any[];
  onAllComplete?: () => void;
  onLevelComplete?: (level: number, stars: number) => void;
}

export default function CaptureLessonWrapper({
  lesson,
  allLessons,
  courseId,
  levels,
  onAllComplete,
  onLevelComplete,
}: Props) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [hintArrows, setHintArrows] = useState<{ from: string; to: string }[]>([]);

  const savedKey = `lesson_capture_${lesson.id}`;

  // Load progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.levelStars) setLevelStars(data.levelStars);
        if (typeof data.currentLevel === 'number') setCurrentLevel(data.currentLevel);
      }
    } catch {}
  }, [savedKey]);

  // Save progress
  useEffect(() => {
    localStorage.setItem(savedKey, JSON.stringify({
      levelStars,
      currentLevel,
    }));
  }, [levelStars, currentLevel, savedKey]);

  const handleLevelComplete = useCallback((levelIndex: number, stars: number) => {
    setLevelStars(prev => ({ ...prev, [levelIndex]: stars }));
    onLevelComplete?.(levelIndex, stars);
  }, [onLevelComplete]);

  const handleAllComplete = useCallback(() => {
    onAllComplete?.();
  }, [onAllComplete]);

  const goToLevel = useCallback((idx: number) => {
    if (idx < 0 || idx >= levels.length) return;
    setCurrentLevel(idx);
    setShowHint(false);
    setHintArrows([]);
  }, [levels.length]);

  // Simple hint: find any white piece that can capture a target
  const computeHintArrow = useCallback(() => {
    const level = levels[currentLevel];
    if (!level) return [];
    const targets = level.stars || level.targets || [];
    if (targets.length === 0) return [];

    // For capture lessons, show arrow from white piece to first target
    // This is a simplified hint — just show any valid move toward target
    const fen = level.initialFen; // Use initial as fallback
    // In a real implementation we'd parse current position
    // For now, return empty to avoid errors, or simple logic
    return [];
  }, [levels, currentLevel]);

  const level = levels[currentLevel];
  const totalLevels = levels.length;
  const earned = levelStars[currentLevel];

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-4">
      {/* ── Header: avatar + speech bubble ── */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 flex-shrink-0">
          <img
            src="/coach-avatar.png"
            alt="Тренер"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
        <div className="flex-1 bg-white rounded-xl rounded-tl-none px-4 py-3 shadow-sm border border-[rgba(92,64,51,0.06)]">
          <p className="text-sm text-[var(--text-primary)] leading-snug">
            {level?.instructions || lesson?.content || 'Выполните задание'}
          </p>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex justify-center w-full">
        <div className="relative inline-block rounded-sm">
          <CaptureBoard
            lessonId={lesson.id}
            levels={levels}
            successMessage="Молодец!"
            onAllComplete={handleAllComplete}
            onLevelComplete={handleLevelComplete}
            embedded={true}
            externalCurrentLevel={currentLevel}
            onExternalLevelChange={setCurrentLevel}
            externalLevelStars={levelStars}
            onExternalStarsChange={setLevelStars}
            hintArrows={hintArrows}
            onAnyMove={() => setHintArrows([])}
          />
        </div>
      </div>

      {/* ── Level Pills (like lesson 5) ── */}
      <div className="w-full">
        <div className="w-full flex items-stretch gap-[1px]">
          {levels.map((_l: any, i: number) => {
            const earnedI = levelStars[i];
            const starCountI = typeof earnedI === 'number' ? earnedI : (earnedI ? 1 : 0);
            const isCurrent = i === currentLevel;
            const isDone = earnedI != null;
            const isFuture = !isCurrent && !isDone && i > currentLevel;
            return (
              <button
                key={i}
                onClick={() => {
                  if (isCurrent) return;
                  goToLevel(i);
                }}
                disabled={isCurrent}
                className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
                  isCurrent
                    ? 'bg-[#2C241B] shadow-md'
                    : isDone
                      ? 'bg-[#C9A84C]'
                      : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                title={isDone ? `Упражнение ${i + 1} — пройдено` : `Упражнение ${i + 1}`}
              >
                {isDone && starCountI > 0 ? (
                  starCountI === 3 ? (
                    <>
                      <div className="flex">
                        <MassiveStar filled={true} />
                      </div>
                      <div className="flex gap-[1px]">
                        <MassiveStar filled={true} />
                        <MassiveStar filled={true} />
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: starCountI }, (_, s) => (
                        <MassiveStar key={s} filled={true} />
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${
                    isCurrent ? 'text-white' : 'text-[#9CA3AF]'
                  }`}>{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Progress: "Задание X из Y" + bar ── */}
      <div className="w-full flex flex-col gap-2">
        <span className="text-xs font-bold text-[var(--text-primary)]">
          Задание {currentLevel + 1} из {totalLevels}
        </span>
        <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
            style={{ width: `${((currentLevel + 1) / totalLevels) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Hint ── */}
      {showHint && level?.hint && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <p className="text-sm text-amber-800">💡 {level.hint}</p>
        </div>
      )}

      {/* ── Buttons: Hint + Reset ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (hintArrows.length === 0) {
              const arrows = computeHintArrow();
              setHintArrows(arrows);
              setShowHint(true);
            } else {
              setHintArrows([]);
              setShowHint(false);
            }
          }}
          className="flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-all duration-200 border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]"
        >
          <Lightbulb size={14} /> Подсказка
        </button>
        <button
          onClick={() => goToLevel(currentLevel)}
          className="flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-all duration-200 border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

    </div>
  );
}
