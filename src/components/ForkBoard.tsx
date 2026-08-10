'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const START_FEN_1 = '1n4k1/8/8/8/8/8/8/3R2K1 w - - 0 1';
const START_FEN_2 = '8/1k3r2/8/3p4/8/6P1/5PBP/6K1 w - - 0 1';
const START_FEN_3 = '8/ppk5/1qp5/7r/8/1Q4P1/5P1P/5RK1 w - - 0 1';
const START_FEN_4 = 'rnbqkb1r/pp2pppp/3p4/2p5/4n3/2P2N2/PP1PBPPP/RNBQK2R w KQkq - 0 1';
const START_FEN_5 = '3q1rk1/p1p2pp1/np5p/8/3P4/2P1b3/PP4PP/R2Q1R1K w - - 0 1';
const START_FEN_6 = '8/8/3k1r2/8/3PP3/8/8/K7 w - - 0 1';
const START_FEN_7 = 'rnbqk2r/ppp2ppp/3bpn2/3p4/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 1';

const START_FEN_8 = 'r3k3/8/8/3N4/8/8/8/7K w - - 0 1';
const START_FEN_9 = '2kr3r/pb1n1pp1/1pp3q1/5N2/2p1P1p1/2N3P1/PP3PB1/R1BQRK2 w - - 0 1';
const START_FEN_10 = 'r1bk1bnr/pp3ppp/1qn1p3/1N1p4/3P1B2/8/PPP2PPP/R2QKBNR w KQkq - 0 1';
const START_FEN_11 = '3k4/5p2/R2P4/3r4/PP1b3p/5KP1/6P1/8 w - - 0 1';
const START_FEN_12 = 'R7/3b1kp1/2p1n1Np/7P/P1PpB1r1/3P4/1r6/R4K2 w - - 0 1';

const FORK_HINTS: Record<number, { from: string; to: string; phase: 0 | 1 }[]> = {
  1: [
    { from: 'd1', to: 'd8', phase: 0 },
    { from: 'd8', to: 'b8', phase: 1 },
  ],
  2: [
    { from: 'g2', to: 'd5', phase: 0 },
    { from: 'd5', to: 'f7', phase: 1 },
  ],
  3: [
    { from: 'b3', to: 'f7', phase: 0 },
    { from: 'f7', to: 'h5', phase: 1 },
  ],
  4: [
    { from: 'd1', to: 'a4', phase: 0 },
    { from: 'a4', to: 'e4', phase: 1 },
  ],
  5: [
    { from: 'd1', to: 'd3', phase: 0 },
    { from: 'd3', to: 'a6', phase: 1 },
  ],
  6: [
    { from: 'e4', to: 'e5', phase: 0 },
    { from: 'e5', to: 'f6', phase: 1 },
  ],
  7: [
    { from: 'e4', to: 'e5', phase: 0 },
    { from: 'e5', to: 'f6', phase: 1 },
  ],
  8: [
    { from: 'd5', to: 'c7', phase: 0 },
    { from: 'c7', to: 'a8', phase: 1 },
  ],
  9: [
    { from: 'f5', to: 'e7', phase: 0 },
    { from: 'e7', to: 'g6', phase: 1 },
  ],
  10: [
    { from: 'f4', to: 'c7', phase: 0 },
    { from: 'c7', to: 'b6', phase: 1 },
  ],
  11: [
    { from: 'f3', to: 'e4', phase: 0 },
    { from: 'e4', to: 'd5', phase: 1 },
  ],
  12: [
    { from: 'g6', to: 'e5', phase: 0 },
    { from: 'e5', to: 'g4', phase: 1 },
  ],
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

function getWhiteRookSquare(game: Chess): string | null {
  const squares = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = squares[r][c];
      if (p && p.type === 'r' && p.color === 'w') {
        return `${FILES[c]}${RANKS[r]}`;
      }
    }
  }
  return null;
}

