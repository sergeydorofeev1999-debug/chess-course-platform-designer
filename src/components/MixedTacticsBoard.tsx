'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

const START_FEN_1 = '8/4k3/8/2pn2b1/3p4/3P2P1/1P2K3/5R2 w - - 0 1';
const START_FEN_2 = 'k7/8/2n5/8/1P6/8/4B3/1K6 w - - 0 1';
const START_FEN_3 = 'r4rk1/pp3p1p/1n2q1p1/4p3/2P1P3/P6P/BP2QPP1/R2R2K1 w - - 0 1';
const START_FEN_4 = '3R1bk1/5ppp/1N6/pp2P3/8/1P2r2P/P5PK/8 w - - 0 1';
const START_FEN_5 = '2r3k1/5ppp/8/8/8/7P/2B1nPP1/2R4K w - - 0 1';
const START_FEN_6 = '5k2/1q5p/p3p1p1/4bp2/1P2p3/P3P3/2Q1BPPP/6K1 w - - 0 1';
const START_FEN_7 = 'r4k1r/pp1b1ppp/3P4/q7/1nPNQ3/4P2P/3N1PP1/4KB1R w K - 0 1';
const START_FEN_8 = '6k1/p5pp/1pq1pp2/8/4N3/4P1P1/PP3PBP/6K1 w - - 0 1';
const START_FEN_9 = '3r3r/pp3Rpk/4p1p1/6Q1/2q1N1P1/3nP2P/8/3R2K1 w - - 0 1';
const START_FEN_10 = '2kr3r/pp3ppp/4p3/2Np2q1/3P4/4P2P/PP3PP1/2R2RK1 w - - 0 1';
const START_FEN_11 = 'rnb1k2r/ppp2ppp/3q4/b3N3/3Pp3/2P5/PP1B1PPP/R2QKB1R w KQkq - 0 1';
const START_FEN_12 = '4r2r/ppQqk1b1/2p5/6Pp/2BP1B1P/2P5/PP3P2/2K5 w - - 0 1';

const HINTS: Record<number, { from: string; to: string; phase: 0 | 1 | 2 }[]> = {
  1: [{ from: 'f1', to: 'f5', phase: 0 }, { from: 'f5', to: 'g5', phase: 1 }],
  2: [{ from: 'e2', to: 'f3', phase: 0 }, { from: 'b4', to: 'b5', phase: 1 }, { from: 'f3', to: 'c6', phase: 2 }],
  3: [{ from: 'c4', to: 'c5', phase: 0 }, { from: 'c5', to: 'b6', phase: 1 }],
  4: [{ from: 'b6', to: 'd7', phase: 0 }, { from: 'd7', to: 'f8', phase: 1 }],
  5: [{ from: 'c2', to: 'h7', phase: 0 }, { from: 'c1', to: 'c8', phase: 1 }],
  6: [{ from: 'c2', to: 'c5', phase: 0 }, { from: 'c5', to: 'e5', phase: 1 }],
  7: [{ from: 'e4', to: 'e7', phase: 0 }, { from: 'e7', to: 'd7', phase: 1 }],
  8: [{ from: 'e4', to: 'f6', phase: 0 }, { from: 'g2', to: 'c6', phase: 1 }],
  9: [{ from: 'c5', to: 'e6', phase: 0 }, { from: 'e6', to: 'g5', phase: 1 }],
  10: [{ from: 'd1', to: 'a4', phase: 0 }, { from: 'a4', to: 'a5', phase: 1 }],
  11: [{ from: 'e4', to: 'f6', phase: 0 }, { from: 'f6', to: 'd7', phase: 1 }],
  12: [{ from: 'c5', to: 'e7', phase: 0 }, { from: 'c5', to: 'd6', phase: 1 }],
};

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

function PieceImg({ type, color, className = '' }: { type: string; color: 'w' | 'b'; className?: string }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <div
      className={`w-full h-full bg-contain bg-center bg-no-repeat ${className}`}
      draggable={false}
      style={{
        backgroundImage: `url(/pieces/cburnett/${pieceKey}.svg)`,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
      }}
    />
  );
}

