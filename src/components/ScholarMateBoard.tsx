'use client';

import AvatarBubble from './AvatarBubble';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Eye, Trophy } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

const FILES = ['a','b','c','d','e','f','g','h'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];

const START_FEN_1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_2 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_3 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_4 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_5 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_6 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_7 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_8 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const HINTS: Record<number, { from: string; to: string; phase: number }[]> = {
  1: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'f1', to: 'c4', phase: 1 },
    { from: 'd1', to: 'h5', phase: 2 },
    { from: 'h5', to: 'f7', phase: 3 },
  ],
  2: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'f1', to: 'c4', phase: 1 },
    { from: 'd1', to: 'h5', phase: 2 },
    { from: 'h5', to: 'f7', phase: 3 },
  ],
  3: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'f1', to: 'c4', phase: 1 },
    { from: 'd1', to: 'f3', phase: 2 },
    { from: 'f3', to: 'f7', phase: 3 },
  ],
  4: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'f1', to: 'c4', phase: 1 },
    { from: 'd1', to: 'f3', phase: 2 },
    { from: 'f3', to: 'f7', phase: 3 },
  ],
  5: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'g8', to: 'f6', phase: 1 },
  ],
  6: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'g8', to: 'f6', phase: 1 },
  ],
  7: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'g8', to: 'f6', phase: 1 },
  ],
  8: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'g8', to: 'f6', phase: 1 },
  ],
};

// Find a black capture that leaves the black piece safe (no white recapture)
function findSafeBlackCapture(currentGame: Chess): { from: string; to: string } | null {
  const blackMoves = currentGame.moves({ verbose: true });
  const captures = blackMoves.filter((m: any) => m.captured);
  for (const capture of captures) {
    const testGame = new Chess(currentGame.fen());
    testGame.move({ from: capture.from, to: capture.to });
    const whiteMoves = testGame.moves({ verbose: true });
    const whiteRecaptures = whiteMoves.filter((m: any) => m.captured && m.to === capture.to);
    if (whiteRecaptures.length === 0) {
      return { from: capture.from, to: capture.to };
    }
  }
  return null;
}

function handleFailWithBlackCapture(
  g: Chess,
  setGameFn: (g: Chess) => void,
  setIsFailFn: (v: boolean) => void,
  setMessageFn: (msg: string) => void,
  setSelectedSquareFn: (sq: string | null) => void,
  setLastMoveFn: (m: { from: string; to: string } | null) => void,
  setOpponentAnimatingMoveFn: (m: GhostMove | null) => void,
  mountedRef: React.RefObject<boolean>
) {
  const cap = findSafeBlackCapture(g);
  if (cap) {
    setTimeout(() => {
      if (!mountedRef.current) return;
      const ghostPiece = g.get(cap.from as any);
      if (ghostPiece) {
        setOpponentAnimatingMoveFn({ from: cap.from, to: cap.to, piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
        setTimeout(() => {
          setOpponentAnimatingMoveFn(null);
          g.move({ from: cap.from, to: cap.to });
          setLastMoveFn({ from: cap.from, to: cap.to });
          setGameFn(new Chess(g.fen()));
        }, 200);
      } else {
        g.move({ from: cap.from, to: cap.to });
        setLastMoveFn({ from: cap.from, to: cap.to });
        setGameFn(new Chess(g.fen()));
      }
      setTimeout(() => {
        if (mountedRef.current) { setIsFailFn(true); setMessageFn('Провалено'); }
      }, 1000);
    }, 1000);
  } else {
    setTimeout(() => {
      if (mountedRef.current) { setIsFailFn(true); setMessageFn('Провалено'); }
    }, 1000);
  }
  setSelectedSquareFn(null);
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
      className="w-full h-full bg-contain bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(/pieces/cburnett/${pieceKey}.svg)`,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
      }}
    />
  );
}
interface GhostMove {
  from: string;
  to: string;
  piece: { type: string; color: 'w' | 'b' };
}

