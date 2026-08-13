'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';
import { useAnimatedLesson } from '@/hooks/useAnimatedLesson';

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

const START_FEN_1 = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1';
const START_FEN_2 = 'r2q1rk1/4bpp1/b1p1p2p/pp2P3/3P4/2PQ4/P1BN1PPP/R2R2K1 w - - 0 1';
const START_FEN_3 = 'r2q1rk1/pp3pp1/4p3/b2pP1N1/3n1P1P/P1NQn3/1P6/R4RK1 w - - 0 1';

const START_FEN_4 = '2k2b1r/ppp2ppp/8/4p1B1/2P4P/5q2/PP3P2/R2R2K1 w - - 0 1';

const START_FEN_5 = '8/2r1k1p1/3Npp1p/2Pq4/QP6/4P1P1/4K2P/8 w - - 0 1';

const START_FEN_6 = 'r3k2r/ppp2ppp/2n5/2b1p3/3qP1P1/1PN2PR1/PB1P4/R2QK1N1 b Qkq - 0 1';

const START_FEN_7 = 'r4r2/k1p5/ppQ5/1P4B1/3P4/2N5/1PP1KP2/q7 w - - 0 1';

const START_FEN_8 = '6rk/6bp/6pN/8/1pp5/q1P3PP/5P2/2R1R1K1 w - - 0 1';

const HINTS: Record<number, { from: string; to: string }[]> = {
  1: [{ from: 'h5', to: 'f7' }],
  2: [{ from: 'd3', to: 'h7' }],
  3: [{ from: 'd3', to: 'h7' }],
  4: [{ from: 'd1', to: 'd8' }],
  5: [{ from: 'a4', to: 'e8' }],
  6: [{ from: 'd4', to: 'f2' }],
  7: [{ from: 'c6', to: 'c7' }],
  8: [{ from: 'h6', to: 'f7' }],
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

function squareToCoords(square: string, sqSize: number): { x: number; y: number } {
  const ff = FILES.indexOf(square[0]);
  const fr = DISPLAY_RANKS.indexOf(square[1]);
  return { x: ff * sqSize, y: fr * sqSize };
}

function StarPng({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <img
      src="/images/learn/star.png"
      alt=""
      className="shrink-0"
      style={{
        width: size,
        height: size,
        filter: filled
          ? 'brightness(1.2) drop-shadow(0 0 1px rgba(255,255,255,0.6))'
          : 'grayscale(100%) brightness(0.4)',
      }}
      draggable={false}
    />
  );
}

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

function GhostOverlay({ from, to, piece, sqSize, className }: {
  from: string;
  to: string;
  piece: { type: string; color: 'w' | 'b' };
  sqSize: number;
  className: string;
}) {
  const fromCoords = squareToCoords(from, sqSize);
  const toCoords = squareToCoords(to, sqSize);
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: fromCoords.x,
        top: fromCoords.y,
        width: sqSize,
        height: sqSize,
        zIndex: 60,
        '--ghost-dx': `${toCoords.x - fromCoords.x}px`,
        '--ghost-dy': `${toCoords.y - fromCoords.y}px`,
      } as React.CSSProperties}
    >
      <PieceImg type={piece.type} color={piece.color} />
    </div>
  );
}

