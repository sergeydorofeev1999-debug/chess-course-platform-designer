'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Eye, Trophy } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const START_FEN_1 = '8/8/8/8/P3k3/8/8/7K w - - 0 1';
const START_FEN_2 = '8/3k4/8/8/7P/8/8/K7 w - - 0 1';
const START_FEN_3 = '8/8/8/P3k3/8/8/8/7K w - - 0 1';
const START_FEN_4 = '8/8/8/8/8/1k4P1/8/7K w - - 0 1';
const START_FEN_5 = '8/5k2/8/8/P7/8/8/7K w - - 0 1';
const START_FEN_6 = '8/8/5p2/8/8/2k4P/8/K7 w - - 0 1';

const SQUARE_FILL = 'rgba(255,255,255,0.75)';

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
  { code: 'n', name: 'Конь' },
];

function PieceImg({ type, color }: { type: string; color: 'w' | 'b' }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT SIDEBAR (desktop) */}
      <div className="hidden lg:flex lg:w-[180px] flex-shrink-0 flex-col gap-3">
        {/* Avatar + Speech bubble */}
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2.5 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              Квадрат от пешки до последней горизонтали. Король внутри — догонит, снаружи — пешка проходит.
            </p>
          </div>
        </div>

        {/* Exercise pills — RookMateBoard style */}
        <div className="w-full flex items-stretch gap-[1px]">
          {[1,2,3,4,5,6].map((exId) => {
            const earned = exerciseStars[exId] || 0;
            const isCurrent = exId === exercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={exId}
                onClick={() => { if (!isCurrent) switchExercise(exId as 1|2|3|4|5|6); }}
                disabled={isCurrent}
                className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
                  isCurrent
                    ? 'bg-[#2C241B] shadow-md'
                    : isDone
                    ? 'bg-[#C9A84C]'
                    : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                title={isDone ? `Упражнение ${exId} — пройдено` : `Упражнение ${exId}`}
              >
                {isDone && earned > 0 ? (
                  earned === 3 ? (
                    <>
                      <div className="flex"><svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                      <div className="flex gap-[1px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${isCurrent ? 'text-white' : 'text-[#9CA3AF]'}`}>{exId}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Задание N из 6 + progress bar */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Задание {exercise} из 6
          </span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${(exercise / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Sidebar action buttons */}
        {exercise === 1 && !demoMode && !isComplete && !isFail && (
          <>
            <button
              onClick={handleShowSquare}
              className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all w-full ${showSquare ? 'border-[rgba(92,64,51,0.25)] bg-[rgba(92,64,51,0.08)] text-[#5A4A3A]' : 'border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}
            >
              <Eye size={14} /> {showSquare ? 'Скрыть квадрат' : 'Показать квадрат'}
            </button>
            <button
              onClick={startDemo}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              <Eye size={14} /> Сыграть a5
            </button>
          </>
        )}
        {exercise === 2 && !ex2Mode && !isComplete && !isFail && (
          <>
            <button
              onClick={startEx2KingChase}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Король догонит
            </button>
            <button
              onClick={startEx2PawnRun}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Пешка пройдёт
            </button>
          </>
        )}
        {exercise === 3 && !ex3Mode && !isComplete && !isFail && (
          <>
            <button
              onClick={startEx3KingChase}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Король догонит
            </button>
            <button
              onClick={startEx3PawnRun}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Пешка пройдёт
            </button>
          </>
        )}
        {exercise === 4 && !ex4Mode && !isComplete && !isFail && (
          <>
            <button
              onClick={startEx4KingChase}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Король догонит
            </button>
            <button
              onClick={startEx4PawnRun}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Пешка пройдёт
            </button>
          </>
        )}
        {exercise === 5 && !ex5Mode && !isComplete && !isFail && (
          <>
            <button
              onClick={startEx5KingChase}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Король догонит
            </button>
            <button
              onClick={startEx5PawnRun}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Пешка пройдёт
            </button>
          </>
        )}
        {exercise === 6 && !ex6Mode && !isComplete && !isFail && (
          <>
            <button
              onClick={startEx6KingChase}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Король догонит
            </button>
            <button
              onClick={startEx6PawnRun}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
            >
              Пешка пройдёт
            </button>
          </>
        )}

        {/* Reset button */}
        <button
          onClick={reset}
          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all w-full"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Mobile avatar + speech bubble */}
        <div className="lg:hidden w-full flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
              <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
            </div>
            <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
              <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-3">
                Квадрат от пешки до последней горизонтали. Король внутри — догонит, снаружи — пешка проходит.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-slate-700 text-lg">{turnText}</div>

        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm text-center max-w-sm ${isComplete ? 'bg-green-50 border border-green-200 text-green-800' : isFail ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
            {message}
          </div>
        )}

        {isComplete && exercise === 1 && (
          <div className="flex flex-col items-center gap-3">
            <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-green-500">
              <Trophy className="w-5 h-5 inline-block mr-2" />
              {message || 'Правило квадрата сработало!'}
            </div>
            <button
              onClick={() => switchExercise(2)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow"
            >
              Перейти к Упражнению 2 →
            </button>
          </div>
        )}

        {isComplete && exercise === 2 && (
          <div className="flex flex-col items-center gap-3">
            <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-green-500">
              <Trophy className="w-5 h-5 inline-block mr-2" />
              {message || 'Правило квадрата сработало!'}
            </div>
            <button
              onClick={() => switchExercise(3)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow"
            >
              Перейти к Упражнению 3 →
            </button>
          </div>
        )}

        {isComplete && exercise === 3 && (
          <div className="flex flex-col items-center gap-3">
            <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-green-500">
              <Trophy className="w-5 h-5 inline-block mr-2" />
              {message || 'Правило квадрата сработало!'}
            </div>
            <button
              onClick={() => switchExercise(4)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow"
            >
              Перейти к Упражнению 4 →
            </button>
          </div>
        )}

        {isComplete && exercise === 4 && (
          <div className="flex flex-col items-center gap-3">
            <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-green-500">
              <Trophy className="w-5 h-5 inline-block mr-2" />
              {message || 'Правило квадрата сработало!'}
            </div>
            <button
              onClick={() => switchExercise(5)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow"
            >
              Перейти к Упражнению 5 →
            </button>
          </div>
        )}

        {isComplete && exercise === 5 && (
          <div className="flex flex-col items-center gap-3">
            <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-green-500">
              <Trophy className="w-5 h-5 inline-block mr-2" />
              {message || 'Правило квадрата сработало!'}
            </div>
            <button
              onClick={() => switchExercise(6)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow"
            >
              Перейти к Упражнению 6 →
            </button>
          </div>
        )}

        {isComplete && exercise === 6 && (
          <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-green-500">
            <Trophy className="w-5 h-5 inline-block mr-2" />
            {message || 'Правило квадрата сработало!'}
          </div>
        )}

        {isFail && (
          <div className="w-full max-w-sm">
            <div className="bg-[#c62828] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">{message || 'Провалено'}</p>
              <button
                onClick={reset}
                className="bg-white text-[#c62828] font-bold text-base px-6 py-2 rounded shadow hover:bg-gray-100 transition"
              >
                ЕЩЁ РАЗ
              </button>
            </div>
          </div>
        )}

        {/* PROMOTION MODAL */}
        {promotionPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 rounded-lg">
            <div className="bg-white rounded-lg p-4 shadow-xl text-center space-y-3 max-w-[260px]">
              <p className="font-bold text-sm">Превращение пешки!</p>
              <p className="text-xs text-gray-500">Ваша пешка достигла края доски</p>
              <div className="flex gap-2 justify-center">
                {PROMOTION_PIECES.map(({ code, name }) => (
                  <button
                    key={code}
                    onClick={() => handlePromotion(code)}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition border border-gray-300"
                    title={name}
                  >
                    <img src={`/pieces/cburnett/w${code.toUpperCase()}.svg`} className="w-8 h-8" draggable={false} alt={name} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Board */}
        <div className="flex justify-center w-full relative">
          <div
            className="grid border-[3px] border-[#2b2b2b] rounded-sm relative select-none"
            style={{
              gridTemplateColumns: `repeat(8, ${sqSize}px)`,
              gridTemplateRows: `repeat(8, ${sqSize}px)`,
              touchAction: 'none',
            }}
          >
            {DISPLAY_RANKS.map((rank, ri) =>
              FILES.map((file, fi) => {
                const sq = `${file}${rank}`;
                const pieceObj = getPieceAt(sq);
                const light = isLight(fi, ri);
                const sel = selectedSquare === sq;
                const isValidMove = validMoves.includes(sq);
                const isDragSource = dragPiece?.square === sq;
                const isSquareBorder = showSquare && squareCells.includes(sq);
                const canInteract = ((exercise === 2 && ex2Mode !== null) || (exercise === 3 && ex3Mode !== null) || (exercise === 4 && ex4Mode !== null) || (exercise === 5 && ex5Mode !== null) || (exercise === 6 && ex6Mode !== null)) && !isComplete && !isFail && !promotionPending;

                return (
                  <div
                    key={sq}
                    data-square={sq}
                    className="flex items-center justify-center relative select-none"
                    style={{
                      width: sqSize,
                      height: sqSize,
                      cursor: canInteract ? 'grab' : 'default',
                      touchAction: 'none',
                      backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)',
                      opacity: isDragSource ? 0.3 : 1,
                    }}
                    onClick={() => handleSquareClick(sq)}
                    onPointerDown={(e) => handlePointerDown(e, sq)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    {isSquareBorder && (
                      <div className="absolute inset-0 pointer-events-none z-[5]" style={{ backgroundColor: SQUARE_FILL }} />
                    )}
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
                      <div className="relative pointer-events-none z-[15]" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                        <PieceImg type={pieceObj.type} color={pieceObj.color} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

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
          {[1,2,3,4,5,6].map((exId) => {
            const earned = exerciseStars[exId] || 0;
            const isCurrent = exId === exercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={exId}
                onClick={() => { if (!isCurrent) switchExercise(exId as 1|2|3|4|5|6); }}
                disabled={isCurrent}
                className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
                  isCurrent
                    ? 'bg-[#2C241B] shadow-md'
                    : isDone
                    ? 'bg-[#C9A84C]'
                    : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                title={isDone ? `Упражнение ${exId} — пройдено` : `Упражнение ${exId}`}
              >
                {isDone && earned > 0 ? (
                  earned === 3 ? (
                    <>
                      <div className="flex"><svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                      <div className="flex gap-[1px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${isCurrent ? 'text-white' : 'text-[#9CA3AF]'}`}>{exId}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: Задание N из 6 + progress bar */}
        <div className="lg:hidden flex flex-col gap-1.5 w-full">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Задание {exercise} из 6
          </span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${(exercise / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Mobile action buttons row */}
        <div className="flex lg:hidden gap-2 w-full">
          {exercise === 1 && !demoMode && !isComplete && !isFail && (
            <>
              <button
                onClick={handleShowSquare}
                className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-all ${showSquare ? 'border-[rgba(92,64,51,0.25)] bg-[rgba(92,64,51,0.08)] text-[#5A4A3A]' : 'border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}
              >
                <Eye size={14} /> {showSquare ? 'Скрыть квадрат' : 'Квадрат'}
              </button>
              <button
                onClick={startDemo}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                <Eye size={14} /> Сыграть a5
              </button>
            </>
          )}
          {exercise === 2 && !ex2Mode && !isComplete && !isFail && (
            <>
              <button
                onClick={startEx2KingChase}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Король догонит
              </button>
              <button
                onClick={startEx2PawnRun}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Пешка пройдёт
              </button>
            </>
          )}
          {exercise === 3 && !ex3Mode && !isComplete && !isFail && (
            <>
              <button
                onClick={startEx3KingChase}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Король догонит
              </button>
              <button
                onClick={startEx3PawnRun}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Пешка пройдёт
              </button>
            </>
          )}
          {exercise === 4 && !ex4Mode && !isComplete && !isFail && (
            <>
              <button
                onClick={startEx4KingChase}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Король догонит
              </button>
              <button
                onClick={startEx4PawnRun}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Пешка пройдёт
              </button>
            </>
          )}
          {exercise === 5 && !ex5Mode && !isComplete && !isFail && (
            <>
              <button
                onClick={startEx5KingChase}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Король догонит
              </button>
              <button
                onClick={startEx5PawnRun}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Пешка пройдёт
              </button>
            </>
          )}
          {exercise === 6 && !ex6Mode && !isComplete && !isFail && (
            <>
              <button
                onClick={startEx6KingChase}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Король догонит
              </button>
              <button
                onClick={startEx6PawnRun}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[#5A4A3A] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all"
              >
                Пешка пройдёт
              </button>
            </>
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
