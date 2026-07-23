'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Eye, Trophy } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

type ExerciseId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Exercise {
  id: ExerciseId;
  label: string;
  description: string;
  fen: string;
  demoMoves: { from: string; to: string; comment: string }[];
  minMoves3: number;
  minMoves2: number;
  matIn1?: boolean;
  matIn2?: boolean;
  timeLimit?: number; // seconds, timer starts after first white move
}

const EXERCISES: Exercise[] = [
  {
    id: 1,
    label: 'Упражнение 1',
    description: 'Мат ладьёй — загоняем короля в угол',
    fen: '8/8/8/3k4/7R/3K4/8/8 w - - 0 1',
    demoMoves: [
      { from: 'h4', to: 'e4', comment: 'Ладья даёт шах!' },
      { from: 'd5', to: 'd6', comment: 'Чёрный король отступает' },
      { from: 'd3', to: 'd4', comment: 'Белый король приближается' },
      { from: 'd6', to: 'd7', comment: 'Король отступает назад' },
      { from: 'd4', to: 'd5', comment: 'Белый король продолжает наступление' },
      { from: 'd7', to: 'c7', comment: 'Чёрный король уходит в сторону' },
      { from: 'e4', to: 'e6', comment: 'Ладья ограничивает пространство' },
      { from: 'c7', to: 'd7', comment: 'Король возвращается' },
      { from: 'd5', to: 'e5', comment: 'Белый король — выжидательный ход' },
      { from: 'd7', to: 'c7', comment: 'Чёрный король в сторону' },
      { from: 'e6', to: 'd6', comment: 'Ладья даёт шах!' },
      { from: 'c7', to: 'b7', comment: 'Король отступает' },
      { from: 'e5', to: 'd5', comment: 'Белый король поддерживает' },
      { from: 'b7', to: 'c7', comment: 'Чёрный король в центр' },
      { from: 'd5', to: 'c5', comment: 'Белый король сужает пространство' },
      { from: 'c7', to: 'b7', comment: 'Король возвращается' },
      { from: 'd6', to: 'c6', comment: 'Ладья даёт шах!' },
      { from: 'b7', to: 'b8', comment: 'Король на край доски' },
      { from: 'c5', to: 'b6', comment: 'Белый король приближается' },
      { from: 'b8', to: 'a8', comment: 'Король в угол' },
      { from: 'c6', to: 'c8', comment: 'Мат!' },
    ],
    minMoves3: 11,
    minMoves2: 14,
  },
  {
    id: 2,
    label: 'Упражнение 2',
    description: 'Мат ладьёй — поставьте мат не более чем за 10 ходов',
    fen: '8/8/8/4K3/R7/4k3/8/8 w - - 0 1',
    demoMoves: [],
    minMoves3: 10,
    minMoves2: 12,
  },
  {
    id: 3,
    label: 'Упражнение 3',
    description: 'Мат ладьёй — далёкая начальная позиция',
    fen: 'R7/8/8/4k3/8/8/8/7K w - - 0 1',
    demoMoves: [],
    minMoves3: 16,
    minMoves2: 19,
  },
  {
    id: 4,
    label: 'Упражнение 4',
    description: 'Мат в 1 ход — белая ладья на h5',
    fen: '8/8/8/7R/8/4K3/8/4k3 w - - 0 1',
    demoMoves: [
      { from: 'h5', to: 'h1', comment: 'Мат!' },
    ],
    minMoves3: 1,
    minMoves2: 1,
    matIn1: true,
  },
  {
    id: 5,
    label: 'Упражнение 5',
    description: 'Мат в 2 хода — белая ладья c7, короли b6 и b8',
    fen: '1k6/2R5/1K6/8/8/8/8/8 w - - 0 1',
    demoMoves: [
      { from: 'c7', to: 'c6', comment: 'Ладья даёт шах!' },
      { from: 'b8', to: 'a8', comment: 'Чёрный король отступает' },
      { from: 'c6', to: 'c8', comment: 'Мат!' },
    ],
    minMoves3: 2,
    minMoves2: 2,
    matIn2: true,
  },
  {
    id: 6,
    label: 'Упражнение 6',
    description: 'Мат в 2 хода — белая ладья f6, короли f4 и h5',
    fen: '8/8/5R2/7k/5K2/8/8/8 w - - 0 1',
    demoMoves: [
      { from: 'f6', to: 'e6', comment: 'Ладья готовит мат!' },
      { from: 'h5', to: 'h4', comment: 'Чёрный король отступает' },
      { from: 'e6', to: 'h6', comment: 'Мат!' },
    ],
    minMoves3: 2,
    minMoves2: 2,
    matIn2: true,
  },
  {
    id: 7,
    label: 'Упражнение 7',
    description: 'Мат за 1 минуту — белая ладья a1, король h1, чёрный король e5',
    fen: '8/8/8/4k3/8/8/8/R6K w - - 0 1',
    demoMoves: [
      { from: 'a1', to: 'e1', comment: 'Ладья даёт шах!' },
      { from: 'e5', to: 'd4', comment: 'Король отступает' },
      { from: 'h1', to: 'h2', comment: 'Белый король приближается' },
      { from: 'd4', to: 'c5', comment: 'Чёрный король бежит' },
      { from: 'e1', to: 'd1', comment: 'Ладья давит' },
      { from: 'c5', to: 'b4', comment: 'Чёрный король отступает' },
      { from: 'h2', to: 'g3', comment: 'Белый король поддерживает' },
      { from: 'b4', to: 'a5', comment: 'Король в угол' },
      { from: 'd1', to: 'd7', comment: 'Мат!' },
    ],
    minMoves3: 10,
    minMoves2: 12,
    timeLimit: 60,
  },
];

