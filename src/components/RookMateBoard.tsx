'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Eye, Trophy } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

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
    <img
      src={`/pieces/cburnett/${pieceKey}.svg`}
      alt=""
      className="w-full h-full"
      draggable={false}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
    />
  );
}

function getBlackKingMove(game: Chess): { from: string; to: string } | null {
  const moves = game.moves({ verbose: true }).filter(m => m.piece === 'k');
  if (moves.length === 0) return null;

  const squares = game.board();
  let rookPos: { row: number; col: number } | null = null;
  let whiteKingPos: { row: number; col: number } | null = null;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = squares[r][c];
      if (p && p.type === 'r' && p.color === 'w') {
        rookPos = { row: r, col: c };
      }
      if (p && p.type === 'k' && p.color === 'w') {
        whiteKingPos = { row: r, col: c };
      }
    }
  }

  const scored = moves.map(m => {
    const toRow = RANKS.indexOf(m.to[1]);
    const toCol = FILES.indexOf(m.to[0]);
    let score = 0;

    // 1. ГЛАВНОЕ — держаться в ЦЕНТРЕ доски
    const centerDist = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
    score -= centerDist * 50;

    // 2. Штраф за край доски
    const isEdge = (toRow === 0 || toRow === 7 || toCol === 0 || toCol === 7);
    if (isEdge) score -= 200;

    // 3. Штраф за угол
    const isCorner = ((toRow === 0 || toRow === 7) && (toCol === 0 || toCol === 7));
    if (isCorner) score -= 300;

    // 4. Увеличить расстояние до белого короля
    if (whiteKingPos) {
      const distToWK = Math.max(Math.abs(toRow - whiteKingPos.row), Math.abs(toCol - whiteKingPos.col));
      score += distToWK * 30;
    }

    // 5. Увеличить расстояние до ладьи
    if (rookPos) {
      const distToRook = Math.max(Math.abs(toRow - rookPos.row), Math.abs(toCol - rookPos.col));
      score += distToRook * 15;
      // Не стоять на одной линии с ладьёй (под боем)
      if (toRow === rookPos.row || toCol === rookPos.col) {
        score -= 100;
      }
    }

    // 6. Если можно съесть ладью — отличный ход
    if (m.captured && m.captured === 'r') score += 1000;

    return { move: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0] ? { from: scored[0].move.from, to: scored[0].move.to } : null;
}

function calcStars(ex: Exercise, whiteMoves: number): number {
  if (ex.timeLimit) return 3;
  if (whiteMoves <= ex.minMoves3) return 3;
  if (whiteMoves <= ex.minMoves2) return 2;
  return 1;
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

/* ═══════════════════════════════════════════════════════════════
   DRAG STATE
   ═══════════════════════════════════════════════════════════════ */
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

export default function RookMateBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [currentExercise, setCurrentExercise] = useState<ExerciseId>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoComment, setDemoComment] = useState('');
  const [sqSize, setSqSize] = useState(52);
  const [isComplete, setIsComplete] = useState(false);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [whiteMoves, setWhiteMoves] = useState(0);
  const [isStalemate, setIsStalemate] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStalemateRef = useRef(false);

  // Drag state
  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);
  const isCompleteRef = useRef(false);
  const demoModeRef = useRef(false);
  const mountedRef = useRef(true);

  const storageKey = lessonId ? `rookmate_progress_${lessonId}` : 'rookmate_progress';

  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { demoModeRef.current = demoMode; }, [demoMode]);
  useEffect(() => { isStalemateRef.current = isStalemate; }, [isStalemate]);

  // Clear timer on game end
  useEffect(() => {
    if ((isComplete || isStalemate) && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isComplete, isStalemate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setExerciseStars(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  // Initialize game on first mount
  useEffect(() => {
    if (!game) {
      const ex = EXERCISES.find(e => e.id === currentExercise)!;
      setGame(new Chess(ex.fen));
    }
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
    const ex = EXERCISES.find(e => e.id === currentExercise)!;
    setGame(new Chess(ex.fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setDemoMode(false);
    setDemoStep(0);
    setDemoComment('');
    setIsComplete(false);
    setIsStalemate(false);
    setWhiteMoves(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setTimerStarted(false);
    setTimeLeft(null);
  }, [currentExercise]);

  const switchExercise = useCallback((id: ExerciseId) => {
    if (id === currentExercise) return;
    const ex = EXERCISES.find(e => e.id === id)!;
    setCurrentExercise(id);
    setGame(new Chess(ex.fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setDemoMode(false);
    setDemoStep(0);
    setDemoComment('');
    setIsComplete(false);
    setIsStalemate(false);
    setWhiteMoves(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setTimerStarted(false);
    setTimeLeft(null);
  }, [currentExercise]);

  const saveStars = useCallback((id: ExerciseId, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [id]: Math.max(prev[id] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  // Demo auto-play
  useEffect(() => {
    if (!demoMode || !currentExercise) return;
    const ex = EXERCISES.find(e => e.id === currentExercise)!;
    if (demoStep >= ex.demoMoves.length) {
      setDemoMode(false);
      setDemoComment('Мат чёрному королю!');
      setTimeout(() => { if (mountedRef.current) setDemoComment(''); }, 3000);
      return;
    }
    const move = ex.demoMoves[demoStep];
    setDemoComment(move.comment);
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      setGame(prev => {
        if (!prev) return null;
        const g = new Chess(prev.fen());
        g.move({ from: move.from, to: move.to });
        setLastMove({ from: move.from, to: move.to });
        return g;
      });
      setDemoStep(s => s + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [demoMode, demoStep, currentExercise]);

  // ═══════════════════════════════════════════════════════════════
  // GAME LOGIC (handle white move + black AI response)
  // ═══════════════════════════════════════════════════════════════
  const processWhiteMove = useCallback((from: string, to: string, promotionPiece?: string) => {
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;

    try {
      const piece = g.get(from as any);
      const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
      if (isPromotion && !promotionPiece) {
        setPromotionPending({ from, to });
        return;
      }
      const move = g.move({ from, to, promotion: promotionPiece });
      if (!move) return;
      setLastMove({ from, to });

      const fenAfter = g.fen();
      const nextWhiteMoves = whiteMoves + 1;
      setGame(new Chess(fenAfter));
      setSelectedSquare(null);
      setMessage('');
      setWhiteMoves(nextWhiteMoves);

      const ex = EXERCISES.find(e => e.id === currentExercise)!;

      // Start timer on first white move in exercises with timeLimit
      if (ex.timeLimit && !timerStarted && nextWhiteMoves === 1) {
        setTimeLeft(ex.timeLimit);
        setTimerStarted(true);
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === null || prev <= 1) {
              // Time's up — stop timer and show fail
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
              setIsStalemate(true);
              setMessage('Провалено');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      if (g.isCheckmate()) {
        const earned = calcStars(ex, nextWhiteMoves);
        setMessage(`Мат чёрному королю! ${earned} ★`);
        setIsComplete(true);
        saveStars(currentExercise, earned);
        if (currentExercise === 7) onComplete();
        return;
      }

      if (g.isStalemate()) {
        setIsStalemate(true);
        setMessage(ex.timeLimit ? 'Пат. Провалено.' : 'Пат. Провалено.');
        return;
      }

      if (g.isDraw()) {
        setMessage('Ничья! Начните заново.');
        return;
      }

      // Black's turn — AI move
      const delayMs = ex.matIn1 ? 1000 : 500;
      setTimeout(() => {
        if (!mountedRef.current) return;
        const blackMove = getBlackKingMove(g);
        if (blackMove) {
          g.move({ from: blackMove.from, to: blackMove.to });
        setLastMove({ from: blackMove.from, to: blackMove.to });
          const fenAfterBlack = g.fen();
          setGame(new Chess(fenAfterBlack));

          // If black king captured the white rook → instant fail
          const squaresAfterBlack = g.board();
          let rookExists = false;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const p = squaresAfterBlack[r][c];
              if (p && p.type === 'r' && p.color === 'w') {
                rookExists = true;
              }
            }
          }
          if (!rookExists) {
            setIsStalemate(true);
            setMessage('Провалено');
            return;
          }

          if (g.isCheckmate()) {
            const earned = calcStars(ex, nextWhiteMoves);
            setMessage(`Мат чёрному королю! ${earned} ★`);
            setIsComplete(true);
            saveStars(currentExercise, earned);
            if (currentExercise === 7) onComplete();
          } else if (ex.matIn1) {
            setIsStalemate(true);
            setMessage('Провалено');
          } else if (ex.matIn2 && nextWhiteMoves >= 2) {
            setIsStalemate(true);
            setMessage('Провалено');
          }
          // For matIn2 with nextWhiteMoves === 1: do nothing, wait for 2nd white move
        } else {
          if (g.isCheckmate()) {
            const earned = calcStars(ex, nextWhiteMoves);
            setMessage(`Мат чёрному королю! ${earned} ★`);
            setIsComplete(true);
            saveStars(currentExercise, earned);
            if (currentExercise === 7) onComplete();
          } else if (g.isStalemate()) {
            setIsStalemate(true);
            setMessage('Пат. Провалено.');
          } else if (ex.matIn1 || (ex.matIn2 && nextWhiteMoves >= 2)) {
            setIsStalemate(true);
            setMessage('Провалено');
          } else if (ex.matIn2) {
            // matIn2, black has no legal move after 1st white move — wait for white's 2nd move
          } else {
            setMessage('Ничья! Начните заново.');
          }
        }
      }, delayMs);
    } catch {
      // Invalid move
    }
  }, [game, whiteMoves, currentExercise, saveStars, onComplete]);

  // ═══════════════════════════════════════════════════════════════
  // CLICK HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handleSquareClick = useCallback((square: string) => {
    if (demoModeRef.current || isCompleteRef.current || isStalemateRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;

    const piece = g.get(square as any);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      processWhiteMove(selectedSquare, square);
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    } else {
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processWhiteMove]);

  // ═══════════════════════════════════════════════════════════════
  // DRAG AND DROP (pointer events)
  // ═══════════════════════════════════════════════════════════════
  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (isCompleteRef.current || demoModeRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;
    const piece = g.get(square as any);
    if (!piece || piece.color !== 'w') return;
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

  const currentEx = EXERCISES.find(e => e.id === currentExercise)!;
  const earned = exerciseStars[currentExercise] || 0;
  const turnText = game ? (game.turn() === 'w' ? 'Ваш ход (белые)' : 'Ход чёрных...') : '';

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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                      <div className="flex gap-[1px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
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

      {/* CENTER COLUMN: board + stats */}
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

{/* Promotion panel */}
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
                  onClick={() => handlePromotion(code)}
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
                    src={`/pieces/cburnett/promotionPending.from[1] === '2' ? 'b' : 'w'${code.toUpperCase()}.svg`}
                    alt={name}
                    draggable={false}
                    style={{ width: '70%', height: '70%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}


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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                      <div className="flex gap-[1px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
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
