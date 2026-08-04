'use client';

import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

const START_FEN_1 = '3r2k1/1pp2p1p/p2r2pP/8/2n5/2Pq1PQ1/PP2R3/2K1R3 w - - 0 1';
const START_FEN_2 = '8/p4bpk/3P1np1/qp5p/4B2P/3Q1P2/PPPR4/1K2R3 b - - 0 1';
const START_FEN_3 = 'rnb3k1/1p3rpp/p2Q4/4p3/4P3/2N1P2q/PPP1KR2/R7 w - - 0 1';
const START_FEN_4 = '2r1r1k1/5pp1/p1p4p/1p2P3/P1bP3q/2P2R2/1Q4PP/RB4K1 b - - 0 1';
const START_FEN_5 = '5N2/3R4/5p1p/5k2/4n3/4r2P/6PK/8 w - - 0 1';
const START_FEN_6 = '2r4k/8/p3Q3/1p6/4n2P/8/PP3PP1/1K1N4 b - - 0 1';
const START_FEN_7 = '4r1k1/p1p3pp/3p1b2/2pP4/2q2P2/PP3QP1/5N1P/1RB3K1 b - - 0 1';
const START_FEN_8 = '6k1/p1R2r1p/1p1p2pQ/3Pbp2/1P2p3/q5PP/5P1K/8 w - - 0 1';

const EXERCISE_KEYS: Record<1|2|3|4|5|6|7|8, { from: string; to: string }> = {
  1: { from: 'e2', to: 'e8' },
  2: { from: 'a5', to: 'a2' },
  3: { from: 'd6', to: 'd8' },
  4: { from: 'h4', to: 'e1' },
  5: { from: 'd7', to: 'd5' },
  6: { from: 'e4', to: 'd2' },
  7: { from: 'e8', to: 'e1' },
  8: { from: 'c7', to: 'c8' },
};

const EXERCISE_FENS: Record<1|2|3|4|5|6|7|8, string> = {
  1: START_FEN_1,
  2: START_FEN_2,
  3: START_FEN_3,
  4: START_FEN_4,
  5: START_FEN_5,
  6: START_FEN_6,
  7: START_FEN_7,
  8: START_FEN_8,
};

const HINTS: Record<number, { from: string; to: string }[]> = {
  1: [{ from: 'e2', to: 'e8' }],
  2: [{ from: 'a5', to: 'a2' }],
  3: [{ from: 'd6', to: 'd8' }],
  4: [{ from: 'h4', to: 'e1' }],
  5: [{ from: 'd7', to: 'd5' }],
  6: [{ from: 'e4', to: 'd2' }],
  7: [{ from: 'e8', to: 'e1' }],
  8: [{ from: 'c7', to: 'c8' }],
};

const SECOND_HINTS: Record<number, { from: string; to: string }[]> = {
  1: [{ from: 'e1', to: 'e8' }],
  2: [{ from: 'a2', to: 'a1' }],
  3: [{ from: 'd8', to: 'f8' }],
  4: [{ from: 'e1', to: 'f1' }],
  5: [{ from: 'f8', to: 'g6' }],
  6: [{ from: 'c8', to: 'c1' }],
  7: [{ from: 'c4', to: 'f1' }],
  8: [{ from: 'c8', to: 'f8' }],
};

function PieceImg({ type, color }: { type: string; color: 'w' | 'b' }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundImage: `url(/pieces/cburnett/${pieceKey}.svg)`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
      }}
    />
  );
}

interface DragState {
  square: string;
  type: string;
  color: 'w' | 'b';
}

interface PointerStart {
  x: number;
  y: number;
  square: string;
  moved: boolean;
  pointerId: number;
}

