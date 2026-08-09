'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

const START_FEN_1 = '5q2/6pp/8/1k6/8/5N2/6PP/5RK1 w - - 0 1';
const START_FEN_2 = '5k2/3q2pp/8/8/8/5N2/6PP/5RK1 w - - 0 1';
const START_FEN_3 = '2k4r/1pp2r2/p7/4P3/3B4/2N5/PP6/1K1R4 w - - 0 1';
const START_FEN_4 = '8/2p1r1pk/3n2p1/8/4N1P1/1P4KP/8/4R3 w - - 0 1';
const START_FEN_5 = '1k5r/p1pq2p1/1p5p/5R2/6Q1/6P1/PP3PKP/8 w - - 0 1';
const START_FEN_6 = '8/1kp3rp/1p4p1/4R3/1P6/1b5P/1B3PP1/6K1 w - - 0 1';


const HINTS: Record<number, { from: string; to: string; phase: 0 | 1 }[]> = {
  1: [{ from: 'f3', to: 'd4', phase: 0 }, { from: 'f1', to: 'f8', phase: 1 }],
  2: [{ from: 'f3', to: 'e5', phase: 0 }, { from: 'e5', to: 'd7', phase: 1 }],
  3: [{ from: 'e5', to: 'e6', phase: 0 }, { from: 'd4', to: 'h8', phase: 1 }],
  4: [{ from: 'e4', to: 'd6', phase: 0 }, { from: 'e1', to: 'e7', phase: 1 }],
  5: [{ from: 'f5', to: 'f8', phase: 0 }, { from: 'g4', to: 'd7', phase: 1 }],
  6: [{ from: 'e5', to: 'e3', phase: 0 }, { from: 'e3', to: 'b3', phase: 1 }],
};

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

