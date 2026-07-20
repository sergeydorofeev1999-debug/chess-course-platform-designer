'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration_minutes: number;
  levelsCount: number;
}

interface Props {
  lessons: Lesson[];
  progressMap: Record<string, boolean>;
  courseId: string;
  pieceCodes?: string[];
  descriptions?: string[];
}

function getLessonDetail(lessonId: string): Record<number, number> {
  if (typeof window === 'undefined') return {};
  try {
    const progress = JSON.parse(localStorage.getItem(`lesson_progress_${lessonId}`) || '{}');
    const captureRaw = JSON.parse(localStorage.getItem(`lesson_capture_${lessonId}`) || '{}');
    const captureStars = captureRaw.levelStars || {};
    return { ...progress, ...captureStars };
  } catch {
    return {};
  }
}

const MULTI_LEVEL_LESSONS = [
  'af74a851-e308-411d-82e1-fafdc5bd390a',
  'd239daeb-f7e9-410e-84c7-8f0eac3ebcb4',
  '2976cdff-d622-45a6-9ce4-fbcc33fa9528',
  'a8b9a524-5e37-43c5-a479-9c98494d704e',
  '1ce04101-6a7d-45c9-bcef-6e17dbafa6ac',
  'bae12fca-bfa4-44b6-9dff-7555fe240706',
];

const STAR_BASED_LESSONS = [
  '126a2252-7482-4ed4-8d5a-a0afe82d834d',
  '3ca74ff6-7274-4cbd-9336-f33378310fcd',
  'e1ff27cf-cc1c-47e8-8407-2bc8edf9a5d2',
];

const LESSON_KEYS: Record<string, string> = {
  'af74a851-e308-411d-82e1-fafdc5bd390a': 'pawnrace_progress',
  'd239daeb-f7e9-410e-84c7-8f0eac3ebcb4': 'rookpawn_progress',
  '2976cdff-d622-45a6-9ce4-fbcc33fa9528': 'bishoppawn_progress',
  'a8b9a524-5e37-43c5-a479-9c98494d704e': 'queenpawn_progress',
  '1ce04101-6a7d-45c9-bcef-6e17dbafa6ac': 'knightpawn_progress',
  'bae12fca-bfa4-44b6-9dff-7555fe240706': 'football_progress',
  '126a2252-7482-4ed4-8d5a-a0afe82d834d': 'tworooks_progress',
  '3ca74ff6-7274-4cbd-9336-f33378310fcd': 'queenmate_progress',
  'e1ff27cf-cc1c-47e8-8407-2bc8edf9a5d2': 'rookmate_progress',
};

export default function PieceCards({ lessons, progressMap, courseId, pieceCodes, descriptions }: Props) {
  const [clientDetails, setClientDetails] = useState<Record<string, Record<number, number>>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const details: Record<string, Record<number, number>> = {};
    for (const lesson of lessons) {
      details[lesson.id] = getLessonDetail(lesson.id);
    }
    setClientDetails(details);
  }, [lessons]);

  return (
    <div className="space-y-2">
      {lessons.map((lesson, i) => {
        const isServerCompleted = progressMap[lesson.id];
        const detail = mounted ? clientDetails[lesson.id] || {} : {};
        const totalLevels = lesson.levelsCount || 1;
        const isMultiLevel = MULTI_LEVEL_LESSONS.includes(lesson.id);
        const isStarBased = STAR_BASED_LESSONS.includes(lesson.id);
        const storageKey = LESSON_KEYS[lesson.id];

        let levelsDone = 0;
        let minStars = 0;

        if (storageKey && mounted) {
          try {
            const raw = localStorage.getItem(`${storageKey}_${lesson.id}`) || '{}';
            const progress = JSON.parse(raw);
            const stars = Object.values(progress) as number[];
            levelsDone = stars.filter(s => s > 0).length;
            minStars = stars.length > 0 ? Math.min(...stars) : 0;
          } catch {}
        } else {
          levelsDone = Object.values(detail).filter((v: any) => v >= 1).length;
          const allStars = Object.values(detail) as number[];
          minStars = allStars.length > 0 ? Math.min(...allStars) : 0;
        }

        const isCompleted = isServerCompleted || (levelsDone >= totalLevels);
        const hasProgress = levelsDone > 0;
        
        // Locked if previous not completed
        const prevId = lessons[i - 1]?.id;
        const isLocked = i > 0 && !isCompleted && !hasProgress && prevId && !progressMap[prevId] && !clientDetails[prevId];

        const piece = pieceCodes?.[i];
        const desc = descriptions?.[i];

        let starCount = 0;
        if (isMultiLevel && hasProgress) starCount = levelsDone;
        else if (isStarBased && isCompleted) starCount = minStars;
        else if (!isMultiLevel && !isStarBased && isCompleted) starCount = minStars || 1;

        return (
          <Link
            key={lesson.id}
            href={isLocked ? '#' : `/lessons/${lesson.id}?course=${courseId}`}
            prefetch={!isLocked}
            className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
              isLocked ? 'cursor-not-allowed' : 'hover:-translate-y-px active:translate-y-0'
            }`}
            style={{
              background: isLocked
                ? 'var(--bg-secondary)'
                : isCompleted
                  ? 'var(--bg-elevated)'
                  : hasProgress
                    ? 'var(--bg-elevated)'
                    : 'var(--surface)',
              borderColor: isLocked
                ? 'var(--surface-border)'
                : isCompleted
                  ? 'rgba(122,182,72,0.25)'
                  : hasProgress
                    ? 'rgba(46,107,122,0.2)'
                    : 'var(--surface-border)',
              boxShadow: isLocked ? 'none' : 'var(--shadow-sm)',
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <div 
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ background: 'var(--bg-hover)' }}
            >
              {piece ? (
                <img src={`/pieces/cburnett/w${piece}.svg`} className="w-8 h-8" draggable={false} alt="" />
              ) : (
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {lesson.order || i + 1}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
              {desc && <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>}
            </div>

            <div className="shrink-0 flex items-center">
              {isCompleted ? (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <img
                      key={s}
                      src="/images/learn/star.png"
                      className={`w-4 h-4 transition-all duration-200 ${
                        s <= starCount ? 'star-animate opacity-100' : 'opacity-25 grayscale'
                      }`}
                      draggable={false}
                      alt=""
                    />
                  ))}
                </div>
              ) : hasProgress ? (
                <div 
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ 
                    background: 'var(--accent)',
                    color: 'var(--bg-primary)'
                  }}
                >
                  {levelsDone}/{totalLevels}
                </div>
              ) : isLocked ? (
                <span style={{ color: 'var(--text-tertiary)' }} className="text-lg">🔒</span>
              ) : (
                <div 
                  className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: 'var(--accent)' }}
                >
                  <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>GO</span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