export default function MateInOneBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
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
  const { playerAnimatingMove, opponentAnimatingMove, setPlayerAnimatingMove, setOpponentAnimatingMove } = useAnimatedLesson();

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);

  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);

  const storageKey = lessonId ? `mateinone_progress_${lessonId}` : 'mateinone_progress';

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
    setGame(new Chess(EXERCISE_FENS[exercise]));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setPromotionPending(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
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
    setGame(new Chess(EXERCISE_FENS[num]));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setPromotionPending(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
  }, []);

  // ──── MATE IN 1 LOGIC ────
  const processMove = useCallback((from: string, to: string, promotionPiece?: string, skipAnimation = false) => {
    if (!game) return;
    const g = new Chess(game.fen());

    const piece = g.get(from as any);
    const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    if (isPromotion && !promotionPiece) {
      setPromotionPending({ from, to });
      return;
    }

    try {
      const move = g.move({ from, to, promotion: promotionPiece });
      if (!move) return;

      if (g.isCheckmate()) {
        if (skipAnimation) {
          // Instant for drag
          setGame(new Chess(g.fen()));
          setLastMove({ from, to });
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Мат в 1 ход!');
          saveStars(exercise, 3);
          if (exercise === 8) onComplete();
        } else {
          // Ghost animation for click (like MateInTwoBoard)
          setPlayerAnimatingMove({
            from,
            to,
            piece: { type: piece?.type.toUpperCase() || '', color: piece?.color as 'w' | 'b' || 'w' },
          });
          setLastMove({ from, to });
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Мат в 1 ход!');
          saveStars(exercise, 3);
          if (exercise === 8) onComplete();

          setTimeout(() => {
            setGame(new Chess(g.fen()));
            setPlayerAnimatingMove(null);
          }, 200);
        }
        return;
      }

      // Wrong move — instant fail for both click and drag
      setGame(new Chess(g.fen()));
      setLastMove({ from, to });
      setSelectedSquare(null);
      setIsFail(true);
      setMessage('Это не мат. Попробуйте найти мат в 1 ход!');
    } catch {
      // invalid move
    }
  }, [game, exercise, saveStars, onComplete, setPlayerAnimatingMove]);

  // ──── CLICK ────
  const handleSquareClick = useCallback((square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const g = game;
    const piece = game.get(square as any);

    if (selectedSquare === square) {
      setSelectedSquare(null);
    } else if (selectedSquare && piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    } else if (selectedSquare) {
      processMove(selectedSquare, square);
    } else {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processMove, promotionPending]);

  // ──── PROMOTION ────
  const handlePromotion = useCallback((pieceCode: string) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    processMove(from, to, pieceCode);
  }, [promotionPending, processMove]);

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
              Поставьте мат в 1 ход!
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

        {/* Подсказка */}
        <button onClick={handleHint} className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all duration-200 ${hintVisible ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}>
          <Eye size={14} /> Подсказка
        </button>

        {/* Заново */}
        <button onClick={reset} className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200">
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
                Поставьте мат в 1 ход!
              </p>
            </div>
          </div>
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
            message.includes('Отлично') ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            {message.includes('Отлично') && <Trophy className="w-5 h-5 inline-block mr-2" />}
            {message}
          </div>
        )}

        {/* Board */}
        <div className="flex justify-center w-full relative" style={{ minHeight: 8 * sqSize }}>
          <UniversalChessBoardDesigner
            fen={game.fen()}
            isReversed={exercise === 6}
            selectedSquare={selectedSquare}
            lastMove={lastMove}
            autoValidMoves={true}
            onSquareClick={handleSquareClick}
            onMove={(from, to, _promotion) => processMove(from, to, undefined, true)}
            onDragPieceChange={(piece) => {}}
            interactive={!isComplete && !isFail}
            playerAnimatingMove={playerAnimatingMove || null}
            opponentAnimatingMove={opponentAnimatingMove || null}
            disableAutoGhost={true}
            pieceTheme="cburnett"
          />
          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && (
            (() => {
              const arrows = HINTS[exercise] || [];
              if (arrows.length === 0) return null;
              return (
                <svg className="absolute inset-0 pointer-events-none z-[35]" style={{ width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                  {arrows.map((arrow, i) => {
                    const isReversed = exercise === 6;
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
        {isComplete && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <Trophy className="w-6 h-6" />
              <span>Упражнение {exercise} пройдено!</span>
            </div>
            {exercise < 8 && (
              <button
                onClick={() => switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)}
                className="bg-blue-500 text-white font-bold text-base px-6 py-2 rounded shadow hover:bg-blue-600 transition"
              >
                Перейти к Упражнению {exercise + 1} →
              </button>
            )}
            {exercise === 8 && (exerciseStars[8] || 0) >= 3 && (
              <button
                onClick={onComplete}
                className="bg-emerald-500 text-white font-bold text-base px-6 py-2 rounded shadow hover:bg-emerald-600 transition"
              >
                Урок завершён ✓
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