export default function MateInTwoBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isFail, setIsFail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sqSize, setSqSize] = useState(52);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [hintVisible, setHintVisible] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);
  const gameRef = useRef<Chess | null>(null);
  useEffect(() => { gameRef.current = game; }, [game]);

  const initialColorRef = useRef<'w' | 'b'>('w');

  const [stage, setStage] = useState<'first' | 'after_computer' | 'complete' | 'fail'>('first');

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);

  // Animation for opponent move
  const [animatingMove, setAnimatingMove] = useState<{
    from: string;
    to: string;
    piece: { type: string; color: 'w' | 'b' };
  } | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{
    from: string;
    to: string;
    piece: { type: string; color: 'w' | 'b' };
  } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const storageKey = lessonId ? `mateintwo_progress_${lessonId}` : 'mateintwo_progress';

  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { isFailRef.current = isFail; }, [isFail]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setExerciseStars(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!game) setGame(new Chess(EXERCISE_FENS[exercise]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setSqSize(Math.min(64, Math.max(36, Math.floor((window.innerWidth - 24) / 8))));
      } else {
        setSqSize(Math.min(64, Math.max(48, Math.floor((window.innerWidth - 340) / 8))));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const reset = useCallback(() => {
    const g = new Chess(EXERCISE_FENS[exercise]);
    setGame(g);
    initialColorRef.current = g.turn();
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setStage('first');
    setDragPiece(null);
  }, [exercise]);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const handleHint = useCallback(() => {
    setHintVisible(prev => !prev);
  }, []);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    setExercise(num);
    setHintVisible(false);
    const g = new Chess(EXERCISE_FENS[num]);
    setGame(g);
    initialColorRef.current = g.turn();
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setIsFail(false);
    setIsComplete(false);
    setStage('first');
    setDragPiece(null);
  }, []);

  // Auto-advance to next exercise after completion (like Lesson 7 ForkBoard)
  useEffect(() => {
    if (isComplete && exercise < 8) {
      const timer = setTimeout(() => {
        switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, exercise, switchExercise]);

  // ──── MATE IN 2 LOGIC ────
  const applyMove = useCallback((from: string, to: string, promotionPiece?: string) => {
    if (!game) return;
    setHintVisible(false);
    const g = game;
    const keyMove = EXERCISE_KEYS[exercise];

    // ── PROMOTION CHECK ──
    const piece = g.get(from as any);
    const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    if (isPromotion && !promotionPiece) {
      setPromotionPending({ from, to });
      return;
    }

    try {
      const ng = new Chess(g.fen());
      const move = ng.move({ from, to, promotion: promotionPiece });
      if (!move) return;
      setPromotionPending(null);

      if (stage === 'first') {
        if (from === keyMove.from && to === keyMove.to) {
          const piece = g.get(from as any);
          setPlayerAnimatingMove({
            from,
            to,
            piece: { type: piece?.type.toUpperCase() || '', color: piece?.color as 'w' | 'b' || 'w' },
          });
          setLastMove({ from, to });
          setSelectedSquare(null);
          setMessage('Отличный ход! Продолжайте!');
          setIsFail(false);
          setStage('after_computer');

          // Update board + remove player ghost after 800ms
          setTimeout(() => {
            if (!mountedRef.current) return;
            setGame(ng);
            setPlayerAnimatingMove(null);
          }, 800);

          // Opponent move after 900ms pause
          setTimeout(() => {
            if (!mountedRef.current) return;
            const cg = new Chess(ng.fen());
            const compMoves = cg.moves({ verbose: true });
            if (compMoves.length > 0) {
              const compMove = compMoves[0];
              const compMovedPiece = cg.get(compMove.from);
              setAnimatingMove({
                from: compMove.from,
                to: compMove.to,
                piece: { type: compMovedPiece?.type.toUpperCase() || '', color: compMovedPiece?.color as 'w' | 'b' || 'b' },
              });
              setLastMove({ from: compMove.from, to: compMove.to });
              // Update board + remove opponent ghost after 800ms
              setTimeout(() => {
                cg.move(compMove);
                setGame(new Chess(cg.fen()));
                setAnimatingMove(null);
                setMessage('Найдите мат!');
              }, 800);
            }
          }, 1400);
          return;
        } else {
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsFail(true);
          setStage('fail');
          setMessage('Неправильно. Попробуйте найти ключевой ход!');
          return;
        }
      }

      if (stage === 'after_computer') {
        if (g.isCheckmate()) {
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setStage('complete');
          setMessage('Браво! Мат в 2 хода!');
          saveStars(exercise, 3);
          if (exercise === 8) onComplete();
          return;
        } else {
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsFail(true);
          setStage('fail');
          setMessage('Это не мат. Попробуйте найти мат!');
          return;
        }
      }
    } catch {
      // invalid move
    }
  }, [game, exercise, stage, saveStars, onComplete]);

  // ──── CLICK ────
  const handleSquareClick = useCallback((square: string) => {
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const piece = game.get(square as any);

    if (selectedSquare === square) {
      setSelectedSquare(null);
    } else if (selectedSquare) {
      applyMove(selectedSquare, square);
    } else {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, applyMove]);

  // ──── DRAG & DROP ────
  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const piece = game.get(square as any);
    if (!piece || piece.color !== game.turn()) return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, square, moved: false, pointerId: e.pointerId };
  }, [game]);

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
        start.moved = true;
        const piece = game?.get(start.square as any);
        if (piece) {
          setDragPiece({ square: start.square, type: piece.type.toUpperCase(), color: piece.color as 'w' | 'b' });
          setSelectedSquare(null);
        }
      }
      if (start.moved) {
        setDragPos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalUp = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      if (!start.moved) {
        // click handled by onClick
      } else {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest('[data-square]') as HTMLElement | null;
        const targetSquare = cell?.dataset.square || null;
        if (targetSquare && targetSquare !== start.square) {
          applyMove(start.square, targetSquare);
        }
        setDragPiece(null);
      }
      pointerStartRef.current = null;
    };

    const handleGlobalCancel = (e: PointerEvent) => {
      if (pointerStartRef.current && e.pointerId === pointerStartRef.current.pointerId) {
        setDragPiece(null);
        pointerStartRef.current = null;
      }
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalCancel);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalCancel);
    };
  }, [game, applyMove]);

  // ──── HELPERS ────
  const getPieceAt = (sq: string) => {
    if (!game) return null;
    const p = game.get(sq as any);
    if (!p) return null;
    return { type: p.type.toUpperCase(), color: p.color as 'w' | 'b' };
  };

  const isLight = (f: number, r: number) => (f + r) % 2 === 0;

  const validMoves = selectedSquare && game
    ? (game.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to) as string[])
    : dragPiece && game
      ? (game.moves({ square: dragPiece.square as any, verbose: true }).map(m => m.to) as string[])
      : [];

  const turnText = game ? (game.turn() === 'w' ? 'Ход белых' : 'Ход чёрных') : '';

  if (!game) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT SIDEBAR (desktop) */}
      <div className="hidden lg:flex lg:w-[180px] flex-shrink-0 flex-col gap-3">

        {/* Avatar + speech bubble */}
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2.5 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              Поставьте мат в 2 хода!
            </p>
          </div>
        </div>

        {/* Exercise pills */}
        <div className="w-full flex flex-col gap-[1px]">
          {[1,2,3,4,5,6,7,8].map((num) => {
            const earned = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={num}
                onClick={() => { if (!isCurrent) switchExercise(num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8); }}
                disabled={isCurrent}
                className={`flex items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 px-2 ${
                  isCurrent ? 'bg-[#2C241B] shadow-md'
                  : isDone ? 'bg-[#C9A84C]'
                  : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
              >
                {isDone && earned > 0 ? (
                  earned === 3 ? (
                    <>
                      <div className="flex"><svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                      <div className="flex gap-[1px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${isCurrent ? 'text-white' : 'text-[#9CA3AF]'}`}>{num}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--text-primary)]">Задание {exercise} из 8</span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 8) * 100}%` }} />
          </div>
        </div>

        {/* Заново */}
        <button onClick={reset} className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200">
          <RotateCcw size={14} /> Заново
        </button>

        {/* Подсказка */}
        <button onClick={handleHint} className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all duration-200 ${hintVisible ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}>
          <Eye size={14} /> Подсказка
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
                Поставьте мат в 2 хода!
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block text-center font-bold text-slate-700 text-lg">
          {turnText}
        </div>

        {/* Fail banner */}
        {isFail && (
          <div className="w-full max-w-sm">
            <div className="bg-[#c62828] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">{message}</p>
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
        {message && !isFail && (
          <div className={`px-6 py-3 rounded-xl text-center font-bold text-white ${
            message.includes('Браво') ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            {message.includes('Браво') && <Trophy className="w-5 h-5 inline-block mr-2" />}
            {message}
          </div>
        )}

        {/* Board */}
        <div className="flex justify-center w-full relative">
          <div
            data-board
            className="grid border-[3px] border-[#2b2b2b] rounded-sm relative select-none"
            style={{
              gridTemplateColumns: `repeat(8, ${sqSize}px)`,
              gridTemplateRows: `repeat(8, ${sqSize}px)`,
              touchAction: 'none',
            }}
          >
            {(exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7 ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).map((rank, ri) => (
              (exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7 ? REVERSED_FILES : FILES).map((file, fi) => {
                const sq = `${file}${rank}`;
                const pieceObj = getPieceAt(sq);
                const light = isLight(exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7 ? 7-fi : fi, exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7 ? 7-ri : ri);
                const sel = selectedSquare === sq || dragPiece?.square === sq;
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
                      cursor: pieceObj && pieceObj.color === game?.turn() && !isFail && !isComplete ? 'grab' : 'default',
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
                    {lastMove && sq === lastMove.from && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.55)] pointer-events-none z-[5]" />
                    )}
                    {lastMove && sq === lastMove.to && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.70)] pointer-events-none z-[5]" />
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
                    {pieceObj && !isDragSource && !(animatingMove && sq === animatingMove.from) && !(playerAnimatingMove && sq === playerAnimatingMove.from) && (
                      <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                        <PieceImg type={pieceObj.type} color={pieceObj.color} />
                      </div>
                    )}
                  </div>
                );
              })
            ))}
            {/* Opponent move ghost piece */}
            {animatingMove && (() => {
              const isReversed = exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7;
              const fromF = (isReversed ? REVERSED_FILES : FILES).indexOf(animatingMove.from[0]);
              const fromR = (isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).indexOf(animatingMove.from[1]);
              const toF = (isReversed ? REVERSED_FILES : FILES).indexOf(animatingMove.to[0]);
              const toR = (isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).indexOf(animatingMove.to[1]);
              const x1 = fromF * sqSize;
              const y1 = fromR * sqSize;
              const x2 = toF * sqSize;
              const y2 = toR * sqSize;
              return (
                <div
                  ref={ghostRef}
                  key={animatingMove.from + '-' + animatingMove.to}
                  className="absolute pointer-events-none animate-opponent-move"
                  style={{
                    left: x1,
                    top: y1,
                    width: sqSize,
                    height: sqSize,
                    zIndex: 60,
                    '--ghost-dx': `${x2 - x1}px`,
                    '--ghost-dy': `${y2 - y1}px`,
                  } as React.CSSProperties}
                >
                  <div className="w-full h-full flex items-center justify-center" style={{ padding: Math.round(sqSize * 0.075) }}>
                    <PieceImg type={animatingMove.piece.type} color={animatingMove.piece.color} />
                  </div>
                </div>
              );
            })()}
            {/* Player move ghost piece */}
            {playerAnimatingMove && (() => {
              const isReversed = exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7;
              const fromF = (isReversed ? REVERSED_FILES : FILES).indexOf(playerAnimatingMove.from[0]);
              const fromR = (isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).indexOf(playerAnimatingMove.from[1]);
              const toF = (isReversed ? REVERSED_FILES : FILES).indexOf(playerAnimatingMove.to[0]);
              const toR = (isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).indexOf(playerAnimatingMove.to[1]);
              const x1 = fromF * sqSize;
              const y1 = fromR * sqSize;
              const x2 = toF * sqSize;
              const y2 = toR * sqSize;
              return (
                <div
                  key={playerAnimatingMove.from + '-' + playerAnimatingMove.to}
                  className="absolute pointer-events-none animate-player-move"
                  style={{
                    left: x1,
                    top: y1,
                    width: sqSize,
                    height: sqSize,
                    zIndex: 60,
                    '--ghost-dx': `${x2 - x1}px`,
                    '--ghost-dy': `${y2 - y1}px`,
                  } as React.CSSProperties}
                >
                  <div className="w-full h-full flex items-center justify-center" style={{ padding: Math.round(sqSize * 0.075) }}>
                    <PieceImg type={playerAnimatingMove.piece.type} color={playerAnimatingMove.piece.color} />
                  </div>
                </div>
              );
            })()}
          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && !dragPiece && (
            (() => {
              const arrows = stage === 'after_computer' ? (SECOND_HINTS[exercise] || []) : (HINTS[exercise] || []);
              if (arrows.length === 0) return null;
              return (
                <svg className="absolute inset-0 pointer-events-none z-[35]" style={{ width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                  {arrows.map((arrow, i) => {
                    const isReversed = exercise === 2 || exercise === 4 || exercise === 6 || exercise === 7;
                    const fromF = (isReversed ? REVERSED_FILES : FILES).indexOf(arrow.from[0]);
                    const fromR = (isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).indexOf(arrow.from[1]);
                    const toF = (isReversed ? REVERSED_FILES : FILES).indexOf(arrow.to[0]);
                    const toR = (isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).indexOf(arrow.to[1]);
                    const x1 = (fromF + 0.5) * sqSize;
                    const y1 = (fromR + 0.5) * sqSize;
                    const x2 = (toF + 0.5) * sqSize;
                    const y2 = (toR + 0.5) * sqSize;
                    const strokeW = sqSize < 60 ? 14 : 18;
                    const halfW = strokeW / 2;
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const headHeight = sqSize * 0.6;
                    const headBase = strokeW * 3;
                    const nx = -dy / len;
                    const ny = dx / len;
                    const blx = x1 + nx * halfW;   const bly = y1 + ny * halfW;
                    const brx = x1 - nx * halfW;   const bry = y1 - ny * halfW;
                    const tailX = x2 - (dx / len) * headHeight;
                    const tailY = y2 - (dy / len) * headHeight;
                    const tlx = tailX + nx * halfW; const tly = tailY + ny * halfW;
                    const trx = tailX - nx * halfW; const try_ = tailY - ny * halfW;
                    const hlx = tailX + nx * headBase / 2; const hly = tailY + ny * headBase / 2;
                    const hrx = tailX - nx * headBase / 2; const hry = tailY - ny * headBase / 2;
                    const cross = (brx - blx) * (-dy / len) - (bry - bly) * (-dx / len);
                    const sweep = cross > 0 ? 1 : 0;
                    const pathD = `M ${blx} ${bly} L ${tlx} ${tly} L ${hlx} ${hly} L ${x2} ${y2} L ${hrx} ${hry} L ${trx} ${try_} L ${brx} ${bry} A ${halfW} ${halfW} 0 1 ${sweep} ${blx} ${bly} Z`;
                    return (
                      <path
                        key={i}
                        d={pathD}
                        fill="rgba(44, 36, 27, 0.35)"
                        className="arrow-hint-line"
                      />
                    );
                  })}
                </svg>
              );
            })()
          )}
          {promotionPending && (
            <div className="absolute z-50 pointer-events-auto" style={{
              left: `${FILES.indexOf(promotionPending.to[0]) * sqSize}px`,
              top: promotionPending.from[1] === '2' ? 4 * sqSize : 0,
              width: sqSize,
              height: 4 * sqSize,
              backgroundColor: '#2C241B',
              borderRadius: '0px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {PROMOTION_PIECES.map(({ code, name }) => (
                <button
                  key={code}
                  onClick={() => { setPromotionPending(null); applyMove(promotionPending.from, promotionPending.to, code); }}
                  className="w-full aspect-square flex items-center justify-center transition-all duration-150"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid transparent',
                    borderRadius: '0px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.15)';
                    e.currentTarget.style.borderColor = '#C9A84C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.25)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.15)';
                  }}
                  title={name}
                >
                  <img
                    src={`/pieces/cburnett/${promotionPending.from[1] === '2' ? 'b' : 'w'}${code.toUpperCase()}.svg`}
                    alt={name}
                    draggable={false}
                    style={{ width: '70%', height: '70%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
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
        <div className="flex lg:hidden gap-[1px] w-full">
          {[1,2,3,4,5,6,7,8].map((num) => {
            const earned = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={num}
                onClick={() => { if (!isCurrent) switchExercise(num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8); }}
                disabled={isCurrent}
                className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 min-w-[36px] ${
                  isCurrent ? 'bg-[#2C241B] shadow-md'
                  : isDone ? 'bg-[#C9A84C]'
                  : 'bg-[#F0EBE4] border border-[#D4C5B5]'
                } ${isCurrent ? 'cursor-not-allowed' : isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
              >
                {isDone && earned > 0 ? (
                  earned === 3 ? (
                    <>
                      <div className="flex"><svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                      <div className="flex gap-[1px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  )
                ) : (
                  <span className={`text-sm font-bold leading-none ${isCurrent ? 'text-white' : 'text-[#9CA3AF]'}`}>{num}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile progress + buttons row */}
        <div className="flex lg:hidden flex-col gap-2 w-full">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[var(--text-primary)]">Задание {exercise} из 8</span>
            <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 8) * 100}%` }} />
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={handleHint} className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${hintVisible ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}>
              <Eye size={14} /> Подсказка
            </button>
            <button onClick={reset} className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200">
              <RotateCcw size={14} /> Заново
            </button>
          </div>
        </div>

        {/* Completion banner */}
        {isComplete && exercise === 8 && (exerciseStars[8] || 0) >= 3 && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <button
              onClick={onComplete}
              className="bg-emerald-500 text-white font-bold text-base px-6 py-2 rounded shadow hover:bg-emerald-600 transition"
            >
              Урок завершён ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