export default function DiscoveredAttackBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
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

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);

  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' }; } | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' }; } | null>(null);

  const storageKey = lessonId ? `discovered_attack_progress_${lessonId}` : 'discovered_attack_progress';

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
    const fen = exercise === 1 ? START_FEN_1 : exercise === 2 ? START_FEN_2 : exercise === 3 ? START_FEN_3 : exercise === 4 ? START_FEN_4 : exercise === 5 ? START_FEN_5 : START_FEN_6;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
  }, [exercise]);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6) => {
    setExercise(num);
    setHintVisible(false);
    const fen = num === 1 ? START_FEN_1 : num === 2 ? START_FEN_2 : num === 3 ? START_FEN_3 : num === 4 ? START_FEN_4 : num === 5 ? START_FEN_5 : START_FEN_6;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
  }, []);

  const processWhiteMove = useCallback((from: string, to: string, promotionPiece?: string, skipAnimation?: boolean) => {
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

      // Validate on copy
      const testGame = new Chess(g.fen());
      const testMove = testGame.move({ from, to, promotion: promotionPiece });
      if (!testMove) return;

      // Apply the real move IMMEDIATELY (like MateInTwoBoard)
      const realMove = g.move({ from, to, promotion: promotionPiece });
      if (!realMove) return;
      setGame(new Chess(g.fen()));
      setSelectedSquare(null);
      setLastMove({ from, to });

      const fromSq = from;
      const toSq = to;

      if (skipAnimation) {
        // Drag path: no ghost, immediate processing
        const nextWhiteMoves = whiteMoves + 1;

        if (exercise === 1) {
          // EXERCISE 1: Discovered attack — Nf3-d4 check, black king escapes to c4, then Rf1xf8
          const isCorrectFirst = fromSq === 'f3' && toSq === 'd4' && realMove.piece === 'n';
          const isCorrectSecond = fromSq === 'f1' && toSq === 'f8' && realMove.piece === 'r';

          if (whiteMoves === 0) {
            if (!isCorrectFirst) {
              setTimeout(() => {
                if (!mountedRef.current) return;
                setIsFail(true);
                setMessage('Провалено');
              }, 1000);
              setSelectedSquare(null);
              return;
            }
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);

            setTimeout(() => {
              if (!mountedRef.current) return;
              // After Nd4+, black king escapes to c4
              const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
              const kingToC4 = kingMoves.find((m: any) => m.to === 'c4');
              let blackMove = null;
              if (kingToC4) {
                blackMove = kingToC4;
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              } else if (kingMoves.length > 0) {
                blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              }
              if (blackMove) {
                setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                setTimeout(() => setOpponentAnimatingMove(null), 200);
              }
              setGame(new Chess(g.fen()));
              setWhiteMoves(nextWhiteMoves);
            }, 1000);

            setMessage('Шах! Теперь заберите ферзя.');
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
            setMessage('Отлично! Вскрытое нападение выполнено.');
            saveStars(1, 3);
            return;
          }
        } else if (exercise === 2) {
          // EXERCISE 2: Discovered attack — Nf3-e5 check, black king escapes to e8, then Nxd7
          const isCorrectFirst = fromSq === 'f3' && toSq === 'e5' && realMove.piece === 'n';
          const isCorrectSecond = fromSq === 'e5' && toSq === 'd7' && realMove.piece === 'n' && realMove.captured === 'q';

          if (whiteMoves === 0) {
            if (!isCorrectFirst) {
              setTimeout(() => {
                if (!mountedRef.current) return;
                const cap = getBestBlackCapture(g);
                if (cap) {
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

            setTimeout(() => {
              if (!mountedRef.current) return;
              // After Ne5+, black king escapes to e8
              const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
              const preferredKingSquares = ['e8'];
              const preferred = kingMoves.find((m: any) => preferredKingSquares.includes(m.to));
              let blackMove = null;
              if (preferred) {
                blackMove = preferred;
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              } else if (kingMoves.length > 0) {
                blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              }
              if (blackMove) {
                setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                setTimeout(() => setOpponentAnimatingMove(null), 200);
              }
              setGame(new Chess(g.fen()));
              setWhiteMoves(nextWhiteMoves);
            }, 1000);

            setMessage('Шах! Теперь заберите ферзя.');
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
            setMessage('Отлично! Вскрытое нападение выполнено.');
            saveStars(2, 3);
            return;
          }
        } else if (exercise === 3) {
          // EXERCISE 3: Discovered attack — e5-e6 check, black king escapes to d7, then Rxh8
          const isCorrectFirst = fromSq === 'e5' && toSq === 'e6' && realMove.piece === 'p';
          const isCorrectSecond = fromSq === 'd4' && toSq === 'h8' && realMove.piece === 'r' && realMove.captured === 'r';

          if (whiteMoves === 0) {
            if (!isCorrectFirst) {
              setTimeout(() => {
                if (!mountedRef.current) return;
                const cap = getBestBlackCapture(g);
                if (cap) {
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

            setTimeout(() => {
              if (!mountedRef.current) return;
              // After e6+, black king escapes to d7
              const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
              const kingToD7 = kingMoves.find((m: any) => m.to === 'd7');
              let blackMove = null;
              if (kingToD7) {
                blackMove = kingToD7;
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              } else if (kingMoves.length > 0) {
                blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              }
              if (blackMove) {
                setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                setTimeout(() => setOpponentAnimatingMove(null), 200);
              }
              setGame(new Chess(g.fen()));
              setWhiteMoves(nextWhiteMoves);
            }, 1000);

            setMessage('Шах! Теперь заберите ладью.');
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
            setMessage('Отлично! Вскрытое нападение выполнено.');
            saveStars(3, 3);
            return;
          }
        } else if (exercise === 4) {
          // EXERCISE 4: Discovered attack — Rxe7+ check, black king escapes, then Rxh7
          const isCorrectFirst = fromSq === 'e1' && toSq === 'e7' && realMove.piece === 'r' && realMove.captured;
          const isCorrectSecond = fromSq === 'e7' && toSq === 'h7' && realMove.piece === 'r' && realMove.captured;

          if (whiteMoves === 0) {
            if (!isCorrectFirst) {
              setTimeout(() => {
                if (!mountedRef.current) return;
                const cap = getBestBlackCapture(g);
                if (cap) {
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

            setTimeout(() => {
              if (!mountedRef.current) return;
              // After Rxe7+, black king escapes (king moves)
              const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
              let blackMove = null;
              if (kingMoves.length > 0) {
                blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              }
              if (blackMove) {
                setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                setTimeout(() => setOpponentAnimatingMove(null), 200);
              }
              setGame(new Chess(g.fen()));
              setWhiteMoves(nextWhiteMoves);
            }, 1000);

            setMessage('Шах! Теперь заберите пешку.');
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
            setMessage('Отлично! Вскрытое нападение выполнено.');
            saveStars(4, 3);
            return;
          }
        } else if (exercise === 5) {
          // EXERCISE 5: Discovered attack — Re5-e1+ check, black king escapes to a8, then Qxh7
          const isCorrectFirst = fromSq === 'e5' && toSq === 'e1' && realMove.piece === 'r';
          const isCorrectSecond = fromSq === 'g4' && toSq === 'h7' && realMove.piece === 'q' && realMove.captured;

          if (whiteMoves === 0) {
            if (!isCorrectFirst) {
              setTimeout(() => {
                if (!mountedRef.current) return;
                const cap = getBestBlackCapture(g);
                if (cap) {
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

            setTimeout(() => {
              if (!mountedRef.current) return;
              // After Re1+, black king escapes to a8
              const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
              const kingToA8 = kingMoves.find((m: any) => m.to === 'a8');
              let blackMove = null;
              if (kingToA8) {
                blackMove = kingToA8;
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              } else if (kingMoves.length > 0) {
                blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              }
              if (blackMove) {
                setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                setTimeout(() => setOpponentAnimatingMove(null), 200);
              }
              setGame(new Chess(g.fen()));
              setWhiteMoves(nextWhiteMoves);
            }, 1000);

            setMessage('Шах! Теперь заберите пешку.');
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
            setMessage('Отлично! Вскрытое нападение выполнено.');
            saveStars(5, 3);
            return;
          }
        } else if (exercise === 6) {
          // EXERCISE 6: Discovered attack — Re5-e3, bishop attacks rook, then Rxe3 captures bishop
          const isCorrectFirst = fromSq === 'e5' && toSq === 'e3' && realMove.piece === 'r';
          const isCorrectSecond = fromSq === 'e3' && toSq === 'b3' && realMove.piece === 'r' && realMove.captured === 'b';

          if (whiteMoves === 0) {
            if (!isCorrectFirst) {
              setTimeout(() => {
                if (!mountedRef.current) return;
                const cap = getBestBlackCapture(g);
                if (cap) {
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

            setTimeout(() => {
              if (!mountedRef.current) return;
              // After Re3, black rook escapes from g7 to d7 or f7
              const rookMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'r' && m.from === 'g7');
              const preferredRookSquares = ['d7', 'f7'];
              const preferred = rookMoves.find((m: any) => preferredRookSquares.includes(m.to));
              let blackMove = null;
              if (preferred) {
                blackMove = preferred;
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              } else if (rookMoves.length > 0) {
                blackMove = rookMoves[Math.floor(Math.random() * rookMoves.length)];
                g.move({ from: blackMove.from, to: blackMove.to });
                setLastMove({ from: blackMove.from, to: blackMove.to });
              }
              if (blackMove) {
                setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                setTimeout(() => setOpponentAnimatingMove(null), 200);
              }
              setGame(new Chess(g.fen()));
              setWhiteMoves(nextWhiteMoves);
            }, 1000);

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
            setMessage('Отлично! Вскрытое нападение выполнено.');
            saveStars(6, 3);
            return;
          }
        }
      } else {
        // Click path: ghost animation + exercise logic after 200ms
        setPlayerAnimatingMove({ from: fromSq, to: toSq, piece: { type: realMove.piece.toUpperCase(), color: 'w' } });
        setTimeout(() => {
          setPlayerAnimatingMove(null);
          setLastMove({ from: fromSq, to: toSq });
          const nextWhiteMoves = whiteMoves + 1;

          if (exercise === 1) {
            // EXERCISE 1: Discovered attack — Nf3-d4 check, black king escapes to c4, then Rf1xf8
            const isCorrectFirst = fromSq === 'f3' && toSq === 'd4' && realMove.piece === 'n';
            const isCorrectSecond = fromSq === 'f1' && toSq === 'f8' && realMove.piece === 'r';

            if (whiteMoves === 0) {
              if (!isCorrectFirst) {
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  setIsFail(true);
                  setMessage('Провалено');
                }, 1000);
                setSelectedSquare(null);
                return;
              }
              setGame(new Chess(g.fen()));
              setSelectedSquare(null);

              setTimeout(() => {
                if (!mountedRef.current) return;
                // After Nd4+, black king escapes to c4
                const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
                const kingToC4 = kingMoves.find((m: any) => m.to === 'c4');
                let blackMove = null;
                if (kingToC4) {
                  blackMove = kingToC4;
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                } else if (kingMoves.length > 0) {
                  blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                }
                if (blackMove) {
                  setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                  setTimeout(() => setOpponentAnimatingMove(null), 200);
                }
                setGame(new Chess(g.fen()));
                setWhiteMoves(nextWhiteMoves);
              }, 1000);

              setMessage('Шах! Теперь заберите ферзя.');
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
              setMessage('Отлично! Вскрытое нападение выполнено.');
              saveStars(1, 3);
              return;
            }
          } else if (exercise === 2) {
            // EXERCISE 2: Discovered attack — Nf3-e5 check, black king escapes to e8, then Nxd7
            const isCorrectFirst = fromSq === 'f3' && toSq === 'e5' && realMove.piece === 'n';
            const isCorrectSecond = fromSq === 'e5' && toSq === 'd7' && realMove.piece === 'n' && realMove.captured === 'q';

            if (whiteMoves === 0) {
              if (!isCorrectFirst) {
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  const cap = getBestBlackCapture(g);
                  if (cap) {
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

              setTimeout(() => {
                if (!mountedRef.current) return;
                // After Ne5+, black king escapes to e8
                const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
                const preferredKingSquares = ['e8'];
                const preferred = kingMoves.find((m: any) => preferredKingSquares.includes(m.to));
                let blackMove = null;
                if (preferred) {
                  blackMove = preferred;
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                } else if (kingMoves.length > 0) {
                  blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                }
                if (blackMove) {
                  setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                  setTimeout(() => setOpponentAnimatingMove(null), 200);
                }
                setGame(new Chess(g.fen()));
                setWhiteMoves(nextWhiteMoves);
              }, 1000);

              setMessage('Шах! Теперь заберите ферзя.');
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
              setMessage('Отлично! Вскрытое нападение выполнено.');
              saveStars(2, 3);
              return;
            }
          } else if (exercise === 3) {
            // EXERCISE 3: Discovered attack — e5-e6 check, black king escapes to d7, then Rxh8
            const isCorrectFirst = fromSq === 'e5' && toSq === 'e6' && realMove.piece === 'p';
            const isCorrectSecond = fromSq === 'd4' && toSq === 'h8' && realMove.piece === 'r' && realMove.captured === 'r';

            if (whiteMoves === 0) {
              if (!isCorrectFirst) {
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  const cap = getBestBlackCapture(g);
                  if (cap) {
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

              setTimeout(() => {
                if (!mountedRef.current) return;
                // After e6+, black king escapes to d7
                const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
                const kingToD7 = kingMoves.find((m: any) => m.to === 'd7');
                let blackMove = null;
                if (kingToD7) {
                  blackMove = kingToD7;
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                } else if (kingMoves.length > 0) {
                  blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                }
                if (blackMove) {
                  setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                  setTimeout(() => setOpponentAnimatingMove(null), 200);
                }
                setGame(new Chess(g.fen()));
                setWhiteMoves(nextWhiteMoves);
              }, 1000);

              setMessage('Шах! Теперь заберите ладью.');
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
              setMessage('Отлично! Вскрытое нападение выполнено.');
              saveStars(3, 3);
              return;
            }
          } else if (exercise === 4) {
            // EXERCISE 4: Discovered attack — Rxe7+ check, black king escapes, then Rxh7
            const isCorrectFirst = fromSq === 'e1' && toSq === 'e7' && realMove.piece === 'r' && realMove.captured;
            const isCorrectSecond = fromSq === 'e7' && toSq === 'h7' && realMove.piece === 'r' && realMove.captured;

            if (whiteMoves === 0) {
              if (!isCorrectFirst) {
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  const cap = getBestBlackCapture(g);
                  if (cap) {
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

              setTimeout(() => {
                if (!mountedRef.current) return;
                // After Rxe7+, black king escapes (king moves)
                const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
                let blackMove = null;
                if (kingMoves.length > 0) {
                  blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                }
                if (blackMove) {
                  setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                  setTimeout(() => setOpponentAnimatingMove(null), 200);
                }
                setGame(new Chess(g.fen()));
                setWhiteMoves(nextWhiteMoves);
              }, 1000);

              setMessage('Шах! Теперь заберите пешку.');
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
              setMessage('Отлично! Вскрытое нападение выполнено.');
              saveStars(4, 3);
              return;
            }
          } else if (exercise === 5) {
            // EXERCISE 5: Discovered attack — Re5-e1+ check, black king escapes to a8, then Qxh7
            const isCorrectFirst = fromSq === 'e5' && toSq === 'e1' && realMove.piece === 'r';
            const isCorrectSecond = fromSq === 'g4' && toSq === 'h7' && realMove.piece === 'q' && realMove.captured;

            if (whiteMoves === 0) {
              if (!isCorrectFirst) {
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  const cap = getBestBlackCapture(g);
                  if (cap) {
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

              setTimeout(() => {
                if (!mountedRef.current) return;
                // After Re1+, black king escapes to a8
                const kingMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'k');
                const kingToA8 = kingMoves.find((m: any) => m.to === 'a8');
                let blackMove = null;
                if (kingToA8) {
                  blackMove = kingToA8;
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                } else if (kingMoves.length > 0) {
                  blackMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                }
                if (blackMove) {
                  setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                  setTimeout(() => setOpponentAnimatingMove(null), 200);
                }
                setGame(new Chess(g.fen()));
                setWhiteMoves(nextWhiteMoves);
              }, 1000);

              setMessage('Шах! Теперь заберите пешку.');
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
              setMessage('Отлично! Вскрытое нападение выполнено.');
              saveStars(5, 3);
              return;
            }
          } else if (exercise === 6) {
            // EXERCISE 6: Discovered attack — Re5-e3, bishop attacks rook, then Rxe3 captures bishop
            const isCorrectFirst = fromSq === 'e5' && toSq === 'e3' && realMove.piece === 'r';
            const isCorrectSecond = fromSq === 'e3' && toSq === 'b3' && realMove.piece === 'r' && realMove.captured === 'b';

            if (whiteMoves === 0) {
              if (!isCorrectFirst) {
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  const cap = getBestBlackCapture(g);
                  if (cap) {
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

              setTimeout(() => {
                if (!mountedRef.current) return;
                // After Re3, black rook escapes from g7 to d7 or f7
                const rookMoves = g.moves({ verbose: true }).filter((m: any) => m.color === 'b' && m.piece === 'r' && m.from === 'g7');
                const preferredRookSquares = ['d7', 'f7'];
                const preferred = rookMoves.find((m: any) => preferredRookSquares.includes(m.to));
                let blackMove = null;
                if (preferred) {
                  blackMove = preferred;
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                } else if (rookMoves.length > 0) {
                  blackMove = rookMoves[Math.floor(Math.random() * rookMoves.length)];
                  g.move({ from: blackMove.from, to: blackMove.to });
                  setLastMove({ from: blackMove.from, to: blackMove.to });
                }
                if (blackMove) {
                  setOpponentAnimatingMove({ from: blackMove.from, to: blackMove.to, piece: { type: blackMove.piece.toUpperCase(), color: 'b' } });
                  setTimeout(() => setOpponentAnimatingMove(null), 200);
                }
                setGame(new Chess(g.fen()));
                setWhiteMoves(nextWhiteMoves);
              }, 1000);

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
              setMessage('Отлично! Вскрытое нападение выполнено.');
              saveStars(6, 3);
              return;
            }
          }
        }, 200);
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
      processWhiteMove(selectedSquare, square, undefined, false);
    } else {
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processWhiteMove]);

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
    : [];

  const turnText = game ? (game.turn() === 'w' ? 'Ваш ход (белые)' : 'Ход чёрных...') : '';

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN */}
      <div className="w-full lg:w-[300px] flex-shrink-0 space-y-2">
        <div className="hidden lg:grid grid-cols-5 gap-1 rounded p-1 border border-gray-200">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const earnedStars = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earnedStars > 0;
            return (
              <button
                key={num}
                onClick={() => switchExercise(num as 1)}
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

        {/* Mobile avatar + speech bubble */}
        <div className="lg:hidden w-full flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
              <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
            </div>
            <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
              <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-3">
                Используйте вскрытое нападение, чтобы выиграть фигуру соперника.
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
        <div className="flex justify-center w-full relative" style={{ minHeight: 8 * sqSize }}>
          <UniversalChessBoardDesigner
            fen={game?.fen() || ''}
            selectedSquare={selectedSquare}
            lastMove={lastMove}
            autoValidMoves={true}
            onMove={(from, to, promotion) => processWhiteMove(from, to, promotion, true)}
            onSquareClick={handleSquareClick}
            playerAnimatingMove={playerAnimatingMove}
            opponentAnimatingMove={opponentAnimatingMove}
            interactive={!isComplete && !isFail}
            sqSize={sqSize}
            disableAutoGhost={true}
            onDragPieceChange={() => {}}
          />
          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && (
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
        </div>





        {/* Mobile exercise pills */}
        <div className="flex lg:hidden flex-wrap justify-center gap-1 w-full">
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
                className={`flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 w-12 ${
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
            <span className="text-xs font-bold text-[var(--text-primary)]">Задание {exercise} из 6</span>
            <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 6) * 100}%` }} />
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
            {exercise < 5 && (
              <button
                onClick={() => switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5)}
                className="bg-blue-500 text-white font-bold text-base px-6 py-2 rounded shadow hover:bg-blue-600 transition"
              >
                Перейти к Упражнению {exercise + 1} →
              </button>
            )}
            {exercise === 5 && (exerciseStars[5] || 0) >= 3 && (
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
