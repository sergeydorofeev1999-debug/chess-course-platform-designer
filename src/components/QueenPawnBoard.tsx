'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, ChevronRight, Star, Trophy, Eye, Undo2 } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];

type Piece = { type: string; color: 'w' | 'b' };
type Difficulty = 'easy' | 'medium' | 'hard';

function parseFen(fen: string): Record<string, Piece> {
  const squares: Record<string, Piece> = {};
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  for (let ri = 0; ri < 8; ri++) {
    let fi = 0;
    for (const ch of rows[ri]) {
      if (ch >= '1' && ch <= '8') {
        fi += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        squares[`${FILES[fi]}${RANKS[ri]}`] = { type: ch.toLowerCase(), color };
        fi++;
      }
    }
  }
  return squares;
}

function squaresToFen(squares: Record<string, Piece>): string {
  let rows = '';
  for (let ri = 0; ri < 8; ri++) {
    let empty = 0;
    for (let fi = 0; fi < 8; fi++) {
      const sq = `${FILES[fi]}${RANKS[ri]}`;
      const p = squares[sq];
      if (p) {
        if (empty > 0) { rows += empty; empty = 0; }
        rows += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
      } else {
        empty++;
      }
    }
    if (empty > 0) rows += empty;
    if (ri < 7) rows += '/';
  }
  return rows + ' w - - 0 1';
}

function squareToCoords(square: string, sqSize: number): { x: number; y: number } {
  const ff = FILES.indexOf(square[0]);
  const fr = RANKS.indexOf(square[1]);
  return { x: ff * sqSize, y: fr * sqSize };
}

/* ═════════════════════════════════════════════════════════════════
   MOVE GENERATION
   ═════════════════════════════════════════════════════════════════ */

function getPawnMoves(square: string, squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): string[] {
  const ff = FILES.indexOf(square[0]);
  const fr = RANKS.indexOf(square[1]);
  const dir = color === 'w' ? -1 : 1;
  const valid: string[] = [];

  const r1 = fr + dir;
  if (r1 >= 0 && r1 < 8) {
    const f1 = `${FILES[ff]}${RANKS[r1]}`;
    if (!squares[f1]) valid.push(f1);
  }

  const startRank = color === 'w' ? 6 : 1;
  if (fr === startRank) {
    const r2 = fr + 2 * dir;
    if (r2 >= 0 && r2 < 8) {
      const f1 = `${FILES[ff]}${RANKS[r1]}`;
      const f2 = `${FILES[ff]}${RANKS[r2]}`;
      if (!squares[f1] && !squares[f2]) valid.push(f2);
    }
  }

  for (const df of [-1, 1]) {
    const fd = ff + df;
    if (fd >= 0 && fd < 8 && r1 >= 0 && r1 < 8) {
      const sq = `${FILES[fd]}${RANKS[r1]}`;
      const target = squares[sq];
      if (target && target.color !== color) valid.push(sq);
      if (enPassant && sq === enPassant) valid.push(sq);
    }
  }

  return valid;
}

function getQueenMoves(square: string, squares: Record<string, Piece>, color: 'w' | 'b'): string[] {
  const ff = FILES.indexOf(square[0]);
  const fr = RANKS.indexOf(square[1]);
  const valid: string[] = [];
  // Rook directions + Bishop directions
  const directions = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  for (const [df, dr] of directions) {
    for (let dist = 1; dist < 8; dist++) {
      const fdi = ff + df * dist;
      const rdi = fr + dr * dist;
      if (fdi < 0 || fdi >= 8 || rdi < 0 || rdi >= 8) break;
      const sq = `${FILES[fdi]}${RANKS[rdi]}`;
      const target = squares[sq];
      if (!target) {
        valid.push(sq);
      } else {
        if (target.color !== color) valid.push(sq);
        break;
      }
    }
  }

  return valid;
}

function getPieceMoves(square: string, squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): string[] {
  const p = squares[square];
  if (!p) return [];
  if (p.type === 'p') return getPawnMoves(square, squares, color, enPassant);
  if (p.type === 'q') return getQueenMoves(square, squares, color);
  return [];
}