function PieceImg({ type, color }: { type: string; color: 'w' | 'b' }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* LEFT COLUMN — Desktop sidebar */}
      <div className="hidden lg:flex lg:w-[180px] flex-shrink-0 flex-col gap-3">
        {/* Avatar + Speech bubble */}
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2.5 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              Используйте ладью для ограничения пространства и короля для поддержки.
            </p>
          </div>
        </div>

        {/* Demo button */}
        {currentExercise === 1 && !demoMode && !isComplete && (
          <button
            onClick={() => { reset(); setDemoMode(true); setDemoStep(0); }}
            className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
          >
            <Eye size={14} /> Посмотреть как ставить мат
          </button>
        )}

        {/* Exercise pills */}
        <div className="w-full flex items-stretch gap-[1px]">
          {EXERCISES.map((ex) => {
            const earned = exerciseStars[ex.id] || 0;
            const isCurrent = ex.id === currentExercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={ex.id}
                onClick={() => { if (!isCurrent) switchExercise(ex.id); }}
                disabled={isCurrent}
                className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
                  isCurrent
                    ? 'bg-[#2C241B] shadow-md'
                    : isDone
                    ? 'bg-[#C9A84C]'
                    : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                title={isDone ? `Упражнение ${ex.id} — пройдено` : `Упражнение ${ex.id}`}
              >
                {isDone && earned > 0 ? (
                  earned === 3 ? (
                    <>
                      <div className="flex">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                      <div className="flex gap-[1px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${
                    isCurrent ? 'text-white' : 'text-[#9CA3AF]'
                  }`}>{ex.id}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Задание N из M + progress bar */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Задание {currentExercise} из {EXERCISES.length}
          </span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${((currentExercise) / EXERCISES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={reset}
          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

      {/* CENTER — Board */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Mobile avatar + speech bubble */}
        <div className="lg:hidden w-full flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
              <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
            </div>
            <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
              <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-3">
                Используйте ладью для ограничения пространства и короля для поддержки.
              </p>
            </div>
          </div>
        </div>

        {/* Mat-in-1 / Mat-in-2 labels */}
        {currentEx.matIn1 && (
          <div className="text-[#2b2b2b] text-[15px] font-medium mb-2 text-center leading-snug w-full">
            Мат в 1 ход
          </div>
        )}
        {currentEx.matIn2 && (
          <div className="text-[#2b2b2b] text-[15px] font-medium mb-2 text-center leading-snug w-full">
            Мат в 2 хода
          </div>
        )}

        {/* Timer */}
        {EXERCISES.find(e => e.id === currentExercise)?.timeLimit && !isComplete && !isStalemate && (
          <div className={`text-2xl font-bold font-mono ${timeLeft !== null && timeLeft <= 10 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
            {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : '1:00'}
          </div>
        )}

        {/* Demo button — mobile only */}
        <div className="lg:hidden w-full">
          {currentExercise === 1 && !demoMode && !isComplete && (
            <button
              onClick={() => { reset(); setDemoMode(true); setDemoStep(0); }}
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
            >
              <Eye size={14} /> Посмотреть как ставить мат
            </button>
          )}
        </div>

        {demoComment && (
          <div className="px-4 py-2 bg-[#5A4A3A]/10 border border-[#5A4A3A]/20 rounded-lg text-sm text-[#5A4A3A] text-center max-w-sm">
            {demoComment}
          </div>
        )}

        {/* Stalemate / fail banner */}
        {isStalemate && (
          <div className="w-full max-w-sm">
            <div className="bg-[#c62828] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">{message || 'Пат. Провалено.'}</p>
              <button
                onClick={reset}
                className="bg-white text-[#c62828] font-bold text-base px-6 py-2 rounded shadow hover:bg-gray-100 transition"
              >
                ЕЩЁ РАЗ
              </button>
            </div>
          </div>
        )}

        {/* Success message */}
        {message && !isStalemate && (
          <div className={`px-6 py-3 rounded-xl text-center font-bold text-white ${
            message.includes('Мат') ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            {message.includes('Мат') && <Trophy className="w-5 h-5 inline-block mr-2" />}
            {message}
          </div>
        )}

        {/* Board wrapper */}
        <div className="flex justify-center w-full relative">
          <div
            className="grid border-[3px] border-[#2b2b2b] rounded-sm relative select-none"
            style={{
              gridTemplateColumns: `repeat(8, ${sqSize}px)`,
              gridTemplateRows: `repeat(8, ${sqSize}px)`,
              touchAction: 'none',
            }}
          >
            {DISPLAY_RANKS.map((rank, ri) => (
              FILES.map((file, fi) => {
                const sq = `${file}${rank}`;
                const pieceObj = getPieceAt(sq);
                const light = isLight(fi, ri);
                const sel = selectedSquare === sq;
                const isValidMove = validMoves.includes(sq);
                const isDragSource = dragPiece?.square === sq;

                return (
                  <div
                    key={sq}
                    data-square={sq}
                    className="flex items-center justify-center relative select-none"
                    style={{
                      width: sqSize,
                      height: sqSize,
                      cursor: pieceObj && pieceObj.color === 'w' && !demoMode && !isComplete ? 'grab' : 'default',
                      touchAction: 'none',
                      backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)',
                      opacity: isDragSource ? 0.3 : 1,
                    }}
                    onClick={() => handleSquareClick(sq)}
                    onPointerDown={(e) => handlePointerDown(e, sq)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    {sel && (
                      <div className="absolute inset-0 bg-[rgba(184,149,106,0.35)] pointer-events-none z-10" />
                    )}
                    {fi === 0 && (
                      <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>
                        {rank}
                      </span>
                    )}
                    {ri === 7 && (
                      <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>
                        {file}
                      </span>
                    )}
                    {isValidMove && !pieceObj && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div
                          style={{ 
                            width: Math.round(sqSize * 0.3), 
                            height: Math.round(sqSize * 0.3), 
                            backgroundColor: 'var(--square-valid)', 
                            borderRadius: '50%', 
                            opacity: 0.85, 
                          }}
                        />
                      </div>
                    )}
                    {isValidMove && pieceObj && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 50 }}>
                        <div
                          style={{ 
                            width: sqSize, 
                            height: sqSize, 
                            borderRadius: '50%', 
                            border: '4px solid var(--square-valid)', 
                            boxSizing: 'border-box', 
                          }}
                        />
                      </div>
                    )}
                    {pieceObj && !isDragSource && (
                      <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                        <PieceImg type={pieceObj.type} color={pieceObj.color} />
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          {/* Dragged piece overlay */}
          {dragPiece && (
            <div
              className="fixed pointer-events-none z-50"
              style={{
                left: dragPos.x - sqSize * 0.425,
                top: dragPos.y - sqSize * 0.425,
                width: Math.round(sqSize * 0.85),
                height: Math.round(sqSize * 0.85),
              }}
            >
              <PieceImg type={dragPiece.type} color={dragPiece.color} />
            </div>
          )}
        </div>

        {/* Mobile exercise pills */}
        <div className="flex lg:hidden w-full items-stretch gap-[1px]">
          {EXERCISES.map((ex) => {
            const earned = exerciseStars[ex.id] || 0;
            const isCurrent = ex.id === currentExercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={ex.id}
                onClick={() => { if (!isCurrent) switchExercise(ex.id); }}
                disabled={isCurrent}
                className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
                  isCurrent
                    ? 'bg-[#2C241B] shadow-md'
                    : isDone
                    ? 'bg-[#C9A84C]'
                    : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                title={isDone ? `Упражнение ${ex.id} — пройдено` : `Упражнение ${ex.id}`}
              >
                {isDone && earned > 0 ? (
                  earned === 3 ? (
                    <>
                      <div className="flex">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                      <div className="flex gap-[1px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${
                    isCurrent ? 'text-white' : 'text-[#9CA3AF]'
                  }`}>{ex.id}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: Задание N из M + progress bar */}
        <div className="lg:hidden flex flex-col gap-1.5 w-full">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Задание {currentExercise} из {EXERCISES.length}
          </span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${((currentExercise) / EXERCISES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Mobile buttons */}
        <div className="flex lg:hidden gap-2 w-full">
          {currentExercise === 1 && !demoMode && !isComplete && (
            <button
              onClick={() => { reset(); setDemoMode(true); setDemoStep(0); }}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
            >
              <Eye size={14} /> Посмотреть как ставить мат
            </button>
          )}
          <button
            onClick={reset}
            className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
          >
            <RotateCcw size={14} /> Заново
          </button>
        </div>
      </div>
    </div>
  );
}