function getBlackKingMove(game: Chess): { from: string; to: string } | null {
  const moves = game.moves({ verbose: true }).filter(m => m.piece === 'k' && m.color === 'b');
  if (moves.length === 0) return null;
  const idx = Math.floor(Math.random() * moves.length);
  return { from: moves[idx].from, to: moves[idx].to };
}

function getBlackAutoCapture(game: Chess): { from: string; to: string } | null {
  const rookSq = getWhiteRookSquare(game);
  if (!rookSq) return null;
  const blackMoves = game.moves({ verbose: true }).filter(m => m.color === 'b');
  for (const m of blackMoves) {
    if (m.to === rookSq) {
      return { from: m.from, to: m.to };
    }
  }
  return null;
}

function getBlackAutoCaptureAny(game: Chess): { from: string; to: string } | null {
  const blackMoves = game.moves({ verbose: true }).filter(m => m.color === 'b');
  for (const m of blackMoves) {
    if (m.captured) {
      return { from: m.from, to: m.to };
    }
  }
  return null;
}

function getBlackSafeCapture(game: Chess): { from: string; to: string } | null {
  const blackMoves = game.moves({ verbose: true }).filter(m => m.color === 'b' && m.captured);
  for (const m of blackMoves) {
    const testGame = new Chess(game.fen());
    testGame.move({ from: m.from, to: m.to });
    const whiteRecaptures = testGame.moves({ verbose: true }).filter(
      wm => wm.color === 'w' && wm.to === m.to
    );
    if (whiteRecaptures.length === 0) {
      return { from: m.from, to: m.to };
    }
  }
  return null;
}