function getAllMoves(squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): { from: string; to: string }[] {
  const moves: { from: string; to: string }[] = [];
  for (const sq in squares) {
    const p = squares[sq];
    if (p.color === color) {
      const mvs = getPieceMoves(sq, squares, color, enPassant);
      for (const to of mvs) moves.push({ from: sq, to });
    }
  }
  return moves;
}

function hasNoMoves(squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): boolean {
  return getAllMoves(squares, color, enPassant).length === 0;
}

/* ═════════════════════════════════════════════════════════════════
   MAKE MOVE
   ═════════════════════════════════════════════════════════════════ */

function makeMove(squares: Record<string, Piece>, enPassant: string | null, from: string, to: string): {
  squares: Record<string, Piece>;
  enPassant: string | null;
  captured: Piece | null;
  promoted: boolean;
} {
  const p = squares[from];
  if (!p) return { squares, enPassant: null, captured: null, promoted: false };

  const next: Record<string, Piece> = { ...squares };
  delete next[from];
  let captured = next[to] || null;

  if (p.type === 'p' && to === enPassant) {
    const ff = FILES.indexOf(from[0]);
    const tf = FILES.indexOf(to[0]);
    if (ff !== tf) {
      const captureSq = `${FILES[tf]}${from[1]}`;
      captured = next[captureSq] || captured;
      delete next[captureSq];
    }
  }

  delete next[to];

  const rank = to[1];
  if (p.type === 'p' && (rank === '8' || rank === '1')) {
    if (p.color === 'w' && rank === '8') {
      next[to] = { type: 'p', color: 'w' }; // white pawn stays until promotion chosen
    } else {
      next[to] = { type: 'q', color: p.color }; // black auto-promotes
    }
  } else {
    next[to] = p;
  }

  let newEnPassant: string | null = null;
  if (p.type === 'p') {
    const fromRank = parseInt(from[1]);
    const toRank = parseInt(to[1]);
    if (Math.abs(toRank - fromRank) === 2) {
      const epRank = p.color === 'w' ? (fromRank + 1).toString() : (fromRank - 1).toString();
      newEnPassant = `${from[0]}${epRank}`;
    }
  }

  return { squares: next, enPassant: newEnPassant, captured, promoted: p.type === 'p' && (rank === '8' || rank === '1') };
}

/* ═════════════════════════════════════════════════════════════════
   GAME STATE HELPERS
   ═════════════════════════════════════════════════════════════════ */

function hasPieces(squares: Record<string, Piece>, color: 'w' | 'b'): boolean {
  return Object.values(squares).some(p => p.color === color);
}

function hasExtraQueen(squares: Record<string, Piece>, color: 'w' | 'b'): boolean {
  // Check if there's more than 1 queen of this color (promotion happened)
  return Object.values(squares).filter(p => p.color === color && p.type !== 'p').length > 1;
}

/* ═════════════════════════════════════════════════════════════════
   AI ENGINE
   ═════════════════════════════════════════════════════════════════ */

function evaluatePosition(squares: Record<string, Piece>): number {
  if (!hasPieces(squares, 'w')) return 10000;
  if (!hasPieces(squares, 'b')) return -10000;

  let score = 0;

  for (const sq in squares) {
    const p = squares[sq];
    const rank = parseInt(sq[1]);
    const file = FILES.indexOf(sq[0]);

    if (p.color === 'w') {
      if (p.type === 'p') {
        score -= (rank - 1) * 40;
        if (Math.abs(file - 3.5) <= 1.5) score -= 30;
      } else if (p.type === 'q') {
        score -= 900;
      }
    } else {
      if (p.type === 'p') {
        score += (8 - rank) * 40;
        if (Math.abs(file - 3.5) <= 1.5) score += 30;
      } else if (p.type === 'q') {
        score += 900;
      }
    }
  }

  // Extra queen = promotion happened
  if (hasExtraQueen(squares, 'w')) score -= 5000;
  if (hasExtraQueen(squares, 'b')) score += 5000;

  const blackMoves = getAllMoves(squares, 'b', null).length;
  const whiteMoves = getAllMoves(squares, 'w', null).length;
  score += blackMoves * 5;
  score -= whiteMoves * 5;

  return score;
}