function GhostOverlay({
  move,
  sqSize,
  animClass,
}: {
  move: { from: string; to: string; piece: string; color: 'w' | 'b' } | null;
  sqSize: number;
  animClass: string;
}) {
  if (!move) return null;
  const fromF = FILES.indexOf(move.from[0]);
  const fromR = RANKS.indexOf(move.from[1]);
  const toF = FILES.indexOf(move.to[0]);
  const toR = RANKS.indexOf(move.to[1]);
  const dx = (toF - fromF) * sqSize;
  const dy = (toR - fromR) * sqSize;
  const size = Math.round(sqSize * 0.85);
  const pad = Math.round(sqSize * 0.075);
  return (
    <div
      className={`absolute pointer-events-none ${animClass}`}
      style={{
        left: fromF * sqSize + pad,
        top: fromR * sqSize + pad,
        width: size,
        height: size,
        zIndex: 40,
        ['--ghost-dx' as any]: `${dx}px`,
        ['--ghost-dy' as any]: `${dy}px`,
      }}
    >
      <PieceImg type={move.piece} color={move.color} />
    </div>
  );
}

function getBlackKingMove(game: Chess): { from: string; to: string } | null {
  const moves = game.moves({ verbose: true }).filter(m => m.piece === 'k' && m.color === 'b');
  if (moves.length === 0) return null;
  const idx = Math.floor(Math.random() * moves.length);
  return { from: moves[idx].from, to: moves[idx].to };
}

function getBestBlackCapture(game: Chess): { from: string; to: string } | null {
  const pieceValues: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 };
  const blackCaptures = game.moves({ verbose: true }).filter(m => m.color === 'b' && m.captured);
  const safeCaptures: typeof blackCaptures = [];
  for (const m of blackCaptures) {
    const testGame = new Chess(game.fen());
    testGame.move({ from: m.from, to: m.to });
    const whiteRecaptures = testGame.moves({ verbose: true }).filter(wm => wm.color === 'w' && wm.to === m.to);
    if (whiteRecaptures.length === 0) {
      safeCaptures.push(m);
    }
  }
  if (safeCaptures.length > 0) {
    safeCaptures.sort((a, b) => (pieceValues[b.captured || 'p'] || 0) - (pieceValues[a.captured || 'p'] || 0));
    return safeCaptures[0];
  }
  return null;
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

