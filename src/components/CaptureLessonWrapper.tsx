'use client';

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';

const CaptureBoard = dynamic(() => import('./CaptureBoard'), { ssr: false });

function MassiveStar({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FFFFFF' : 'none'} stroke={filled ? 'none' : '#9CA3AF'} strokeWidth="2">
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
  const [resetKey, setResetKey] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(() => {
    // SSR-safe: initialize synchronously with the initial level's FEN
    return levels[0]?.initialFen || '';
  });

  const savedKey = `lesson_capture_${lesson.id}`;

// Simple FEN parse (placement only)
function parseFenSimple(fen: string) {
  const squares: Record<string, { type: string; color: 'w' | 'b' }> = {};
  const parts = fen.split(' ');
  const placement = parts[0];
  const rows = placement.split('/');
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['8','7','6','5','4','3','2','1'];
  for (let ri = 0; ri < 8; ri++) {
    let fi = 0;
    for (const ch of rows[ri]) {
      if (ch >= '1' && ch <= '8') {
        fi += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase();
        squares[`${files[fi]}${ranks[ri]}`] = { type, color };
        fi++;
      }
    }
  }
  return squares;
}

  // Load progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.levelStars) setLevelStars(data.levelStars);
        if (typeof data.currentLevel === 'number') {
          setCurrentLevel(data.currentLevel);
          setCurrentPosition(levels[data.currentLevel]?.initialFen || levels[0].initialFen || '');
        }
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

  // Initialize position on mount
  useEffect(() => {
    const initialPos = levels[currentLevel]?.initialFen || levels[0].initialFen || '';
    setCurrentPosition(initialPos);
  }, [levels, currentLevel]);

  const handleLevelComplete = (levelIndex: number, stars: number) => {
    setLevelStars(prev => ({ ...prev, [levelIndex]: stars }));
    onLevelComplete?.(levelIndex, stars);
  };

  const handleAllComplete = () => {
    onAllComplete?.();
  };

  const goToLevel = (idx: number) => {
    if (idx < 0 || idx >= levels.length) return;
    setCurrentLevel(idx);
    setShowHint(false);
    setHintArrows([]);
    setCurrentPosition(levels[idx]?.initialFen || '');
  };

  // ====== SAFE CAPTURE HINT ======
  // Find arrow to a target where, after capture, no black can capture any white.
  const FILES = ['a','b','c','d','e','f','g','h'];
  const RANKS = ['8','7','6','5','4','3','2','1'];

  function parseFenBoard(fen: string) {
    const squares: Record<string, { type: string; color: 'w' | 'b' }> = {};
    const rows = fen.split(' ')[0].split('/');
    for (let ri = 0; ri < 8; ri++) {
      let fi = 0;
      for (const ch of rows[ri]) {
        if (ch >= '1' && ch <= '8') fi += parseInt(ch);
        else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          squares[`${FILES[fi]}${RANKS[ri]}`] = { type: ch.toLowerCase(), color };
          fi++;
        }
      }
    }
    return squares;
  }

  function canMove(pieceType: string, from: string, to: string, squares: Record<string, any>, color: 'w' | 'b') {
    if (squares[from]?.color !== color) return false;
    if (squares[to]?.color === color) return false;
    if (from === to) return false;
    const ff = FILES.indexOf(from[0]), tf = FILES.indexOf(to[0]);
    const fr = RANKS.indexOf(from[1]), tr = RANKS.indexOf(to[1]);
    const df = tf - ff, dr = tr - fr, adf = Math.abs(df), adr = Math.abs(dr);

    const blocked = (stepF: number, stepR: number, count: number) => {
      for (let i = 1; i < count; i++)
        if (squares[`${FILES[ff + stepF * i]}${RANKS[fr + stepR * i]}`]) return true;
      return false;
    };

    switch (pieceType) {
      case 'r': {
        if (ff !== tf && fr !== tr) return false;
        if (ff === tf) {
          const step = tr > fr ? 1 : -1;
          for (let r = fr + step; r !== tr; r += step)
            if (squares[`${FILES[ff]}${RANKS[r]}`]) return false;
        } else {
          const step = tf > ff ? 1 : -1;
          for (let f = ff + step; f !== tf; f += step)
            if (squares[`${FILES[f]}${RANKS[fr]}`]) return false;
        }
        return true;
      }
      case 'b': {
        if (adf !== adr) return false;
        const stepF = df > 0 ? 1 : -1, stepR = dr > 0 ? 1 : -1;
        for (let i = 1; i < adf; i++)
          if (squares[`${FILES[ff + stepF * i]}${RANKS[fr + stepR * i]}`]) return false;
        return true;
      }
      case 'q': {
        if (ff === tf || fr === tr || adf === adr) {
          let stepF = 0, stepR = 0;
          if (ff === tf) stepR = tr > fr ? 1 : -1;
          else if (fr === tr) stepF = tf > ff ? 1 : -1;
          else { stepF = df > 0 ? 1 : -1; stepR = dr > 0 ? 1 : -1; }
          for (let f = ff + stepF, r = fr + stepR; f !== tf || r !== tr; f += stepF, r += stepR)
            if (squares[`${FILES[f]}${RANKS[r]}`]) return false;
          return true;
        }
        return false;
      }
      case 'n': return (adf === 2 && adr === 1) || (adf === 1 && adr === 2);
      case 'k': return adf <= 1 && adr <= 1;
      case 'p': {
        const dir = color === 'w' ? -1 : 1;
        if (tf === ff && tr === fr + dir && !squares[to]) return true;
        if (Math.abs(tf - ff) === 1 && tr === fr + dir && squares[to]?.color !== color && squares[to]) return true;
        return false;
      }
    }
    return false;
  }

  function anyBlackCanCaptureWhite(squares: Record<string, any>) {
    const blacks = Object.keys(squares).filter(s => squares[s]?.color === 'b');
    const whites = Object.keys(squares).filter(s => squares[s]?.color === 'w');
    for (const b of blacks) {
      for (const w of whites) {
        if (canMove(squares[b].type, b, w, squares, 'b')) return true;
      }
    }
    return false;
  }

  const computeHintArrow = () => {
    // HINT_ALGORITHM_V3_SAFE_CAPTURE_2026 - DEPLOYED
    const level = levels[currentLevel];
    if (!level) return [];
    const fen = currentPosition || level.initialFen || '';
    if (!fen) return [];

    const squares = parseFenBoard(fen);
    // Only target squares that still have a black piece
    const targets = (level.stars || level.targets || []).filter((t: string) => squares[t]?.color === 'b');
    if (targets.length === 0) return [];

    const whiteSquares = Object.keys(squares).filter(s => squares[s]?.color === 'w');

    let safeBest: { from: string; to: string } | null = null;
    let safeBestDist = Infinity;
    let fallbackBest: { from: string; to: string } | null = null;
    let fallbackBestDist = Infinity;

    for (const wSq of whiteSquares) {
      const piece = squares[wSq];
      for (const target of targets) {
        if (!canMove(piece.type, wSq, target, squares, 'w')) continue;

        // Simulate capture
        const next = { ...squares };
        next[target] = next[wSq];
        delete next[wSq];

        const unsafe = anyBlackCanCaptureWhite(next);
        const dist = Math.abs(FILES.indexOf(target[0]) - FILES.indexOf(wSq[0])) +
                     Math.abs(RANKS.indexOf(target[1]) - RANKS.indexOf(wSq[1]));

        if (!unsafe) {
          if (dist < safeBestDist) {
            safeBestDist = dist;
            safeBest = { from: wSq, to: target };
          }
        } else {
          if (dist < fallbackBestDist) {
            fallbackBestDist = dist;
            fallbackBest = { from: wSq, to: target };
          }
        }
      }
    }

    return safeBest ? [safeBest] : (fallbackBest ? [fallbackBest] : []);
  };

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
            key={`${resetKey}-${currentLevel}`}
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
            onAnyMove={() => {
              setHintArrows([]);
              setCurrentPosition('');
            }}
            onPositionChange={setCurrentPosition}
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