function minimax(
  squares: Record<string, Piece>,
  enPassant: string | null,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const evalScore = evaluatePosition(squares);
  if (Math.abs(evalScore) >= 9000 || depth === 0) return evalScore;

  const color = isMaximizing ? 'b' : 'w';
  const moves = getAllMoves(squares, color, enPassant);

  if (moves.length === 0) {
    return isMaximizing ? -10000 : 10000;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const result = makeMove(squares, enPassant, move.from, move.to);
      const eval_ = minimax(result.squares, result.enPassant, depth - 1, false, alpha, beta);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const result = makeMove(squares, enPassant, move.from, move.to);
      const eval_ = minimax(result.squares, result.enPassant, depth - 1, true, alpha, beta);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(
  squares: Record<string, Piece>,
  enPassant: string | null,
  difficulty: Difficulty
): { from: string; to: string } | null {
  const moves = getAllMoves(squares, 'b', enPassant);
  if (moves.length === 0) return null;

  const scored = moves.map(move => {
    const result = makeMove(squares, enPassant, move.from, move.to);
    let score: number;
    if (difficulty === 'easy') {
      score = evaluatePosition(result.squares);
    } else if (difficulty === 'medium') {
      score = minimax(result.squares, result.enPassant, 2, false, -Infinity, Infinity);
    } else {
      score = minimax(result.squares, result.enPassant, 3, false, -Infinity, Infinity);
    }

    // Blunder penalty
    const whiteNextMoves = getAllMoves(result.squares, 'w', result.enPassant);
    for (const wm of whiteNextMoves) {
      const target = result.squares[wm.to];
      if (target && target.color === 'b' && wm.to === move.to) {
        score -= 600;
      }
    }

    return { ...move, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (difficulty === 'easy') {
    const rand = Math.random();
    if (rand < 0.5 && scored.length >= 3) {
      return scored[Math.floor(Math.random() * 3)];
    } else if (rand < 0.8 && scored.length >= 5) {
      return scored[Math.floor(Math.random() * 5)];
    } else {
      return scored[Math.floor(Math.random() * scored.length)];
    }
  } else if (difficulty === 'medium') {
    if (Math.random() < 0.95 || scored.length < 2) {
      return scored[0];
    } else {
      return scored[Math.floor(Math.random() * Math.min(2, scored.length))];
    }
  } else {
    return scored[0];
  }
}

/* ═════════════════════════════════════════════════════════════════
   UI
   ═════════════════════════════════════════════════════════════════ */

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

function GhostOverlay({ from, to, piece, sqSize, className }: {
  from: string;
  to: string;
  piece: Piece;
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

const START_FEN = '3q4/pppppppp/8/8/8/8/PPPPPPPP/3Q4 w - - 0 1';

const LEVELS: { id: Difficulty; label: string; description: string; color: string; stars: number }[] = [
  { id: 'easy', label: 'Лёгкий', description: 'Чёрные часто ошибаются', color: '#D4A84C', stars: 1 },
  { id: 'medium', label: 'Средний', description: 'Чёрные играют осторожно', color: '#B07838', stars: 2 },
  { id: 'hard', label: 'Продвинутый', description: 'Чёрные почти не ошибаются', color: '#4A2A1A', stars: 3 },
];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

export default function QueenPawnBoard({ onComplete, lessonId, lessonTitle }: { onComplete: () => void; lessonId?: string; lessonTitle?: string }) {
  const savedKey = lessonId ? `queenpawn_progress_${lessonId}` : 'queenpawn_progress';
  const savedProgress = useMemo(() => {
    if (typeof window === 'undefined') return {} as Record<Difficulty, boolean>;
    try { return JSON.parse(localStorage.getItem(savedKey) || '{}'); } catch { return {}; }
  }, [savedKey]);

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Record<Difficulty, boolean>>(savedProgress);
  const [squares, setSquares] = useState<Record<string, Piece>>(() => parseFen(START_FEN));
  const [winner, setWinner] = useState<string | null>(null);
  const [computerThinking, setComputerThinking] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validSquares, setValidSquares] = useState<string[]>([]);
  const [enPassant, setEnPassant] = useState<string | null>(null);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [whiteCaptured, setWhiteCaptured] = useState(0);
  const [blackCaptured, setBlackCaptured] = useState(0);
  const [history, setHistory] = useState<{ squares: Record<string, Piece>; whiteCaptured: number; blackCaptured: number; enPassant: string | null; turn: 'w' | 'b' }[]>([]);
  const [sqSize, setSqSize] = useState(44);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: Piece } | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: Piece } | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  const [dragPiece, setDragPiece] = useState<{ square: string; type: string; color: string } | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; square: string; moved: boolean; pointerId: number } | null>(null);
  const processLockRef = useRef(false);
  const whiteCapturedRef = useRef(0);
  const blackCapturedRef = useRef(0);
  const squaresRef = useRef(squares);
  const clickRef = useRef<(square: string) => void>(() => {});
  const selectedSquareRef = useRef<string | null>(null);
  const validSquaresRef = useRef<string[]>([]);
  const enPassantRef = useRef(enPassant);
  const turnRef = useRef(turn);
  const winnerRef = useRef<string | null>(null);
  const difficultyRef = useRef<Difficulty | null>(null);
  const promotionPendingRef = useRef<{ from: string; to: string } | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { squaresRef.current = squares; }, [squares]);
  useEffect(() => { enPassantRef.current = enPassant; }, [enPassant]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { selectedSquareRef.current = selectedSquare; }, [selectedSquare]);
  useEffect(() => { validSquaresRef.current = validSquares; }, [validSquares]);
  useEffect(() => { whiteCapturedRef.current = whiteCaptured; }, [whiteCaptured]);
  useEffect(() => { blackCapturedRef.current = blackCaptured; }, [blackCaptured]);
  useEffect(() => { winnerRef.current = winner; }, [winner]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { promotionPendingRef.current = promotionPending; }, [promotionPending]);

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
    setSquares(parseFen(START_FEN));
    setWinner(null);
    setComputerThinking(false);
    setSelectedSquare(null);
    setValidSquares([]);
    setEnPassant(null);
    setTurn('w');
    setWhiteCaptured(0);
    setBlackCaptured(0);
    setHistory([]);
    setLastMove(null);
    setPromotionPending(null);
  }, []);

  const startLevel = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    reset();
  }, [reset]);

  const checkGameOver = useCallback((sqs: Record<string, Piece>, ep: string | null, currentTurn: 'w' | 'b', justPromoted: boolean = false): string | null => {
    // Win by capturing all opponent pieces OR promotion (new queen from pawn)
    if (!hasPieces(sqs, 'b') || justPromoted) return 'Белые победили!';
    if (!hasPieces(sqs, 'w')) return 'Чёрные победили!';
    if (hasNoMoves(sqs, currentTurn, ep)) return 'Ничья';
    return null;
  }, []);

  // Computer move
  useEffect(() => {
    if (winnerRef.current || turnRef.current !== 'b' || !difficultyRef.current) return;
    setComputerThinking(true);

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      const sqs = squaresRef.current;
      const diff = difficultyRef.current!;

      const chosen = getBestMove(sqs, enPassantRef.current, diff);

      if (!chosen) {
        const result = checkGameOver(sqs, enPassantRef.current, 'b');
        setWinner(result || 'Ничья');
        setComputerThinking(false);
        return;
      }

      const result = makeMove(sqs, enPassantRef.current, chosen.from, chosen.to);
      const movingPiece = sqs[chosen.from];

      const win = checkGameOver(result.squares, result.enPassant, 'w', result.promoted);
      if (win) {
        setWinner(win);
        setOpponentAnimatingMove({ from: chosen.from, to: chosen.to, piece: movingPiece! });
        setTimeout(() => {
          setSquares(result.squares);
          setEnPassant(result.enPassant);
          setTurn('w');
          setOpponentAnimatingMove(null);
          setComputerThinking(false);
          if (win === 'Белые победили!' && difficultyRef.current) {
            const d = difficultyRef.current;
            setCompletedLevels(prev => {
              const next = { ...prev, [d]: true };
              localStorage.setItem(savedKey, JSON.stringify(next));
              return next;
            });
            onComplete();
          }
        }, 200);
        return;
      }

      setOpponentAnimatingMove({ from: chosen.from, to: chosen.to, piece: movingPiece! });
      setTimeout(() => {
        setSquares(result.squares);
        setEnPassant(result.enPassant);
        setTurn('w');
        setOpponentAnimatingMove(null);
        setComputerThinking(false);
      }, 200);
    }, 800);

    return () => clearTimeout(timer);
  }, [turn, winner, checkGameOver, onComplete, savedKey]);

  const handlePromotion = useCallback((pieceCode: string) => {
    if (!promotionPending) return;

    const { from, to } = promotionPending;
    const sqs = squaresRef.current;
    const ep = enPassantRef.current;

    const result = makeMove(sqs, ep, from, to);
    const promotedSquares: Record<string, Piece> = {
      ...result.squares,
      [to]: { type: pieceCode, color: 'w' },
    };

    // Check if pawn was captured during promotion move (via en-passant on diagonal)
    let cap = result.captured;
    const movingPiece = sqs[from];
    if (!cap && movingPiece?.type === 'p') {
      const fromRank = parseInt(from[1]);
      const toRank = parseInt(to[1]);
      if (Math.abs(toRank - fromRank) === 1 && from[0] !== to[0]) {
        const capturedSq = `${to[0]}${from[1]}`;
        cap = sqs[capturedSq] || null;
      }
    }

    setPromotionPending(null);
    setSquares(promotedSquares);
    setEnPassant(result.enPassant);
    setLastMove({ from, to });
    if (cap && cap.color === 'b') {
      setWhiteCaptured(prev => prev + 1);
    }
    setTurn('b');
    setSelectedSquare(null);
    setValidSquares([]);
    selectedSquareRef.current = null;

    setHistory(prev => [
      ...prev,
      { squares: sqs, whiteCaptured: whiteCapturedRef.current, blackCaptured: blackCapturedRef.current, enPassant: ep, turn: 'w' },
    ]);
  }, [promotionPending]);

  // Click logic
  const click = useCallback((square: string) => {
    if (promotionPendingRef.current) return;
    if (winnerRef.current) return;
    if (turnRef.current === 'w' && hasNoMoves(squaresRef.current, 'w', enPassantRef.current)) {
      setWinner('Ничья');
      return;
    }
    const sqs = squaresRef.current;
    const sel = selectedSquareRef.current;
    const piece = sqs[square];

    if (sel) {
      if (sel === square) {
        selectedSquareRef.current = null;
        setSelectedSquare(null);
        setValidSquares([]);
        return;
      }

      if (piece && piece.color === 'w') {
        selectedSquareRef.current = square;
        setSelectedSquare(square);
        setValidSquares(getPieceMoves(square, sqs, 'w', enPassantRef.current));
        return;
      }

      if (validSquaresRef.current.includes(square)) {
        const movingPiece = sqs[sel];
        if (movingPiece?.type === 'p' && movingPiece.color === 'w' && square[1] === '8') {
          setPromotionPending({ from: sel, to: square });
          setSelectedSquare(null);
          setValidSquares([]);
          selectedSquareRef.current = null;
          return;
        }

        const result = makeMove(sqs, enPassantRef.current, sel, square);

        const win = checkGameOver(result.squares, result.enPassant, 'b', result.promoted);
        if (win) {
          setWinner(win);
          setPlayerAnimatingMove({ from: sel, to: square, piece: movingPiece! });
          setTimeout(() => {
            setSquares(result.squares);
            setEnPassant(result.enPassant);
            setPlayerAnimatingMove(null);
            setSelectedSquare(null);
            setValidSquares([]);
            selectedSquareRef.current = null;
            if (win === 'Белые победили!' && difficultyRef.current) {
              const d = difficultyRef.current;
              setCompletedLevels(prev => {
                const next = { ...prev, [d]: true };
                localStorage.setItem(savedKey, JSON.stringify(next));
                return next;
              });
              onComplete();
            }
          }, 200);
          return;
        }

        setPlayerAnimatingMove({ from: sel, to: square, piece: movingPiece! });
        setTimeout(() => {
          setSquares(result.squares);
          setEnPassant(result.enPassant);
          setTurn('b');
          setPlayerAnimatingMove(null);
          setSelectedSquare(null);
          setValidSquares([]);
          selectedSquareRef.current = null;
          if (hasNoMoves(result.squares, 'b', result.enPassant)) {
            setWinner('Ничья');
          }
        }, 200);
        return;
      }

      if (piece && piece.color === 'w') {
        selectedSquareRef.current = square;
        setSelectedSquare(square);
        setValidSquares(getPieceMoves(square, sqs, 'w', enPassantRef.current));
      } else {
        selectedSquareRef.current = null;
        setSelectedSquare(null);
        setValidSquares([]);
      }
    } else {
      if (piece && piece.color === 'w') {
        selectedSquareRef.current = square;
        setSelectedSquare(square);
        setValidSquares(getPieceMoves(square, sqs, 'w', enPassantRef.current));
      }
    }
  }, [checkGameOver, onComplete, savedKey]);

  useEffect(() => { clickRef.current = click; }, [click]);

  // Drag and drop
  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (promotionPendingRef.current) return;
    if (winnerRef.current) return;
    if (turnRef.current === 'w' && hasNoMoves(squaresRef.current, 'w', enPassantRef.current)) {
      setWinner('Ничья');
      return;
    }
    if (processLockRef.current) return;
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    e.preventDefault();
    const sqs = squaresRef.current;
    const piece = sqs[square];
    if (piece && piece.color === 'w') {
      pointerStartRef.current = { x: e.clientX, y: e.clientY, square, moved: false, pointerId: e.pointerId };
      setSelectedSquare(square);
      setValidSquares(getPieceMoves(square, sqs, 'w', enPassantRef.current));
    }
  }, []);

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
        start.moved = true;
        const sqs = squaresRef.current;
        const piece = sqs[start.square];
        if (piece && piece.color === 'w') {
          setDragPiece({ square: start.square, type: piece.type, color: piece.color });
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
        clickRef.current(start.square);
      } else {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest('[data-square]') as HTMLElement | null;
        const targetSquare = cell?.dataset.square || null;
        if (targetSquare && targetSquare !== start.square) {
          const valid = getPieceMoves(start.square, squaresRef.current, 'w', enPassantRef.current);
          if (valid.includes(targetSquare)) {
            const movingPiece = squaresRef.current[start.square];
            if (movingPiece?.type === 'p' && movingPiece.color === 'w' && targetSquare[1] === '8') {
              setPromotionPending({ from: start.square, to: targetSquare });
              setSelectedSquare(null);
              setValidSquares([]);
              selectedSquareRef.current = null;
              setDragPiece(null);
              pointerStartRef.current = null;
              return;
            }

            const result = makeMove(squaresRef.current, enPassantRef.current, start.square, targetSquare);
            const win = checkGameOver(result.squares, result.enPassant, 'b', result.promoted);
            if (win) {
              setWinner(win);
              setPlayerAnimatingMove({ from: start.square, to: targetSquare, piece: movingPiece! });
              setTimeout(() => {
                setSquares(result.squares);
                setEnPassant(result.enPassant);
                setPlayerAnimatingMove(null);
                setSelectedSquare(null);
                setValidSquares([]);
                selectedSquareRef.current = null;
                if (win === 'Белые победили!' && difficultyRef.current) {
                  const d = difficultyRef.current;
                  setCompletedLevels(prev => {
                    const next = { ...prev, [d]: true };
                    localStorage.setItem(savedKey, JSON.stringify(next));
                    return next;
                  });
                  onComplete();
                }
              }, 200);
            } else {
              setPlayerAnimatingMove({ from: start.square, to: targetSquare, piece: movingPiece! });
              setTimeout(() => {
                setSquares(result.squares);
                setEnPassant(result.enPassant);
                setTurn('b');
                setPlayerAnimatingMove(null);
                setSelectedSquare(null);
                setValidSquares([]);
                selectedSquareRef.current = null;
                if (hasNoMoves(result.squares, 'b', result.enPassant)) {
                  setWinner('Ничья');
                }
              }, 200);
            }
          }
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
  }, [checkGameOver, onComplete, savedKey]);

  const isLight = (f: number, r: number) => (f + r) % 2 === 0;
  const validMoves = selectedSquare
    ? getPieceMoves(selectedSquare, squares, 'w', enPassant)
    : dragPiece
      ? getPieceMoves(dragPiece.square, squares, 'w', enPassant)
      : [];

  // ═══════════════════════════════════════════════════════════════
  // LEVEL SELECTOR
  // ═══════════════════════════════════════════════════════════════
  if (!difficulty) {
    const allCompleted = LEVELS.every(l => completedLevels[l.id]);
    return (
      <div className="flex flex-col items-center gap-6 w-full px-4 py-6">
        {lessonTitle ? (
          <div className="text-center">
            <h2 className="text-[20px] font-bold text-[#2C241B]">{lessonTitle}</h2>
            <p className="text-[14px] font-medium text-[#8B7355] mt-1">Выберите уровень сложности</p>
          </div>
        ) : (
          <h3 className="text-[20px] font-bold text-[#2C241B] text-center">Выберите уровень сложности</h3>
        )}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {LEVELS.map(level => {
            const isCompleted = completedLevels[level.id];
            const circleColor = level.color;
            const borderColor = isCompleted
              ? circleColor
              : (level.id === 'easy' ? '#F5EFE0' : level.id === 'medium' ? '#F0E8DA' : '#E8DCD4');
            const titleColor  = level.id === 'easy' ? '#A07820' : level.id === 'medium' ? '#805820' : '#3A1A0A';
            const descColor   = level.id === 'easy' ? '#B89A60' : level.id === 'medium' ? '#A08860' : '#7A5A4A';
            return (
              <button
                key={level.id}
                onClick={() => startLevel(level.id)}
                className="flex items-center gap-3.5 px-4 py-4 rounded-2xl bg-white transition hover:-translate-y-px text-left"
                style={{ border: `2px solid ${borderColor}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = circleColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                  style={{
                    backgroundColor: circleColor,
                    boxShadow: `0 2px 8px ${circleColor}4D`,
                  }}
                >
                  {isCompleted ? <Trophy size={20} /> : level.stars}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base" style={{ color: titleColor }}>{level.label}</div>
                  <div className="text-[13px]" style={{ color: descColor }}>{level.description}</div>
                </div>
                <ChevronRight size={20} style={{ color: circleColor }} className="flex-shrink-0" />
              </button>
            );
          })}
        </div>
        {allCompleted && (
          <div className="mt-4 px-6 py-3 bg-[#F5EFE6] border border-[#C9A84C] rounded-xl text-[#3E3228] font-bold flex items-center gap-2">
            <Trophy size={20} /> Все уровни пройдены!
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // GAME BOARD
  // ═══════════════════════════════════════════════════════════════
  const currentLevel = LEVELS.find(l => l.id === difficulty)!;

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* Avatar + speech bubble */}
      <div className="w-full flex flex-col gap-2 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              Цель: съешь 5 пешек соперника или проведи пешку до последней линии.
            </p>
          </div>
        </div>
      </div>

      {winner && (
        <div className={`px-6 py-4 border rounded-xl font-bold text-lg text-center ${
          winner.includes('Белые')
            ? 'bg-[#F5EFE6] border-[#D4C5B5] text-[#4A3F35]'
            : winner === 'Ничья'
              ? 'bg-[#F5EFE6] border-[#D4C5B5] text-[#4A3F35]'
              : 'bg-[#F2DEDA] border-[#C9A84C] text-[#7A3A32]'
        }`}>
          <div className="text-xl">{winner}</div>
        </div>
      )}

      {/* Board */}
      <div className="flex justify-center w-full">
        <div
          className="grid border-[3px] border-[#2b2b2b] rounded-sm relative select-none"
          style={{
            gridTemplateColumns: `repeat(8, ${sqSize}px)`,
            gridTemplateRows: `repeat(8, ${sqSize}px)`,
            touchAction: 'none',
          }}
        >
          {RANKS.map((rank, ri) =>
            FILES.map((file, fi) => {
              const sq = `${file}${rank}`;
              const pieceObj = squares[sq];
              const light = isLight(fi, ri);
              const sel = selectedSquare === sq;
              const isSource = dragPiece?.square === sq;
              const isValidMove = validMoves.includes(sq);

              return (
                <div
                  key={sq}
                  data-square={sq}
                  className={`flex items-center justify-center relative select-none ${isSource ? 'opacity-50' : ''}`}
                  style={{
                    width: sqSize,
                    height: sqSize,
                    cursor: pieceObj && pieceObj.color === 'w' ? 'grab' : 'default',
                    touchAction: 'none',
                    backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, sq)}
                  onClick={() => click(sq)}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {/* Selected square highlight */}
                  {sel && (
                    <div className="absolute inset-0 bg-[rgba(184,149,106,0.35)] pointer-events-none z-10" />
                  )}
                  {lastMove && sq === lastMove.from && (
                    <div className="absolute inset-0 bg-[rgba(201,168,76,0.55)] pointer-events-none z-[5]" />
                  )}
                  {lastMove && sq === lastMove.to && (
                    <div className="absolute inset-0 bg-[rgba(201,168,76,0.70)] pointer-events-none z-[5]" />
                  )}
                    {lastMove && sq === lastMove.from && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.55)] pointer-events-none z-[5]" />
                    )}
                    {lastMove && sq === lastMove.to && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.70)] pointer-events-none z-[5]" />
                    )}

                  {/* Coordinates */}
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
                  {/* Green move indicator dots */}
                  {isValidMove && (
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
                  {/* Piece */}
                  {pieceObj && !isSource && (
                    <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                      <PieceImg type={pieceObj.type} color={pieceObj.color as 'w' | 'b'} />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {playerAnimatingMove && (
            <GhostOverlay
              from={playerAnimatingMove.from}
              to={playerAnimatingMove.to}
              piece={playerAnimatingMove.piece}
              sqSize={sqSize}
              className="animate-player-move"
            />
          )}
          {opponentAnimatingMove && (
            <GhostOverlay
              from={opponentAnimatingMove.from}
              to={opponentAnimatingMove.to}
              piece={opponentAnimatingMove.piece}
              sqSize={sqSize}
              className="animate-opponent-move"
            />
          )}
          {promotionPending && (
            <div
              className="absolute z-50 pointer-events-auto"
              style={{
                left: `${FILES.indexOf(promotionPending.to[0]) * sqSize}px`,
                top: 0,
                width: sqSize,
                height: 4 * sqSize,
                backgroundColor: '#2C241B',
                boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {PROMOTION_PIECES.map(({ code, name }) => (
                <button
                  key={code}
                  onClick={() => handlePromotion(code)}
                  className="w-full aspect-square flex items-center justify-center transition-all duration-150"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.15)';
                    e.currentTarget.style.borderColor = '#C9A84C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  title={name}
                >
                  <img
                    src={`/pieces/cburnett/w${code.toUpperCase()}.svg`}
                    alt={name}
                    draggable={false}
                    style={{ width: '70%', height: '70%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      {dragPiece && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPos.x - Math.round(sqSize / 2),
            top: dragPos.y - Math.round(sqSize / 2),
            width: Math.round(sqSize * 0.85),
            height: Math.round(sqSize * 0.85),
          }}
        >
          <PieceImg type={dragPiece.type} color={dragPiece.color as 'w' | 'b'} />
        </div>
      )}

      {/* Score counters */}
      <div className="flex items-center justify-between w-full max-w-sm px-2 text-sm font-medium">
        <span>Белые съели: <span className="font-bold text-[#5A4A3A]">{whiteCaptured}/5</span></span>
        <span>Чёрные съели: <span className="font-bold text-[#8B7355]">{blackCaptured}/5</span></span>
      </div>

      {/* Hint + restart + undo row */}
      <div className="flex items-center gap-2 w-full max-w-sm px-2">
        <button
          onClick={() => alert('Подсказка: ферзь — самая сильная фигура, используй её для атаки и защиты пешек.')}
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200"
        >
          <Eye size={14} /> Подсказка
        </button>
        <button
          onClick={reset}
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200"
        >
          <RotateCcw size={14} /> Заново
        </button>
        <button
          onClick={() => {
            if (history.length === 0 || winner || computerThinking) return;
            const prev = history[history.length - 1];
            setSquares(prev.squares);
            setWhiteCaptured(prev.whiteCaptured);
            setBlackCaptured(prev.blackCaptured);
            setEnPassant(prev.enPassant);
            setTurn(prev.turn);
            setLastMove(null);
            setWinner(null);
            setHistory(h => h.slice(0, -1));
          }}
          disabled={history.length === 0 || !!winner || computerThinking}
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 size={14} /> Вернуть ход
        </button>
      </div>
    </div>
  );
}