export default function MixedTacticsBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isFail, setIsFail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [whiteMoves, setWhiteMoves] = useState(0);
  const [sqSize, setSqSize] = useState(52);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [hintVisible, setHintVisible] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: string; color: 'w' | 'b' } | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: string; color: 'w' | 'b' } | null>(null);

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);

  const storageKey = lessonId ? `mixed_progress_${lessonId}` : 'mixed_progress';

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

  const handleHint = useCallback(() => {
    setHintVisible(prev => !prev);
  }, []);

  const reset = useCallback(() => {
    const fen = exercise === 1 ? START_FEN_1 : exercise === 2 ? START_FEN_2 : exercise === 3 ? START_FEN_3 : exercise === 4 ? START_FEN_4 : exercise === 5 ? START_FEN_5 : exercise === 6 ? START_FEN_6 : exercise === 7 ? START_FEN_7 : exercise === 8 ? START_FEN_8 : exercise === 9 ? START_FEN_9 : exercise === 10 ? START_FEN_10 : exercise === 11 ? START_FEN_11 : START_FEN_12;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
  }, [exercise]);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) => {
    setExercise(num);
    setHintVisible(false);
    const fen = num === 1 ? START_FEN_1 : num === 2 ? START_FEN_2 : num === 3 ? START_FEN_3 : num === 4 ? START_FEN_4 : num === 5 ? START_FEN_5 : num === 6 ? START_FEN_6 : num === 7 ? START_FEN_7 : num === 8 ? START_FEN_8 : num === 9 ? START_FEN_9 : num === 10 ? START_FEN_10 : num === 11 ? START_FEN_11 : START_FEN_12;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
  }, []);

  const triggerOpponentGhost = useCallback((g: Chess, from: string, to: string) => {
    const piece = g.get(from as any);
    if (piece) {
      setOpponentAnimatingMove({ from, to, piece: piece.type.toUpperCase(), color: 'b' });
      setTimeout(() => setOpponentAnimatingMove(null), 220);
    }
  }, []);

  const processWhiteMove = useCallback((from: string, to: string, promotionPiece?: string) => {
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;

    const piece = g.get(from as any);
    if (piece) {
      setPlayerAnimatingMove({ from, to, piece: piece.type.toUpperCase(), color: piece.color as 'w' | 'b' });
      setTimeout(() => setPlayerAnimatingMove(null), 220);
    }

    try {
      const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
      if (isPromotion && !promotionPiece) {
        setPromotionPending({ from, to });
        return;
      }
      const move = g.move({ from, to, promotion: promotionPiece });
      if (!move) return;
      setLastMove({ from, to });

      const nextWhiteMoves = whiteMoves + 1;

      if (exercise === 1) {
        // EXERCISE 1: Fork — Rf1-f5 attacks Nd5 and Bg5, king defends, Rxg5
        const isCorrectFirst = from === 'f1' && to === 'f5' && move.piece === 'r';
        const isCorrectSecond = from === 'f5' && to === 'g5' && move.piece === 'r';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
                setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const preferred = kingMoves.filter((m: any) => m.to === 'd6' || m.to === 'e6');
            if (preferred.length > 0) {
              const km = preferred[Math.floor(Math.random() * preferred.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
              setLastMove({ from: km.from, to: km.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
            setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(1, 3);
          return;
        }
      } else if (exercise === 2) {
        // EXERCISE 2: Pin — Be2-f3 pins Nc6, king defends, b4-b5 push, king escapes, then Bxc6 (or b5xc6)
        const isCorrectFirst = from === 'e2' && to === 'f3' && move.piece === 'b';
        const isCorrectSecond = from === 'b4' && to === 'b5' && move.piece === 'p';
        const isCorrectThird = (from === 'f3' && to === 'c6' && move.piece === 'b') || (from === 'b5' && to === 'c6' && move.piece === 'p');

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
          setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const kingToB7 = kingMoves.find((m: any) => m.to === 'b7');
            if (kingToB7) {
              triggerOpponentGhost(g, kingToB7.from, kingToB7.to);
              g.move({ from: kingToB7.from, to: kingToB7.to });
            setLastMove({ from: kingToB7.from, to: kingToB7.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
       setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const preferred = ['c7', 'b6'];
            const escape = kingMoves.find((m: any) => preferred.includes(m.to));
            if (escape) {
              triggerOpponentGhost(g, escape.from, escape.to);
              g.move({ from: escape.from, to: escape.to });
       setLastMove({ from: escape.from, to: escape.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
         setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 2) {
          if (!isCorrectThird) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(2, 3);
          return;
        }
      } else if (exercise === 3) {
        // EXERCISE 3: Discovered attack — c4-c5 opens Ba2 on Qe6, queen escapes, then c5xb6
        const isCorrectFirst = from === 'c4' && to === 'c5' && move.piece === 'p';
        const isCorrectSecond = from === 'c5' && to === 'b6' && move.piece === 'p' && move.captured === 'n';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
        setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const queenMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'q');
            const preferred = ['f6', 'c6', 'e7'];
            const escape = queenMoves.find((m: any) => preferred.includes(m.to));
            if (escape) {
              triggerOpponentGhost(g, escape.from, escape.to);
              g.move({ from: escape.from, to: escape.to });
 setLastMove({ from: escape.from, to: escape.to });
            } else if (queenMoves.length > 0) {
              const qm = queenMoves[Math.floor(Math.random() * queenMoves.length)];
              triggerOpponentGhost(g, qm.from, qm.to);
              g.move({ from: qm.from, to: qm.to });
            setLastMove({ from: qm.from, to: qm.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(3, 3);
          return;
        }
      } else if (exercise === 4) {
        // EXERCISE 4: Knight Nd7+ discovers Rd8 attack on Bf8, g7-g6, then Rxf8 or Nxf8
        const isCorrectFirst = from === 'b6' && to === 'd7' && move.piece === 'n';
        const isCorrectSecond = (from === 'd8' && to === 'f8' && move.piece === 'r') || (from === 'd7' && to === 'f8' && move.piece === 'n');

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
          setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const pawnMove = g.moves({ verbose: true }).find((m: any) => m.color === 'b' && m.piece === 'p' && m.from === 'g7' && m.to === 'g6');
            if (pawnMove) {
              triggerOpponentGhost(g, pawnMove.from, pawnMove.to);
              g.move({ from: pawnMove.from, to: pawnMove.to });
          setLastMove({ from: pawnMove.from, to: pawnMove.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(4, 3);
          return;
        }
      } else if (exercise === 5) {
        // EXERCISE 5: Sacrifice — Bc2xh7+ Kxh7, then Rc1xc8
        const isCorrectFirst = from === 'c2' && to === 'h7' && move.piece === 'b';
        const isCorrectSecond = from === 'c1' && to === 'c8' && move.piece === 'r';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
        setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingCap = g.moves({ verbose: true }).find((m: any) => m.color === 'b' && m.piece === 'k' && m.to === 'h7');
            if (kingCap) {
              triggerOpponentGhost(g, kingCap.from, kingCap.to);
              g.move({ from: kingCap.from, to: kingCap.to });
        setLastMove({ from: kingCap.from, to: kingCap.to });
              setGame(new Chess(g.fen()));
            }
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(5, 3);
          return;
        }
      } else if (exercise === 6) {
        // EXERCISE 6: Queen check — Qc2-c5+ discovers Be2 on Qb7, king escapes, then Qxe5
        const isCorrectFirst = from === 'c2' && to === 'c5' && move.piece === 'q';
        const isCorrectSecond = from === 'c5' && to === 'e5' && move.piece === 'q' && move.captured === 'b';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
            setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const preferred = ['f7', 'e8'];
            const escape = kingMoves.find((m: any) => preferred.includes(m.to));
            if (escape) {
              triggerOpponentGhost(g, escape.from, escape.to);
              g.move({ from: escape.from, to: escape.to });
     setLastMove({ from: escape.from, to: escape.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
      setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(6, 3);
          return;
        }
      } else if (exercise === 7) {
        // EXERCISE 7: Check — Qe4-e7+ forces king to g8, then Qxd7
        const isCorrectFirst = from === 'e4' && to === 'e7' && move.piece === 'q';
        const isCorrectSecond = from === 'e7' && to === 'd7' && move.piece === 'q';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
            setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const kingToG8 = kingMoves.find((m: any) => m.to === 'g8');
            if (kingToG8) {
              triggerOpponentGhost(g, kingToG8.from, kingToG8.to);
              g.move({ from: kingToG8.from, to: kingToG8.to });
        setLastMove({ from: kingToG8.from, to: kingToG8.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
              setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(7, 3);
          return;
        }
      } else if (exercise === 8) {
        // EXERCISE 8: Knight sacrifice — Ne4xf6+ gxf6, then Bg2xc6
        const isCorrectFirst = from === 'e4' && to === 'f6' && move.piece === 'n';
        const isCorrectSecond = from === 'g2' && to === 'c6' && move.piece === 'b';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
              setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const pawnCap = g.moves({ verbose: true }).find((m: any) => m.color === 'b' && m.piece === 'p' && m.from === 'g7' && m.to === 'f6');
            if (pawnCap) {
              triggerOpponentGhost(g, pawnCap.from, pawnCap.to);
              g.move({ from: pawnCap.from, to: pawnCap.to });
          setLastMove({ from: pawnCap.from, to: pawnCap.to });
              setGame(new Chess(g.fen()));
            }
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(8, 3);
          return;
        }
      } else if (exercise === 9) {
        // EXERCISE 9: Mate in 1 — Ne4-f6# discovered check from Qg5
        if (from === 'e4' && to === 'f6' && move.piece === 'n') {
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Мат! Отлично!');
          saveStars(9, 3);
        } else {
          setTimeout(() => {
            if (!mountedRef.current) return;
            const cap = getBestBlackCapture(g);
            if (cap) {
              triggerOpponentGhost(g, cap.from, cap.to);
              g.move({ from: cap.from, to: cap.to });
            setLastMove({ from: cap.from, to: cap.to });
              setGame(new Chess(g.fen()));
            }
            setIsFail(true);
            setMessage('Провалено');
          }, 1000);
          setSelectedSquare(null);
        }
        return;
      } else if (exercise === 10) {
        // EXERCISE 10: Nxe6 or Ne4 clears c-file check, king escapes, then Nxg5
        const isCorrectFirst = (from === 'c5' && to === 'e6' && move.piece === 'n') || (from === 'c5' && to === 'e4' && move.piece === 'n');
        const isCorrectSecond = (from === 'e6' && to === 'g5' && move.piece === 'n') || (from === 'e4' && to === 'g5' && move.piece === 'n');

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
        setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const preferred = ['d7', 'b8'];
            const escape = kingMoves.find((m: any) => preferred.includes(m.to));
            if (escape) {
              triggerOpponentGhost(g, escape.from, escape.to);
              g.move({ from: escape.from, to: escape.to });
      setLastMove({ from: escape.from, to: escape.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
        setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(10, 3);
          return;
        }
      } else if (exercise === 11) {
        // EXERCISE 11: Queen move — Qd1-a4, king escapes to f8, then Qxa5
        const isCorrectFirst = from === 'd1' && to === 'a4' && move.piece === 'q';
        const isCorrectSecond = from === 'a4' && to === 'a5' && move.piece === 'q';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const cap = getBestBlackCapture(g);
              if (cap) {
                triggerOpponentGhost(g, cap.from, cap.to);
                g.move({ from: cap.from, to: cap.to });
            setLastMove({ from: cap.from, to: cap.to });
                setGame(new Chess(g.fen()));
              }
              setIsFail(true);
              setMessage('Провалено');
            }, 1000);
            setSelectedSquare(null);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
            const kingToF8 = kingMoves.find((m: any) => m.to === 'f8');
            if (kingToF8) {
              triggerOpponentGhost(g, kingToF8.from, kingToF8.to);
              g.move({ from: kingToF8.from, to: kingToF8.to });
         setLastMove({ from: kingToF8.from, to: kingToF8.to });
            } else if (kingMoves.length > 0) {
              const km = kingMoves[Math.floor(Math.random() * kingMoves.length)];
              triggerOpponentGhost(g, km.from, km.to);
              g.move({ from: km.from, to: km.to });
          setLastMove({ from: km.from, to: km.to });
            }
            setGame(new Chess(g.fen()));
          }, 1000);

          setMessage('');
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setSelectedSquare(null);
            setIsFail(true);
            setMessage('Провалено');
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Тактика выполнена.');
          saveStars(11, 3);
          return;
        }
      } else if (exercise === 12) {
        // EXERCISE 12: Mate in 1 — Bf4-d6#
        if (from === 'f4' && to === 'd6' && move.piece === 'b') {
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Мат! Отлично!');
          saveStars(12, 3);
        } else {
          setTimeout(() => {
            if (!mountedRef.current) return;
            const cap = getBestBlackCapture(g);
            if (cap) {
              triggerOpponentGhost(g, cap.from, cap.to);
              g.move({ from: cap.from, to: cap.to });
          setLastMove({ from: cap.from, to: cap.to });
              setGame(new Chess(g.fen()));
            }
            setIsFail(true);
            setMessage('Провалено');
          }, 1000);
          setSelectedSquare(null);
        }
        return;
      }
    } catch {
      // Invalid move
    }
  }, [game, whiteMoves, exercise, saveStars]);

const handleSquareClick = useCallback((square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;

    const piece = g.get(square as any);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
        return;
      }
      processWhiteMove(selectedSquare, square);
    } else {
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processWhiteMove]);

  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
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

  const turnText = game ? (game.turn() === 'w' ? 'Ваш ход (белые)' : 'Ход чёрных...') : '';


const getExerciseHint = (ex: number) => {
    switch (ex) {
      case 1: return 'Белая ладья атакует сразу две фигуры. Найди лучший ход!';
      case 2: return 'Белый слон может связать черного коня. Найди лучший ход!';
      case 3: return 'Белая пешка может открыть нападение на ферзя. Найди лучший ход!';
      case 4: return 'Белый конь может вскрыть нападение на фигуру. Найди лучший ход!';
      case 5: return 'Белый слон может пожертвовать себя на h7. Найди лучший ход!';
      case 6: return 'Белый ферзь может вскрыть нападение на ферзя. Найди лучший ход!';
      case 7: return 'Белый ферзь может поставить шах и забирать фигуру. Найди лучший ход!';
      case 8: return 'Белый конь может пожертвовать себя за ферзя. Найди лучший ход!';
      case 9: return 'Белый конь может поставить мат в 1 ход. Найди лучший ход!';
      case 10: return 'Белый конь может вскрыть шах и нападение. Найди лучший ход!';
      case 11: return 'Белый ферзь может атаковать фигуру. Найди лучший ход!';
      case 12: return 'Белый слон может поставить мат в 1 ход. Найди лучший ход!';
      default: return '';
    }
  };

const getExerciseGoal = (ex: number) => {
    switch (ex) {
      case 1: return 'Найдите двойной удар ладьёй и заберите фигуру.';
      case 2: return 'Свяжите коня слоном, сделайте нажим пешкой и заберите коня.';
      case 3: return 'Вскройте нападение пешкой и заберите фигуру.';
      case 4: return 'Вскройте нападение конём и заберите фигуру.';
      case 5: return 'Пожертвуйте слона на h7, затем заберите ладью.';
      case 6: return 'Вскройте шах ферзём и заберите слона.';
      case 7: return 'Поставьте шах ферзём на e7, затем заберите слона на d7.';
      case 8: return 'Пожертвуйте коня на f6, затем заберите ферзя слоном.';
      case 9: return 'Конём вскройте шах и поставьте мат.';
      case 10: return 'Вскройте шах конём, затем заберите ферзя.';
      case 11: return 'Вскройте двойное нападение и заберите фигуру.';
      case 12: return 'Поставьте мат слоном.';
      default: return '';
    }
  };
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
              Найдите лучший ход!\n            </p>
          </div>
        </div>

        {/* Exercise pills */}
        <div className="w-full flex flex-col gap-[1px]">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((num) => {
            const earned = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={num}
                onClick={() => { if (!isCurrent) switchExercise(num as 1); }}
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
          <span className="text-xs font-bold text-[var(--text-primary)]">Задание {exercise} из 12</span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 12) * 100}%` }} />
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
                Найдите лучший ход!
              </p>
            </div>
          </div>
        </div>

        {/* Fail banner */}
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
                      cursor: pieceObj && pieceObj.color === 'w' && !isFail && !isComplete ? 'grab' : 'default',
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
                    {pieceObj && !isDragSource && !(playerAnimatingMove && sq === playerAnimatingMove.from) && (
                      <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                        <PieceImg type={pieceObj.type} color={pieceObj.color} />
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          {/* Ghost piece overlays */}
          <GhostOverlay move={playerAnimatingMove} sqSize={sqSize} animClass="animate-player-move" />
          <GhostOverlay move={opponentAnimatingMove} sqSize={sqSize} animClass="animate-opponent-move" />

          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && !dragPiece && (
            (() => {
              const arrows = HINTS[exercise] || [];
              const phaseArrows = arrows.filter(a => a.phase === whiteMoves);
              if (phaseArrows.length === 0) return null;
              return (
                <svg className="absolute inset-0 pointer-events-none z-[35]" style={{ width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                  {phaseArrows.map((arrow, i) => {
                    const fromF = FILES.indexOf(arrow.from[0]);
                    const fromR = RANKS.indexOf(arrow.from[1]);
                    const toF = FILES.indexOf(arrow.to[0]);
                    const toR = RANKS.indexOf(arrow.to[1]);
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

{/* Promotion panel */}


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





        {/* Mobile exercise pills — 2 rows of 6 */}
        <div className="flex lg:hidden flex-col gap-[1px] w-full">
          <div className="flex w-full items-stretch gap-[1px]">
            {[1,2,3,4,5,6].map((num) => {
              const earned = exerciseStars[num] || 0;
              const isCurrent = num === exercise;
              const isDone = earned > 0;
              const isLocked = !isCurrent && !isDone;
              return (
                <button
                  key={num}
                  onClick={() => { if (!isCurrent) switchExercise(num as 1); }}
                  disabled={isCurrent}
                  className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
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
          <div className="flex w-full items-stretch gap-[1px]">
            {[7,8,9,10,11,12].map((num) => {
              const earned = exerciseStars[num] || 0;
              const isCurrent = num === exercise;
              const isDone = earned > 0;
              const isLocked = !isCurrent && !isDone;
              return (
                <button
                  key={num}
                  onClick={() => { if (!isCurrent) switchExercise(num as 1); }}
                  disabled={isCurrent}
                  className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
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
        </div>

        {/* Mobile progress + buttons row */}
        <div className="flex lg:hidden flex-col gap-2 w-full">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[var(--text-primary)]">Задание {exercise} из 12</span>
            <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 12) * 100}%` }} />
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
            {exercise < 12 && (
              <button
                onClick={() => switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)}
                className="bg-blue-500 text-white font-bold text-base px-6 py-2 rounded shadow hover:bg-blue-600 transition"
              >
                Перейти к Упражнению {exercise + 1} →
              </button>
            )}
            {exercise === 12 && (exerciseStars[12] || 0) >= 3 && (
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