export default function ForkBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
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
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { isFailRef.current = isFail; }, [isFail]);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) => {
    setExercise(num);
    const fen = num === 1 ? START_FEN_1 : num === 2 ? START_FEN_2 : num === 3 ? START_FEN_3 : num === 4 ? START_FEN_4 : num === 5 ? START_FEN_5 : num === 6 ? START_FEN_6 : num === 7 ? START_FEN_7 : num === 8 ? START_FEN_8 : num === 9 ? START_FEN_9 : num === 10 ? START_FEN_10 : num === 11 ? START_FEN_11 : START_FEN_12;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
  }, []);

  useEffect(() => {
    if (isComplete && exercise < 12) {
      const timer = setTimeout(() => {
        switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, exercise, switchExercise]);

  const storageKey = lessonId ? `fork_progress_${lessonId}` : 'fork_progress';

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

  const reset = useCallback(() => {
    const fen = exercise === 1 ? START_FEN_1 : exercise === 2 ? START_FEN_2 : exercise === 3 ? START_FEN_3 : exercise === 4 ? START_FEN_4 : exercise === 5 ? START_FEN_5 : exercise === 6 ? START_FEN_6 : exercise === 7 ? START_FEN_7 : exercise === 8 ? START_FEN_8 : exercise === 9 ? START_FEN_9 : exercise === 10 ? START_FEN_10 : exercise === 11 ? START_FEN_11 : START_FEN_12;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
  }, [exercise]);

  const handleHint = useCallback(() => {
    setHintVisible(prev => !prev);
  }, []);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const animateBlackMove = useCallback((g: Chess, move: { from: string; to: string }) => {
    const piece = g.get(move.from as any);
    if (piece) {
      setOpponentAnimatingMove({
        from: move.from,
        to: move.to,
        piece: { type: piece.type.toUpperCase(), color: 'b' },
      });
    }
    g.move({ from: move.from, to: move.to });
    setLastMove({ from: move.from, to: move.to });
    setGame(new Chess(g.fen()));
    setTimeout(() => setOpponentAnimatingMove(null), 200);
  }, []);

  const processWhiteMove = useCallback((from: string, to: string) => {
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;

    try {
      const move = g.move({ from, to });
      if (!move) return;
      setLastMove({ from, to });

      const nextWhiteMoves = whiteMoves + 1;

      if (exercise === 1) {
        // EXERCISE 1: Rook fork (original)
        const isCorrectFirst = from === 'd1' && to === 'd8';
        const isCorrectSecond = from === 'd8' && to === 'b8';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const autoCap = getBlackAutoCapture(g);
              if (autoCap) {
                animateBlackMove(g, { from: autoCap.from, to: autoCap.to });
              }
              setGame(new Chess(g.fen()));
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          // Correct first move: animate opponent after 600ms pause + 200ms ghost
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const blackMove = getBlackKingMove(g);
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
              const autoCap = getBlackAutoCapture(g);
              if (autoCap) {
                animateBlackMove(g, { from: autoCap.from, to: autoCap.to });
                setIsFail(true);
                setMessage('Провалено');
                return;
              }
              setGame(new Chess(g.fen()));
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const autoCap = getBlackAutoCapture(g);
              if (autoCap) {
                animateBlackMove(g, { from: autoCap.from, to: autoCap.to });
              }
              setGame(new Chess(g.fen()));
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(1, 3);
          return;
        }
      } else if (exercise === 2) {
        // EXERCISE 2: Bishop fork
        const isCorrectFirst = from === 'g2' && to === 'd5' && move.piece === 'b';
        const isCorrectSecond = from === 'd5' && to === 'f7' && move.piece === 'b';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setGame(new Chess(g.fen()));
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setHintVisible(false);
          setWhiteMoves(nextWhiteMoves);

          setTimeout(() => {
            if (!mountedRef.current) return;
            const blackMove = getBlackKingMove(g);
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
              // Auto-capture check: if black can capture any white piece safely
              const autoCap = getBlackAutoCaptureAny(g);
              if (autoCap) {
                animateBlackMove(g, { from: autoCap.from, to: autoCap.to });
                setIsFail(true);
                setMessage('Провалено');
                return;
              }
              setGame(new Chess(g.fen()));
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(2, 3);
          return;
        }
      } else if (exercise === 3) {
        // EXERCISE 3: Queen fork
        const isCorrectFirst = from === 'b3' && to === 'f7' && move.piece === 'q';
        const isCorrectSecond = from === 'f7' && to === 'h5' && move.piece === 'q';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
            g.move({ from: safeCap.from, to: safeCap.to });
            setLastMove({ from: safeCap.from, to: safeCap.to });
          }
            setGame(new Chess(g.fen()));
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
            const blackMove = getBlackKingMove(g);
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
              const autoCap = getBlackSafeCapture(g);
              if (autoCap) {
                animateBlackMove(g, { from: autoCap.from, to: autoCap.to });
                setIsFail(true);
                setMessage('Провалено');
                return;
              }
              setGame(new Chess(g.fen()));
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(3, 3);
          return;
        }
      } else if (exercise === 4) {
        // EXERCISE 4: Queen fork (full board)
        const isCorrectFirst = from === 'd1' && to === 'a4' && move.piece === 'q';
        const isCorrectSecond = from === 'a4' && to === 'e4' && move.piece === 'q';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
           g.move({ from: safeCap.from, to: safeCap.to });
           setLastMove({ from: safeCap.from, to: safeCap.to });
         }
            setGame(new Chess(g.fen()));
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
            // Black must block check or move king
            const blackMoves = g.moves({ verbose: true }).filter(m => m.color === 'b');
            const kingMoves = blackMoves.filter(m => m.piece === 'k');
            const blockMoves = blackMoves.filter(m => m.piece !== 'k');
            
            let blackMove = null;
            if (blockMoves.length > 0) {
              // Prefer blocking with queen or knight
              const preferred = blockMoves.find(m => m.piece === 'q' || m.piece === 'n');
              blackMove = preferred || blockMoves[0];
            } else if (kingMoves.length > 0) {
              blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
            }
            
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(4, 3);
          return;
        }
      } else if (exercise === 5) {
        // EXERCISE 5: Queen fork — Qd3 or Qe2 double attack on Na6 and Be3
        const isCorrectFirst = (from === 'd1' && to === 'd3' && move.piece === 'q') || (from === 'd1' && to === 'e2' && move.piece === 'q');
        const isCorrectSecond = (from === 'd3' && to === 'a6' && move.piece === 'q') || (from === 'd3' && to === 'e3' && move.piece === 'q') || (from === 'e2' && to === 'a6' && move.piece === 'q') || (from === 'e2' && to === 'e3' && move.piece === 'q');

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
  g.move({ from: safeCap.from, to: safeCap.to });
  setLastMove({ from: safeCap.from, to: safeCap.to });
}
            setGame(new Chess(g.fen()));
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
            const blackMoves = g.moves({ verbose: true }).filter(m => m.color === 'b');
            const nonQueenMoves = blackMoves.filter(m => m.piece !== 'q');
            const blackMove = nonQueenMoves.length > 0 ? nonQueenMoves[Math.floor(Math.random() * nonQueenMoves.length)] : blackMoves[Math.floor(Math.random() * blackMoves.length)];
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(5, 3);
          return;
        }
      } else if (exercise === 6) {
        // EXERCISE 6: Pawn fork — e4-e5 attacks Kd6 and Rf6
        const isCorrectFirst = from === 'e4' && to === 'e5' && move.piece === 'p';
        const isCorrectSecond = from === 'e5' && to === 'f6' && move.piece === 'p';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
               g.move({ from: safeCap.from, to: safeCap.to });
               setLastMove({ from: safeCap.from, to: safeCap.to });
             }
            setGame(new Chess(g.fen()));
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
            const blackMove = getBlackKingMove(g);
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(6, 3);
          return;
        }
      } else if (exercise === 7) {
        // EXERCISE 7: Pawn fork — e4-e5 attacks Nf6 and Bd6
        const isCorrectFirst = from === 'e4' && to === 'e5' && move.piece === 'p';
        const isCorrectSecond = (from === 'e5' && to === 'f6' && move.piece === 'p') || (from === 'e5' && to === 'd6' && move.piece === 'p');

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
        g.move({ from: safeCap.from, to: safeCap.to });
        setLastMove({ from: safeCap.from, to: safeCap.to });
      }
            setGame(new Chess(g.fen()));
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
            const blackMoves = g.moves({ verbose: true }).filter(m => m.color === 'b' && m.to !== 'e5');
            const nonQueenMoves = blackMoves.filter(m => m.piece !== 'q');
            const blackMove = nonQueenMoves.length > 0 ? nonQueenMoves[Math.floor(Math.random() * nonQueenMoves.length)] : blackMoves[Math.floor(Math.random() * blackMoves.length)];
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(7, 3);
          return;
        }
      } else if (exercise === 8) {
        // EXERCISE 8: Knight fork — Nd5-c7+ attacks Ke8 and Ra8
        const isCorrectFirst = from === 'd5' && to === 'c7' && move.piece === 'n';
        const isCorrectSecond = from === 'c7' && to === 'a8' && move.piece === 'n';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
              g.move({ from: safeCap.from, to: safeCap.to });
              setLastMove({ from: safeCap.from, to: safeCap.to });
            }
            setGame(new Chess(g.fen()));
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
            const blackMove = getBlackKingMove(g);
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(8, 3);
          return;
        }
      } else if (exercise === 9) {
        // EXERCISE 9: Knight fork — Nf5-e7+ attacks Kc8 and Qg6, then Nxg6
        const isCorrectFirst = from === 'f5' && to === 'e7' && move.piece === 'n';
        const isCorrectSecond = from === 'e7' && to === 'g6' && move.piece === 'n';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
              g.move({ from: safeCap.from, to: safeCap.to });
              setLastMove({ from: safeCap.from, to: safeCap.to });
            }
            setGame(new Chess(g.fen()));
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
            const blackMove = getBlackKingMove(g);
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(9, 3);
          return;
        }
      } else if (exercise === 10) {
        // EXERCISE 10: Bishop fork — Bf4-c7+ attacks Qb6 and Nc6, then Bxb6
        const isCorrectFirst = from === 'f4' && to === 'c7' && move.piece === 'b';
        const isCorrectSecond = from === 'c7' && to === 'b6' && move.piece === 'b';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
              g.move({ from: safeCap.from, to: safeCap.to });
              setLastMove({ from: safeCap.from, to: safeCap.to });
            }
            setGame(new Chess(g.fen()));
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
            const blackMoves = g.moves({ verbose: true }).filter(m => m.color === 'b');
            const nonQueenMoves = blackMoves.filter(m => m.piece !== 'q');
            const blackMove = nonQueenMoves.length > 0 ? nonQueenMoves[Math.floor(Math.random() * nonQueenMoves.length)] : blackMoves[Math.floor(Math.random() * blackMoves.length)];
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(10, 3);
          return;
        }
      } else if (exercise === 11) {
        // EXERCISE 11: King fork — Kf3-e4 attacks Rd5 and Bd4
        const isCorrectFirst = from === 'f3' && to === 'e4' && move.piece === 'k';
        const isCorrectSecond = (from === 'e4' && to === 'd5' && move.piece === 'k') || (from === 'e4' && to === 'd4' && move.piece === 'k');

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
              g.move({ from: safeCap.from, to: safeCap.to });
              setLastMove({ from: safeCap.from, to: safeCap.to });
            }
            setGame(new Chess(g.fen()));
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
            const blackMoves = g.moves({ verbose: true }).filter(m => m.color === 'b');
            const nonQueenMoves = blackMoves.filter(m => m.piece !== 'q');
            const blackMove = nonQueenMoves.length > 0 ? nonQueenMoves[Math.floor(Math.random() * nonQueenMoves.length)] : blackMoves[Math.floor(Math.random() * blackMoves.length)];
            if (blackMove) {
              animateBlackMove(g, { from: blackMove.from, to: blackMove.to });
            }
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(11, 3);
          return;
        }
      } else if (exercise === 12) {
        // EXERCISE 12: Knight fork — Ng6-e5 attacks Rg4 and Re6, then Nxg4
        const isCorrectFirst = from === 'g6' && to === 'e5' && move.piece === 'n';
        const isCorrectSecond = from === 'e5' && to === 'g4' && move.piece === 'n';

        if (whiteMoves === 0) {
          if (!isCorrectFirst) {
            const isCheck = g.isCheck();
            if (isCheck) {
              const kingMoves = g.moves({ verbose: true }).filter(m => m.color === 'b' && m.piece === 'k');
              if (kingMoves.length > 0) {
                const kingMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                g.move({ from: kingMove.from, to: kingMove.to });
  setLastMove({ from: kingMove.from, to: kingMove.to });
                setGame(new Chess(g.fen()));
                setSelectedSquare(null);
                setIsFail(true);
                setMessage('Провалено');
                return;
              }
            }
            const safeCap = getBlackSafeCapture(g);
            if (safeCap) {
              g.move({ from: safeCap.from, to: safeCap.to });
              setLastMove({ from: safeCap.from, to: safeCap.to });
            }
            setGame(new Chess(g.fen()));
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
            g.move({ from: 'f7', to: 'e7' });
    setLastMove({ from: 'f7', to: 'e7' });
            setGame(new Chess(g.fen()));
          }, 600);
          return;
        }

        if (whiteMoves === 1) {
          if (!isCorrectSecond) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              const safeCap = getBlackSafeCapture(g);
              if (safeCap) {
                animateBlackMove(g, { from: safeCap.from, to: safeCap.to });
              }
              setSelectedSquare(null);
              setIsFail(true);
              setMessage('Провалено');
            }, 600);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Двойной удар выполнен.');
          saveStars(12, 3);
          return;
        }
      }
    } catch {
      // Invalid move
    }
  }, [game, whiteMoves, onComplete, saveStars, exercise]);

  const handleSquareClick = useCallback((square: string) => {
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
      setSelectedSquare(null);
    } else {
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processWhiteMove]);

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
              Поставьте двойной удар, а затем съешьте фигуру соперника.
            </p>
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
                onClick={() => { if (!isCurrent) switchExercise(num as 1|2|3|4|5|6|7|8|9|10|11|12); }}
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
                      <div className="flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                      <div className="flex gap-[1px]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-[2px] justify-center w-full">
                      {Array.from({ length: earned }, (_, s) => (
                        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
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
                Поставьте двойной удар, а затем съешьте фигуру соперника.
              </p>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex flex-col items-center w-full relative">
          <UniversalChessBoardDesigner
            fen={game?.fen() || ''}
            autoValidMoves={true}
            lastMove={lastMove}
            onMove={(from, to) => processWhiteMove(from, to)}
            interactive={!isComplete && !isFail}
            sqSize={sqSize}
            clickGhost={true}
            userColor="w"
            disableAutoGhost={true}
            opponentAnimatingMove={opponentAnimatingMove}
            onSelectionChange={(sq) => setSelectedSquare(sq)}
          />
          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && (
            (() => {
              const arrows = FORK_HINTS[exercise] || [];
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
        </div>

        {/* Feedback Banner */}
        {isFail && (
          <div className="w-full lg:max-w-sm mt-2 animate-slide-down">
            <div
              className="rounded-2xl flex flex-col items-center gap-2"
              style={{
                backgroundColor: '#A63838',
                boxShadow: '0 4px 16px rgba(166, 56, 56, 0.3)',
                padding: '20px 24px',
                borderRadius: '16px',
              }}
            >
              <p className="text-white font-bold text-center" style={{ fontSize: '18px' }}>
                Попробуйте снова
              </p>
              <button
                onClick={reset}
                className="font-bold hover:brightness-110 transition mx-auto"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#2C241B',
                  fontSize: '16px',
                  fontWeight: 700,
                  borderRadius: '12px',
                  height: '48px',
                  lineHeight: '48px',
                  textAlign: 'center',
                  border: 'none',
                  padding: '0 32px',
                  textTransform: 'uppercase',
                }}
              >
                ЕЩЁ РАЗ
              </button>
            </div>
          </div>
        )}
        {isComplete && (
          <div className="w-full lg:max-w-sm mt-2">
            <div
              className="rounded-2xl flex flex-col items-center gap-2"
              style={{
                backgroundColor: '#4A7A3A',
                boxShadow: '0 4px 16px rgba(74, 122, 58, 0.3)',
                padding: '18px 24px',
                borderRadius: '16px',
              }}
            >
              <p className="text-white font-semibold" style={{ fontSize: '18px' }}>Верно!</p>
              <p className="text-[#D4E8CC]" style={{ fontSize: '14px' }}>Переходим к следующему заданию</p>
              <button
                onClick={exercise === 12 ? onComplete : () => switchExercise((exercise + 1) as 1|2|3|4|5|6|7|8|9|10|11|12)}
                className="mt-1 font-semibold text-sm px-5 py-2 rounded-xl shadow hover:brightness-110 transition"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#4A7A3A',
                  borderRadius: '12px',
                }}
              >
                {exercise === 12 ? 'Завершить урок ✓' : 'Далее →'}
              </button>
            </div>
          </div>
        )}

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
                  onClick={() => { if (!isCurrent) switchExercise(num as 1|2|3|4|5|6|7|8|9|10|11|12); }}
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
                  onClick={() => { if (!isCurrent) switchExercise(num as 1|2|3|4|5|6|7|8|9|10|11|12); }}
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
      </div>
    </div>
  );
}
