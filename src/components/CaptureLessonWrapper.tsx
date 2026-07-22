'use client';

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const CaptureBoard = dynamic(() => import('./CaptureBoard'), { ssr: false });

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
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');

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
    setPhase('success');
  }, [onLevelComplete]);

  const handleAllComplete = useCallback(() => {
    onAllComplete?.();
  }, [onAllComplete]);

  const handleFail = useCallback(() => {
    setPhase('fail');
  }, []);

  const resetLevel = useCallback(() => {
    setPhase('playing');
    setShowHint(false);
  }, []);

  const goToLevel = useCallback((idx: number) => {
    if (idx < 0 || idx >= levels.length) return;
    setCurrentLevel(idx);
    setPhase('playing');
    setShowHint(false);
  }, [levels.length]);

  const level = levels[currentLevel];
  const totalLevels = levels.length;
  const earned = levelStars[currentLevel];

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      {/* Header: avatar + speech bubble */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-[rgba(201,168,76,0.3)] shadow-sm">
            <img
              src="/images/instructor.png"
              alt="Инструктор"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex-1 bg-white rounded-xl rounded-tl-none px-4 py-3 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              {phase === 'playing' && (level?.instructions || lesson?.content || 'Выполните задание')}
              {phase === 'success' && 'Отлично! Задание выполнено!'}
              {phase === 'fail' && 'Подумай ещё раз...'}
            </p>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex justify-center w-full mb-4">
        <div className="relative inline-block rounded-sm">
          <CaptureBoard
            lessonId={lesson.id}
            levels={levels}
            successMessage="Молодец!"
            onAllComplete={handleAllComplete}
            onLevelComplete={handleLevelComplete}
            embedded={true}
            onFail={handleFail}
            externalCurrentLevel={currentLevel}
            onExternalLevelChange={setCurrentLevel}
            externalLevelStars={levelStars}
            onExternalStarsChange={setLevelStars}
          />
        </div>
      </div>

      {/* Hint */}
      {showHint && level?.hint && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <p className="text-sm text-amber-800">💡 {level.hint}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* Progress bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-secondary)]">
              Задание {currentLevel + 1} из {totalLevels}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(s => (
                <img
                  key={s}
                  src="/images/learn/star.png"
                  alt=""
                  className="w-4 h-4"
                  style={{
                    filter: earned != null && s <= earned
                      ? 'brightness(1.2) drop-shadow(0 0 1px rgba(255,255,255,0.6))'
                      : 'grayscale(100%) brightness(0.4)',
                  }}
                  draggable={false}
                />
              ))}
            </div>
          </div>
          <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${((currentLevel + 1) / totalLevels) * 100}%` }}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHint(prev => !prev)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-white border border-[rgba(201,168,76,0.3)] text-[var(--text-primary)] hover:bg-[rgba(201,168,76,0.08)] active:bg-[rgba(201,168,76,0.15)]"
          >
            <Lightbulb size={18} className="text-[var(--accent)]" />
            Подсказка
          </button>
          <button
            onClick={resetLevel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-white border border-[rgba(201,168,76,0.3)] text-[var(--text-primary)] hover:bg-[rgba(201,168,76,0.08)] active:bg-[rgba(201,168,76,0.15)]"
          >
            <RotateCcw size={18} className="text-[var(--accent)]" />
            Заново
          </button>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToLevel(currentLevel - 1)}
            disabled={currentLevel === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} />
            Назад
          </button>

          {/* Level pills */}
          <div className="flex gap-1">
            {levels.map((_l: any, i: number) => {
              const isCurrent = i === currentLevel;
              const isDone = levelStars[i] != null;
              return (
                <button
                  key={i}
                  onClick={() => goToLevel(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[var(--accent)] text-white shadow-md'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToLevel(currentLevel + 1)}
            disabled={currentLevel >= totalLevels - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Вперёд
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