function GhostOverlay({
  anim,
  animClass,
  getPos,
  sqSize,
}: {
  anim: GhostMove | null;
  animClass: string;
  getPos: (sq: string) => { left: number; top: number };
  sqSize: number;
}) {
  if (!anim) return null;
  const fromPos = getPos(anim.from);
  const toPos = getPos(anim.to);
  const dx = toPos.left - fromPos.left;
  const dy = toPos.top - fromPos.top;
  return (
    <div
      className={`absolute pointer-events-none z-40 ${animClass}`}
      style={{
        left: fromPos.left,
        top: fromPos.top,
        width: sqSize,
        height: sqSize,
        padding: Math.round(sqSize * 0.075),
        '--ghost-dx': `${dx}px`,
        '--ghost-dy': `${dy}px`,
      } as React.CSSProperties}
    >
      <PieceImg type={anim.piece.type} color={anim.piece.color} />
    </div>
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

export default function ItalianOpeningBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isFail, setIsFail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [whiteMoves, setWhiteMoves] = useState(0);
  const [sqSize, setSqSize] = useState(52);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<GhostMove | null>(null);
  const [playerAnimatingMoves, setPlayerAnimatingMoves] = useState<GhostMove[] | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<GhostMove | null>(null);
  const [opponentAnimatingMoves, setOpponentAnimatingMoves] = useState<GhostMove[] | null>(null);

  const isReversed = exercise === 5 || exercise === 6 || exercise === 7 || exercise === 8;

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);
  const autoStartedRef = useRef(false);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);

  const storageKey = lessonId ? `italian_progress_${lessonId}` : 'italian_progress';

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
    if (!game) setGame(new Chess(START_FEN_1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isComplete) {
      if (exercise < 8) {
        const timer = setTimeout(() => switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8), 2000);
        return () => clearTimeout(timer);
      } else if (exercise === 8 && (exerciseStars[8] || 0) >= 3) {
        const timer = setTimeout(() => onComplete?.(), 2000);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, exercise, exerciseStars, onComplete]);

  // Auto-start: white plays e4 on init for exercise 5, 6 and 7
  useEffect(() => {
    if (!game) return;
    if (exercise !== 5 && exercise !== 6 && exercise !== 7 && exercise !== 8) return;
    if (autoStartedRef.current) return;
    if (game.turn() === 'w' && whiteMoves === 0) {
      autoStartedRef.current = true;
      setTimeout(() => {
        if (!mountedRef.current) return;
        const g = game;
        const ghostPiece = g.get('e2' as any);
        if (ghostPiece) {
          setOpponentAnimatingMove({ from: 'e2', to: 'e4', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
          setTimeout(() => {
            setOpponentAnimatingMove(null);
            g.move({ from: 'e2', to: 'e4' });
            setLastMove({ from: 'e2', to: 'e4' });
            setGame(new Chess(g.fen()));
          }, 200);
        }
        if (exercise === 7) {
          setMessage('Ответьте на e4 — сыграйте e5 и откройте диагональ для слона. Затем защититесь от атаки белых.');
        }
      }, 1000);
    }
  }, [game, exercise, whiteMoves]);

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
    const fen = exercise === 1 ? START_FEN_1 : exercise === 2 ? START_FEN_2 : exercise === 3 ? START_FEN_3 : exercise === 4 ? START_FEN_4 : exercise === 5 ? START_FEN_5 : exercise === 6 ? START_FEN_6 : exercise === 7 ? START_FEN_7 : START_FEN_8;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
    setHintVisible(false);
    autoStartedRef.current = false;
  }, [exercise]);

  const handleHint = useCallback(() => {
    if (isComplete || isFail) return;
    const playerColor = (exercise === 5 || exercise === 6 || exercise === 7 || exercise === 8) ? 'b' : 'w';
    if (game?.turn() !== playerColor) return;
    setHintVisible(prev => !prev);
  }, [isComplete, isFail, game, exercise]);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    setExercise(num);
    setHintVisible(false);
    const fen = num === 1 ? START_FEN_1 : num === 2 ? START_FEN_2 : num === 3 ? START_FEN_3 : num === 4 ? START_FEN_4 : num === 5 ? START_FEN_5 : num === 6 ? START_FEN_6 : num === 7 ? START_FEN_7 : START_FEN_8;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
    autoStartedRef.current = false;
  }, []);

  const getSquarePixelPos = useCallback((sq: string) => {
    const file = sq[0];
    const rank = sq[1];
    if (isReversed) {
      const fi = REVERSED_FILES.indexOf(file);
      const ri = REVERSED_DISPLAY_RANKS.indexOf(rank);
      return { left: fi * sqSize, top: ri * sqSize };
    } else {
      const fi = FILES.indexOf(file);
      const ri = DISPLAY_RANKS.indexOf(rank);
      return { left: fi * sqSize, top: ri * sqSize };
    }
  }, [exercise, sqSize]);

  const processWhiteMove = useCallback(async (from: string, to: string, promotionPiece?: string, skipAnimation = false) => {
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w' && exercise !== 5 && exercise !== 6 && exercise !== 7 && exercise !== 8) return;

    try {
      const piece = g.get(from as any);
      const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
      if (isPromotion && !promotionPiece) {
        setPromotionPending({ from, to });
        return;
      }

      // Validate on a board copy first
      const ng = new Chess(g.fen());
      const move = ng.move({ from, to, promotion: promotionPiece });
      if (!move) return;

      const realMove = g.move({ from, to, promotion: promotionPiece });
      if (!realMove) return;
      setLastMove({ from, to });
      setGame(new Chess(g.fen()));
      setHintVisible(false);
      setSelectedSquare(null);

      if (piece && !skipAnimation) {
        const isCastle = move.piece === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
        if (isCastle) {
          const isShort = to === 'g1';
          const rookFrom = isShort ? 'h1' : 'a1';
          const rookTo = isShort ? 'f1' : 'd1';
          setPlayerAnimatingMoves([
            { from, to, piece: { type: 'K', color: 'w' } },
            { from: rookFrom, to: rookTo, piece: { type: 'R', color: 'w' } },
          ]);
        } else {
          setPlayerAnimatingMove({ from, to, piece: { type: piece!.type.toUpperCase(), color: piece!.color as 'w' | 'b' } });
        }
        setTimeout(() => {
          setPlayerAnimatingMove(null);
          setPlayerAnimatingMoves(null);
        }, 200);
      }

      const nextWhiteMoves = whiteMoves + 1;


          if (exercise === 5) {
        // Exercise 5: Защита от детского мата — ученик играет за чёрных
        // После g.move() чёрных очередь белых (g.turn() === 'w')
        if (g.turn() !== 'w') return; // не чёрный ход — игнорируем
        if (whiteMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Белые вывели слона на c4 — теперь сыграйте конём на f6!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('f1' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'f1', to: 'c4', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'f1', to: 'c4' });
                  setLastMove({ from: 'f1', to: 'c4' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setIsComplete(true);
            setMessage('Отлично! Конь на f6 защищает пункт h5 — белые больше не могут поставить детский мат через Qh5. Детский мат отражён!');
            saveStars(5, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      }

      if (exercise === 6) {
        // Exercise 6: Защита от детского мата — ученик играет за чёрных БЕЗ подсказок
        if (g.turn() !== 'w') return; // не чёрный ход — игнорируем
        if (whiteMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('f1' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'f1', to: 'c4', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'f1', to: 'c4' });
                  setLastMove({ from: 'f1', to: 'c4' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setIsComplete(true);
            setMessage('Отлично! Конь на f6 защищает пункт h5 — белые больше не могут поставить детский мат через Qh5. Детский мат отражён!');
            saveStars(6, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      }

      if (exercise === 8) {
        // Exercise 8: Ученик играет за чёрных самостоятельно, без подсказок до хода
        // Подсказки появляются ПОСЛЕ ходов чёрных (жёлтая плашка)
        if (g.turn() !== 'w') return; // не чёрный ход — игнорируем
        if (whiteMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка захватила центр и открыла диагональ для слона.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('d1' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'd1', to: 'h5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'd1', to: 'h5' });
                  setLastMove({ from: 'd1', to: 'h5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 2000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Конь вышел ближе к центру и защитил пешку e5.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('f1' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'f1', to: 'c4', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'f1', to: 'c4' });
                  setLastMove({ from: 'f1', to: 'c4' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 2000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'g7' && to === 'g6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка защитила короля от мата и напала на ферзя.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('h5' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'h5', to: 'f3', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'h5', to: 'f3' });
                  setLastMove({ from: 'h5', to: 'f3' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 2000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 3) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setIsComplete(true);
            setMessage('Отлично! Конь на f6 защищает пункт f7 — детский мат отражён!');
            saveStars(8, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      }

      if (exercise === 7) {
        // Exercise 7: Ученик играет за чёрных, белые ходят автоматически
        // Подсказки появляются ПОСЛЕ ходов чёрных (жёлтая плашка)
        if (g.turn() !== 'w') return;
        if (whiteMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка захватила центр и открыла диагональ для слона.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('d1' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'd1', to: 'h5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'd1', to: 'h5' });
                  setLastMove({ from: 'd1', to: 'h5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 2000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Конь вышел ближе к центру и защитил пешку e5.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('f1' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'f1', to: 'c4', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'f1', to: 'c4' });
                  setLastMove({ from: 'f1', to: 'c4' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 2000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'g7' && to === 'g6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка защитила короля от мата и напала на ферзя.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('h5' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'h5', to: 'f3', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'h5', to: 'f3' });
                  setLastMove({ from: 'h5', to: 'f3' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 2000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 3) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setIsComplete(true);
            setMessage('Отлично! Конь на f6 защищает пункт f7 — детский мат отражён!');
            saveStars(7, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      }

      if (exercise === 1) {
        // Сценарий: Детский мат — 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('e7' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'e7', to: 'e5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'e7', to: 'e5' });
                  setLastMove({ from: 'e7', to: 'e5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('b8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'b8', to: 'c6', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'b8', to: 'c6' });
                  setLastMove({ from: 'b8', to: 'c6' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'd1' && to === 'h5' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('g8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'g8', to: 'f6', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'g8', to: 'f6' });
                  setLastMove({ from: 'g8', to: 'f6' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 3) {
          if (from === 'h5' && to === 'f7' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Мат! Детский мат выполнен! Ферзь забрал пешку на f7, король не может выбраться из-под шаха. Самый быстрый путь к победе — атака на пункт f7!');
            saveStars(1, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }


      } else if (exercise === 2) {
        // Exercise 2: Scholar's Mate — moves 2 and 3 (Bc4/Qh5) in ANY order
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('e7' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'e7', to: 'e5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'e7', to: 'e5' });
                  setLastMove({ from: 'e7', to: 'e5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }

        // Moves 1-2: Bc4 and Qh5 in any order
        if (whiteMoves >= 1 && whiteMoves <= 2) {
          const isBc4 = from === 'f1' && to === 'c4' && move.piece === 'b';
          const isQh5 = from === 'd1' && to === 'h5' && move.piece === 'q';

          if (!isBc4 && !isQh5) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }

          // Check we don't repeat the same move
          if (whiteMoves === 2) {
            const devCount =
              (!!g.get('c4') && g.get('c4')?.type === 'b' && g.get('c4')?.color === 'w' ? 1 : 0) +
              (!!g.get('h5') && g.get('h5')?.type === 'q' && g.get('h5')?.color === 'w' ? 1 : 0);
            if (devCount !== 2) {
              handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
              return;
            }
          }

          setGame(new Chess(g.fen()));
          setHintVisible(false);
          setSelectedSquare(null);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            if (whiteMoves === 1) {
              // After first development move, black plays Nc6
              const ghostPiece = g.get('b8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'b8', to: 'c6', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'b8', to: 'c6' });
                  setLastMove({ from: 'b8', to: 'c6' });
                  setGame(new Chess(g.fen()));
                }, 200);
              } else {
                g.move({ from: 'b8', to: 'c6' });
                setLastMove({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
              }
            } else if (whiteMoves === 2) {
              // After second development move, black plays Nf6
              const ghostPiece = g.get('g8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'g8', to: 'f6', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'g8', to: 'f6' });
                  setLastMove({ from: 'g8', to: 'f6' });
                  setGame(new Chess(g.fen()));
                }, 200);
              } else {
                g.move({ from: 'g8', to: 'f6' });
                setLastMove({ from: 'g8', to: 'f6' });
                setGame(new Chess(g.fen()));
              }
            }
          }, 1000);
          return;
        }

        if (whiteMoves === 3) {
          if (from === 'h5' && to === 'f7' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Мат! Детский mat выполнен! Вы самостоятельно повторили атаку на пункт f7!');
            saveStars(2, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      } else if (exercise === 3) {
        // Exercise 3: Scholar's Mate variant — 1.e4 e5 2.Bc4 Nc6 3.Qf3 Bc5 4.Qxf7#
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('e7' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'e7', to: 'e5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'e7', to: 'e5' });
                  setLastMove({ from: 'e7', to: 'e5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('b8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'b8', to: 'c6', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'b8', to: 'c6' });
                  setLastMove({ from: 'b8', to: 'c6' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'd1' && to === 'f3' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('f8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'f8', to: 'c5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'f8', to: 'c5' });
                  setLastMove({ from: 'f8', to: 'c5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 3) {
          if (from === 'f3' && to === 'f7' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Мат! Ферзь забрал пешку на f7. Детский mat через поле f3 выполнен!');
            saveStars(3, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      } else if (exercise === 4) {
        // Exercise 4: Scholar's Mate через Qf3 — ходы 2-3 (Bc4/Qf3) в ЛЮБОМ порядке
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const ghostPiece = g.get('e7' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'e7', to: 'e5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'e7', to: 'e5' });
                  setLastMove({ from: 'e7', to: 'e5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              }
            }, 1000);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }

        // Moves 1-2: Bc4 и Qf3 в любом порядке
        if (whiteMoves >= 1 && whiteMoves <= 2) {
          const isBc4 = from === 'f1' && to === 'c4' && move.piece === 'b';
          const isQf3 = from === 'd1' && to === 'f3' && move.piece === 'q';

          if (!isBc4 && !isQf3) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }

          // На ходе 2 проверяем, что обе развивающие фигуры на местах
          if (whiteMoves === 2) {
            const devCount =
              (!!g.get('c4') && g.get('c4')?.type === 'b' && g.get('c4')?.color === 'w' ? 1 : 0) +
              (!!g.get('f3') && g.get('f3')?.type === 'q' && g.get('f3')?.color === 'w' ? 1 : 0);
            if (devCount !== 2) {
              handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
              return;
            }
          }

          setGame(new Chess(g.fen()));
          setHintVisible(false);
          setSelectedSquare(null);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            if (whiteMoves === 1) {
              // После первого развивающего хода — Nc6
              const ghostPiece = g.get('b8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'b8', to: 'c6', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'b8', to: 'c6' });
                  setLastMove({ from: 'b8', to: 'c6' });
                  setGame(new Chess(g.fen()));
                }, 200);
              } else {
                g.move({ from: 'b8', to: 'c6' });
                setLastMove({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
              }
            } else if (whiteMoves === 2) {
              // После второго развивающего хода — Bc5
              const ghostPiece = g.get('f8' as any);
              if (ghostPiece) {
                setOpponentAnimatingMove({ from: 'f8', to: 'c5', piece: { type: ghostPiece.type.toUpperCase(), color: ghostPiece.color as 'w' | 'b' } });
                setTimeout(() => {
                  setOpponentAnimatingMove(null);
                  g.move({ from: 'f8', to: 'c5' });
                  setLastMove({ from: 'f8', to: 'c5' });
                  setGame(new Chess(g.fen()));
                }, 200);
              } else {
                g.move({ from: 'f8', to: 'c5' });
                setLastMove({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
              }
            }
          }, 1000);
          return;
        }

        if (whiteMoves === 3) {
          if (from === 'f3' && to === 'f7' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setHintVisible(false);
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Мат! Детский mat через Qf3 выполнен! Вы сами нашли путь к победе через пункт f7!');
            saveStars(4, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            return;
          }
        }
      }

    } catch {
      // Invalid move
    }
  }, [game, whiteMoves, onComplete, saveStars, exercise]);

const handleSquareClick = useCallback((square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w' && exercise !== 5 && exercise !== 6 && exercise !== 7 && exercise !== 8) return;

    const piece = g.get(square as any);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      // Switch selection before processing move
      if (piece && ((exercise === 5 || exercise === 6 || exercise === 7 || exercise === 8) ? piece.color === 'b' : piece.color === 'w')) {
        setSelectedSquare(square);
        return;
      }
      processWhiteMove(selectedSquare, square);
    } else {
      if (piece && ((exercise === 5 || exercise === 6 || exercise === 7 || exercise === 8) ? piece.color === 'b' : piece.color === 'w')) {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processWhiteMove, exercise]);

  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w' && exercise !== 5 && exercise !== 6 && exercise !== 7 && exercise !== 8) return;
    const piece = g.get(square as any);
    if (!piece) return;
    if ((exercise === 5 || exercise === 6 || exercise === 7 || exercise === 8) && piece.color !== 'b') return;
    if (exercise !== 5 && exercise !== 6 && exercise !== 7 && exercise !== 8 && piece.color !== 'w') return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, square, moved: false, pointerId: e.pointerId };
  }, [game, exercise]);

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
          processWhiteMove(start.square, targetSquare);
        }
        setDragPiece(null);
    setPromotionPending(null);
      }
      pointerStartRef.current = null;
    };

    const handleGlobalCancel = (e: PointerEvent) => {
      if (pointerStartRef.current && e.pointerId === pointerStartRef.current.pointerId) {
        setDragPiece(null);
    setPromotionPending(null);
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
  }, [game, processWhiteMove]);

  // ──── PROMOTION ────
  const handlePromotion = useCallback((pieceCode: string) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    processWhiteMove(from, to, pieceCode);
  }, [promotionPending, processWhiteMove]);

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

  const turnText = game ? (game.turn() === 'w' ? 'Ваш ход (белые)' : 'Ход чёрных...') : '';

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN */}
      <div className="hidden lg:flex w-full lg:w-[300px] flex-shrink-0 flex-col gap-2">
        <div className="hidden lg:grid grid-cols-8 gap-1 rounded p-1 border border-gray-200">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
            const earnedStars = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earnedStars > 0;
            return (
              <button
                key={num}
                onClick={() => switchExercise(num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)}
                className={`flex items-center justify-center px-1 py-1 rounded transition ${
                  isCurrent
                    ? 'bg-blue-500 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                } cursor-pointer hover:brightness-110`}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(s => (
                    <StarPng key={s} filled={earnedStars > 0 && s <= earnedStars} size={14} />
                  ))}
                </div>
                <span className="ml-1 text-xs font-medium">{num}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={reset}
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition w-full justify-center"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Mobile: Avatar + speech bubble */}
        <div className="flex lg:hidden items-start gap-2 w-full max-w-sm">
          <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <AvatarBubble className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              {exercise === 1 && whiteMoves === 0 ? 'Детский мат. Сыграйте e2-e4 — захватите центр пешкой.' :
               exercise === 1 && whiteMoves === 1 ? 'Сыграйте слоном с f1 на c4 — направьте слона на поле f7.' :
               exercise === 1 && whiteMoves === 2 ? 'Выведите ферзя на h5 — угрожайте матом на f7.' :
               exercise === 1 && whiteMoves === 3 ? 'Заберите ферзем пешку на f7 — мат!' :
               exercise === 2 ? 'Повторите детский мат.' :
           exercise === 3 && whiteMoves === 0 ? 'Сыграйте e2-e4 — захватите центр пешкой.' :
           exercise === 3 && whiteMoves === 1 ? 'Сыграйте слоном с f1 на c4 — направьте слона на поле f7.' :
           exercise === 3 && whiteMoves === 2 ? 'Выведите ферзя на f3 — угрожайте матом на f7.' :
           exercise === 3 && whiteMoves === 3 ? 'Заберите ферзем пешку на f7 — мат!' :
               exercise === 4 ? 'Самостоятельно: e4, Bc4/Qf3 в любом порядке, Qxf7#' :
               exercise === 5 ? 'Сыграйте конём на f6 — защитите пункт h5 от детского мата!' :
               exercise === 6 ? 'Самостоятельно: сыграйте e5, Nf6 — защититесь от детского мата!' : ''}
            </p>
          </AvatarBubble>
        </div>

        {/* Desktop hint banner */}
        <div className="hidden lg:block px-6 py-3 rounded-xl text-center font-bold text-white bg-[#C9A84C] mb-2 w-full">
          {exercise === 1 && whiteMoves === 0 ? 'Детский мат. Сыграйте e2-e4 — захватите центр пешкой.' :
           exercise === 1 && whiteMoves === 1 ? 'Сыграйте слоном с f1 на c4 — направьте слона на поле f7.' :
           exercise === 1 && whiteMoves === 2 ? 'Выведите ферзя на h5 — угрожайте матом на f7.' :
           exercise === 1 && whiteMoves === 3 ? 'Заберите ферзем пешку на f7 — мат!' :
           exercise === 2 ? 'Повторите детский мат.' :
           exercise === 3 && whiteMoves === 0 ? 'Сыграйте e2-e4 — захватите центр пешкой.' :
               exercise === 3 && whiteMoves === 1 ? 'Сыграйте слоном с f1 на c4 — направьте слона на поле f7.' :
               exercise === 3 && whiteMoves === 2 ? 'Выведите ферзя на f3 — угрожайте матом на f7.' :
               exercise === 3 && whiteMoves === 3 ? 'Заберите ферзем пешку на f7 — мат!' :
           exercise === 4 ? 'Самостоятельно: e4, Bc4/Qf3 в любом порядке, Qxf7#' :
           exercise === 5 ? 'Сыграйте конём на f6 — защитите пункт h5 от детского мата!' :
           exercise === 6 ? 'Самостоятельно: сыграйте e5, Nf6 — защититесь от детского мата!' : ''}
        </div>

        {/* Board */}
        <div className="flex justify-center w-full relative" style={{ minHeight: 8 * sqSize }}>
          <div className="relative" style={{ width: 8 * sqSize + 6, height: 8 * sqSize + 6 }}>
            <UniversalChessBoardDesigner
              isReversed={isReversed}
              fen={game?.fen() || ''}
              selectedSquare={selectedSquare}
              lastMove={lastMove}
              autoValidMoves={true}
              onMove={async (from, to, _promotion) => { await processWhiteMove(from, to, undefined, true); }}
              onSquareClick={handleSquareClick}
              playerAnimatingMove={playerAnimatingMove}
              playerAnimatingMoves={playerAnimatingMoves}
              opponentAnimatingMove={opponentAnimatingMove}
              opponentAnimatingMoves={opponentAnimatingMoves}
              interactive={!isComplete && !isFail}
              disableAutoGhost={true}
              sqSize={sqSize}
            />
            {/* Hint arrows SVG overlay */}
            {hintVisible && !isFail && !isComplete && !selectedSquare && (
              (() => {
                const arrows = HINTS[exercise] || [];
                const phaseArrows = arrows.filter(a => a.phase === whiteMoves);
                if (phaseArrows.length === 0) return null;
                return (
                  <svg className="absolute pointer-events-none z-[35]" style={{ top: 3, left: 3, width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                    {phaseArrows.map((arrow, i) => {
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
        </div>

        {/* Fail banner */}
        {isFail && (
          <div className="w-full">
            <div className="bg-[#A63838] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">Попробуйте снова</p>
              <button
                onClick={reset}
                className="bg-white text-[#2C241B] font-bold text-base px-6 py-2 rounded shadow hover:bg-gray-100 transition"
              >
                ЕЩЁ РАЗ
              </button>
            </div>
          </div>
        )}

        {/* Success banner */}
        {isComplete && (
          <div className="w-full">
            <div className="bg-[#4A7A3A] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">Верно!</p>
              <div className="flex justify-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </div>
            </div>
          </div>
        )}

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

      </div>
    </div>
  );
}

