'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye, Undo2 } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

// FEN with kings for chess.js compatibility — kings don't move in this lesson
const START_FEN = '4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1';

const DIFFICULTIES = [
  { id: 'easy', label: 'Лёгкий', description: 'Чёрные играют слабо', color: '#D4C5B5', stars: 1 },
  { id: 'medium', label: 'Средний', description: 'Чёрные играют осторожно', color: '#B07838', stars: 2 },
  { id: 'hard', label: 'Продвинутый', description: 'Чёрные почти не ошибаются', color: '#4A2A1A', stars: 3 },
];

interface Piece { type: string; color: 'w' | 'b'; }

// ═══════════════════════════════════════════════════════════════════
// PAWN GAME LOGIC (unchanged — works with Record<string, Piece>)
// ═══════════════════════════════════════════════════════════════════

function parseFen(fen: string): Record<string, Piece> {
  const squares: Record<string, Piece> = {};
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  for (let ri = 0; ri < 8; ri++) {
    let fi = 0;
    for (const ch of rows[ri]) {
      if (/\d/.test(ch)) {
        fi += parseInt(ch);
      } else {
        const color: 'w' | 'b' = ch === ch.toUpperCase() ? 'w' : 'b';
        squares[`${FILES[fi]}${RANKS[ri]}`] = { type: ch.toLowerCase(), color };
        fi++;
      }
    }
  }
  return squares;
}

function getPawnMoves(square: string, squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): string[] {
  const ff = FILES.indexOf(square[0]);
  const fr = RANKS.indexOf(square[1]);
  const dir = color === 'w' ? -1 : 1;
  const startRank = color === 'w' ? 6 : 1;
  const valid: string[] = [];
  const f1 = FILES[ff];
  const r1 = RANKS[fr + dir];
  if (r1 && !squares[`${f1}${r1}`]) {
    valid.push(`${f1}${r1}`);
    const r2 = RANKS[fr + dir * 2];
    if (fr === startRank && r2 && !squares[`${f1}${r2}`]) {
      valid.push(`${f1}${r2}`);
    }
  }
  for (const d of [-1, 1]) {
    const fc = FILES[ff + d];
    const rc = r1;
    if (fc && rc) {
      const sq = `${fc}${rc}`;
      const target = squares[sq];
      if (target && target.color !== color) valid.push(sq);
      if (sq === enPassant) valid.push(sq);
    }
  }
  return valid;
}

function makePawnMove(squares: Record<string, Piece>, enPassant: string | null, from: string, to: string): { squares: Record<string, Piece>; enPassant: string | null; captured: Piece | null; promoted: boolean } {
  const next = { ...squares };
  const p = next[from];
  if (!p) return { squares: next, enPassant, captured: null, promoted: false };
  delete next[from];
  let captured: Piece | null = null;
  if (enPassant === to) {
    const epRank = p.color === 'w' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
    const epSq = `${to[0]}${epRank}`;
    captured = next[epSq] || null;
    delete next[epSq];
  }
  if (next[to]) captured = next[to];
  const rank = to[1];
  if (p.type === 'p' && (rank === '8' || rank === '1')) {
    if (p.color === 'w' && rank === '8') {
      next[to] = { type: 'p', color: 'w' };
    } else {
      next[to] = { type: 'q', color: p.color };
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

function countPawns(squares: Record<string, Piece>, color: 'w' | 'b'): number {
  return Object.values(squares).filter(p => p.type === 'p' && p.color === color).length;
}

function hasPromotedPiece(squares: Record<string, Piece>, color: 'w' | 'b'): boolean {
  return Object.values(squares).some(p => p.color === color && p.type !== 'p' && p.type !== 'k');
}

function getAllPawnMoves(squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): { from: string; to: string }[] {
  const moves: { from: string; to: string }[] = [];
  for (const sq in squares) {
    const p = squares[sq];
    if (p.type === 'p' && p.color === color) {
      const mvs = getPawnMoves(sq, squares, color, enPassant);
      for (const to of mvs) moves.push({ from: sq, to });
    }
  }
  return moves;
}

function hasNoMoves(squares: Record<string, Piece>, color: 'w' | 'b', enPassant: string | null): boolean {
  return getAllPawnMoves(squares, color, enPassant).length === 0;
}

function evaluatePosition(squares: Record<string, Piece>, whiteCaptured: number, blackCaptured: number): number {
  let score = 0;
  for (const sq in squares) {
    const p = squares[sq];
    if (!p || p.type !== 'p') continue;
    const rank = parseInt(sq[1]);
    if (p.color === 'w') {
      score += (8 - rank) * 10;
      if (rank <= 3) score += 30;
    } else {
      score -= rank * 10;
      if (rank >= 6) score -= 30;
    }
  }
  score += (whiteCaptured - blackCaptured) * 50;
  return score;
}

function minimax(squares: Record<string, Piece>, enPassant: string | null, depth: number, alpha: number, beta: number, isMaximizing: boolean, whiteCaptured: number, blackCaptured: number): { score: number; move: { from: string; to: string } | null } {
  if (depth === 0) return { score: evaluatePosition(squares, whiteCaptured, blackCaptured), move: null };
  const color = isMaximizing ? 'b' : 'w';
  const moves = getAllPawnMoves(squares, color, enPassant);
  if (moves.length === 0) return { score: isMaximizing ? -9999 : 9999, move: null };
  let bestMove: { from: string; to: string } | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;
  for (const move of moves) {
    const result = makePawnMove(squares, enPassant, move.from, move.to);
    let wCap = whiteCaptured;
    let bCap = blackCaptured;
    if (result.captured) {
      if (result.captured.color === 'w') wCap++;
      else bCap++;
    }
    if (hasPromotedPiece(result.squares, 'w') || bCap >= 5 || countPawns(result.squares, 'b') === 0) {
      if (isMaximizing) bestScore = Math.max(bestScore, 9999);
      else bestScore = Math.min(bestScore, -9999);
      if (!bestMove) bestMove = move;
      continue;
    }
    if (hasPromotedPiece(result.squares, 'b') || wCap >= 5 || countPawns(result.squares, 'w') === 0) {
      if (isMaximizing) bestScore = Math.max(bestScore, -9999);
      else bestScore = Math.min(bestScore, 9999);
      if (!bestMove) bestMove = move;
      continue;
    }
    const evalResult = minimax(result.squares, result.enPassant, depth - 1, alpha, beta, !isMaximizing, wCap, bCap);
    if (isMaximizing) {
      if (evalResult.score > bestScore) { bestScore = evalResult.score; bestMove = move; }
      alpha = Math.max(alpha, evalResult.score);
    } else {
      if (evalResult.score < bestScore) { bestScore = evalResult.score; bestMove = move; }
      beta = Math.min(beta, evalResult.score);
    }
    if (beta <= alpha) break;
  }
  return { score: bestScore, move: bestMove };
}

function getBestMove(squares: Record<string, Piece>, enPassant: string | null, whiteCaptured: number, blackCaptured: number, difficulty: string): { from: string; to: string } | null {
  const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
  const moves = getAllPawnMoves(squares, 'b', enPassant);
  if (moves.length === 0) return null;
  const immediateWin = moves.find(move => {
    const result = makePawnMove(squares, enPassant, move.from, move.to);
    const wCap = whiteCaptured + (result.captured?.color === 'w' ? 1 : 0);
    return hasPromotedPiece(result.squares, 'b') || wCap >= 5 || countPawns(result.squares, 'w') === 0;
  });
  if (immediateWin) return immediateWin;
  const immediateLoss = moves.find(move => {
    const result = makePawnMove(squares, enPassant, move.from, move.to);
    const bCap = blackCaptured + (result.captured?.color === 'b' ? 1 : 0);
    return hasPromotedPiece(result.squares, 'w') || bCap >= 5 || countPawns(result.squares, 'b') === 0;
  });
  if (immediateLoss && difficulty !== 'easy') {
    const avoid = moves.find(move => {
      const result = makePawnMove(squares, enPassant, move.from, move.to);
      const bCap = blackCaptured + (result.captured?.color === 'b' ? 1 : 0);
      return !(hasPromotedPiece(result.squares, 'w') || bCap >= 5 || countPawns(result.squares, 'b') === 0);
    });
    if (avoid) return avoid;
  }
  if (difficulty === 'easy') {
    const badMoves = moves.filter(move => {
      const result = makePawnMove(squares, enPassant, move.from, move.to);
      const wCap = whiteCaptured + (result.captured?.color === 'w' ? 1 : 0);
      return !(hasPromotedPiece(result.squares, 'b') || wCap >= 5 || countPawns(result.squares, 'w') === 0);
    });
    if (badMoves.length > 0 && Math.random() < 0.3) return badMoves[Math.floor(Math.random() * badMoves.length)];
  }
  const result = minimax(squares, enPassant, depth, -Infinity, Infinity, true, whiteCaptured, blackCaptured);
  if (result.move) return result.move;
  return moves[Math.floor(Math.random() * moves.length)];
}

function checkGameOver(squares: Record<string, Piece>, wCap: number, bCap: number, ep: string | null, currentTurn: 'w' | 'b'): string | null {
  if (hasPromotedPiece(squares, 'w') || bCap >= 5 || countPawns(squares, 'b') === 0) return 'Белые победили!';
  if (hasPromotedPiece(squares, 'b') || wCap >= 5 || countPawns(squares, 'w') === 0) return 'Чёрные победили!';
  if (hasNoMoves(squares, currentTurn, ep)) return 'Ничья';
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function PawnRaceBoard({ onComplete, lessonId, prevLesson, nextLesson, courseId, lessonTitle }: { onComplete: () => void; lessonId?: string; prevLesson?: any; nextLesson?: any; courseId?: string; lessonTitle?: string }) {
  const mountedRef = useRef(true);
  const [sqSize, setSqSize] = useState(64);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const difficultyRef = useRef(difficulty);
  const [game, setGame] = useState<Chess | null>(null);
  const [squares, setSquares] = useState<Record<string, Piece>>({});
  const [enPassant, setEnPassant] = useState<string | null>(null);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [whiteCaptured, setWhiteCaptured] = useState(0);
  const [blackCaptured, setBlackCaptured] = useState(0);
  const whiteCapturedRef = useRef(0);
  const blackCapturedRef = useRef(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [computerThinking, setComputerThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Record<string, boolean>>({});
  const [hintVisible, setHintVisible] = useState(false);
  const [history, setHistory] = useState<{ squares: Record<string, Piece>; enPassant: string | null; turn: 'w' | 'b'; whiteCaptured: number; blackCaptured: number; lastMove: { from: string; to: string } | null; gameFen: string }[]>([]);
  const [starCount, setStarCount] = useState(1);

  const savedKey = `pawnrace-completed-${lessonId || 'default'}`;

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Initialize completed levels from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(savedKey);
      if (saved) setCompletedLevels(JSON.parse(saved));
    } catch {}
  }, [savedKey]);

  // Update sqSize on resize
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

  const buildFen = useCallback((sqs: Record<string, Piece>, currentTurn: 'w' | 'b', ep: string | null): string => {
    let fen = '';
    for (let ri = 0; ri < 8; ri++) {
      let empty = 0;
      for (let fi = 0; fi < 8; fi++) {
        const sq = `${FILES[fi]}${RANKS[ri]}`;
        const p = sqs[sq];
        if (p) {
          if (empty > 0) { fen += empty; empty = 0; }
          fen += p.color === 'w' ? p.type.toUpperCase() : p.type;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (ri < 7) fen += '/';
    }
    fen += ` ${currentTurn} ${ep || '-'} - 0 1`;
    return fen;
  }, []);

  const switchDifficulty = useCallback((diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    const g = new Chess(START_FEN);
    const sqs = parseFen(START_FEN);
    setGame(g);
    setSquares(sqs);
    setEnPassant(null);
    setTurn('w');
    setWhiteCaptured(0);
    setBlackCaptured(0);
    whiteCapturedRef.current = 0;
    blackCapturedRef.current = 0;
    setWinner(null);
    setMessage('');
    setComputerThinking(false);
    setLastMove(null);
    setSelectedSquare(null);
    setOpponentAnimatingMove(null);
    setPromotionPending(null);
    setHistory([]);
    setHintVisible(false);
    setStarCount(DIFFICULTIES.find(d => d.id === diff)?.stars || 1);
  }, []);

  useEffect(() => {
    switchDifficulty('easy');
    return () => { mountedRef.current = false; };
  }, [switchDifficulty]);

  // ═══════════════════════════════════════════════════════════════════
  // PROMOTION HANDLER
  // ═══════════════════════════════════════════════════════════════════
  const handlePromotion = useCallback((piece: string) => {
    if (!promotionPending || !game) return;
    const { from, to } = promotionPending;
    const g = new Chess(game.fen());
    const move = g.move({ from, to, promotion: piece });
    if (!move) return;

    const sqs = parseFen(g.fen());
    // Keep pawn on to-square until promotion choice is made
    if (sqs[to] && sqs[to].type === 'p') {
      sqs[to] = { type: piece, color: 'w' };
    }

    const result = makePawnMove(squares, enPassant, from, to);
    let wCap = whiteCapturedRef.current;
    let bCap = blackCapturedRef.current;
    if (result.captured) {
      if (result.captured.color === 'w') wCap++;
      else bCap++;
    }

    setPromotionPending(null);
    setSquares(sqs);
    setEnPassant(result.enPassant);
    setGame(new Chess(buildFen(sqs, 'b', result.enPassant)));
    setLastMove({ from, to });
    setHistory(prev => [...prev, { squares, enPassant, turn: 'w', whiteCaptured: whiteCapturedRef.current, blackCaptured: blackCapturedRef.current, lastMove, gameFen: game.fen() }]);

    whiteCapturedRef.current = wCap;
    blackCapturedRef.current = bCap;
    setWhiteCaptured(wCap);
    setBlackCaptured(bCap);

    const win = checkGameOver(sqs, wCap, bCap, result.enPassant, 'b');
    if (win) {
      setWinner(win);
      if (win === 'Белые победили!') {
        const diff = difficultyRef.current;
        setCompletedLevels(prev => {
          const next = { ...prev, [diff]: true };
          localStorage.setItem(savedKey, JSON.stringify(next));
          return next;
        });
        onComplete();
      }
      return;
    }

    setTurn('b');
    setComputerThinking(true);

    setTimeout(() => {
      if (!mountedRef.current) return;
      const best = getBestMove(sqs, result.enPassant, wCap, bCap, difficultyRef.current);
      if (!best) {
        setWinner('Ничья');
        setComputerThinking(false);
        return;
      }
      const compResult = makePawnMove(sqs, result.enPassant, best.from, best.to);
      const compSqs = compResult.squares;
      let compWCap = wCap;
      let compBCap = bCap;
      if (compResult.captured) {
        if (compResult.captured.color === 'w') compWCap++;
        else compBCap++;
      }

      setOpponentAnimatingMove({
        from: best.from,
        to: best.to,
        piece: { type: 'p', color: 'b' },
      });

      setTimeout(() => {
        if (!mountedRef.current) return;
        setOpponentAnimatingMove(null);
        setSquares(compSqs);
        setEnPassant(compResult.enPassant);
        setGame(new Chess(buildFen(compSqs, 'w', compResult.enPassant)));
        setLastMove({ from: best.from, to: best.to });
        setHistory(prev => [...prev, { squares: sqs, enPassant: result.enPassant, turn: 'b', whiteCaptured: wCap, blackCaptured: bCap, lastMove: { from, to }, gameFen: buildFen(sqs, 'b', result.enPassant) }]);
        whiteCapturedRef.current = compWCap;
        blackCapturedRef.current = compBCap;
        setWhiteCaptured(compWCap);
        setBlackCaptured(compBCap);
        setComputerThinking(false);
        setTurn('w');

        const compWin = checkGameOver(compSqs, compWCap, compBCap, compResult.enPassant, 'w');
        if (compWin) {
          setWinner(compWin);
          if (compWin === 'Белые победили!' && difficultyRef.current) {
            const diff = difficultyRef.current;
            setCompletedLevels(prev => {
              const next = { ...prev, [diff]: true };
              localStorage.setItem(savedKey, JSON.stringify(next));
              return next;
            });
            onComplete();
          }
          return;
        }

        if (hasNoMoves(compSqs, 'w', compResult.enPassant)) {
          setWinner('Ничья');
        }
      }, 220);
    }, 600);
  }, [promotionPending, game, squares, enPassant, buildFen, onComplete, savedKey, lastMove]);

  // ═══════════════════════════════════════════════════════════════════
  // WHITE MOVE HANDLER (for UCBD onMove)
  // ═══════════════════════════════════════════════════════════════════
  const processWhiteMove = useCallback((from: string, to: string) => {
    if (!game || winner || computerThinking || turn !== 'w') return;

    const sqs = { ...squares };
    const p = sqs[from];
    if (!p || p.type !== 'p' || p.color !== 'w') return;

    const valid = getPawnMoves(from, sqs, 'w', enPassant);
    if (!valid.includes(to)) return;

    const g = new Chess(game.fen());

    // Check promotion
    if (to[1] === '8') {
      setPromotionPending({ from, to });
      return;
    }

    const move = g.move({ from, to });
    if (!move) return;

    const result = makePawnMove(sqs, enPassant, from, to);
    let wCap = whiteCapturedRef.current;
    let bCap = blackCapturedRef.current;
    if (result.captured) {
      if (result.captured.color === 'w') wCap++;
      else bCap++;
    }

    setSquares(result.squares);
    setEnPassant(result.enPassant);
    setGame(new Chess(buildFen(result.squares, 'b', result.enPassant)));
    setLastMove({ from, to });
    setSelectedSquare(null);
    setHistory(prev => [...prev, { squares, enPassant, turn: 'w', whiteCaptured: whiteCapturedRef.current, blackCaptured: blackCapturedRef.current, lastMove, gameFen: game.fen() }]);

    whiteCapturedRef.current = wCap;
    blackCapturedRef.current = bCap;
    setWhiteCaptured(wCap);
    setBlackCaptured(bCap);

    const win = checkGameOver(result.squares, wCap, bCap, result.enPassant, 'b');
    if (win) {
      setWinner(win);
      if (win === 'Белые победили!') {
        const diff = difficultyRef.current;
        setCompletedLevels(prev => {
          const next = { ...prev, [diff]: true };
          localStorage.setItem(savedKey, JSON.stringify(next));
          return next;
        });
        onComplete();
      }
      return;
    }

    setTurn('b');
    setComputerThinking(true);

    setTimeout(() => {
      if (!mountedRef.current) return;
      const best = getBestMove(result.squares, result.enPassant, wCap, bCap, difficultyRef.current);
      if (!best) {
        setWinner('Ничья');
        setComputerThinking(false);
        return;
      }
      const compResult = makePawnMove(result.squares, result.enPassant, best.from, best.to);
      const compSqs = compResult.squares;
      let compWCap = wCap;
      let compBCap = bCap;
      if (compResult.captured) {
        if (compResult.captured.color === 'w') compWCap++;
        else compBCap++;
      }

      setOpponentAnimatingMove({
        from: best.from,
        to: best.to,
        piece: { type: 'p', color: 'b' },
      });

      setTimeout(() => {
        if (!mountedRef.current) return;
        setOpponentAnimatingMove(null);
        setSquares(compSqs);
        setEnPassant(compResult.enPassant);
        setGame(new Chess(buildFen(compSqs, 'w', compResult.enPassant)));
        setLastMove({ from: best.from, to: best.to });
        setHistory(prev => [...prev, { squares: result.squares, enPassant: result.enPassant, turn: 'b', whiteCaptured: wCap, blackCaptured: bCap, lastMove: { from, to }, gameFen: buildFen(result.squares, 'b', result.enPassant) }]);
        whiteCapturedRef.current = compWCap;
        blackCapturedRef.current = compBCap;
        setWhiteCaptured(compWCap);
        setBlackCaptured(compBCap);
        setComputerThinking(false);
        setTurn('w');

        const compWin = checkGameOver(compSqs, compWCap, compBCap, compResult.enPassant, 'w');
        if (compWin) {
          setWinner(compWin);
          if (compWin === 'Белые победили!' && difficultyRef.current) {
            const diff = difficultyRef.current;
            setCompletedLevels(prev => {
              const next = { ...prev, [diff]: true };
              localStorage.setItem(savedKey, JSON.stringify(next));
              return next;
            });
            onComplete();
          }
          return;
        }

        if (hasNoMoves(compSqs, 'w', compResult.enPassant)) {
          setWinner('Ничья');
        }
      }, 220);
    }, 600);
  }, [game, winner, computerThinking, turn, squares, enPassant, buildFen, onComplete, savedKey, lastMove]);

  // ═══════════════════════════════════════════════════════════════════
  // UNDO
  // ═══════════════════════════════════════════════════════════════════
  const handleUndo = useCallback(() => {
    if (history.length < 2 || winner) return;
    const prev = history[history.length - 2];
    setSquares(prev.squares);
    setEnPassant(prev.enPassant);
    setTurn(prev.turn);
    setWhiteCaptured(prev.whiteCaptured);
    setBlackCaptured(prev.blackCaptured);
    whiteCapturedRef.current = prev.whiteCaptured;
    blackCapturedRef.current = prev.blackCaptured;
    setLastMove(prev.lastMove);
    setGame(new Chess(prev.gameFen));
    setHistory(prevHistory => prevHistory.slice(0, -2));
    setWinner(null);
    setMessage('');
    setComputerThinking(false);
    setOpponentAnimatingMove(null);
  }, [history, winner]);

  // ═══════════════════════════════════════════════════════════════════
  // HINT
  // ═══════════════════════════════════════════════════════════════════
  const showHint = useCallback(() => {
    setHintVisible(true);
    const moves = getAllPawnMoves(squares, 'w', enPassant);
    if (moves.length > 0) {
      const best = getBestMove(squares, enPassant, whiteCaptured, blackCaptured, 'hard');
      if (best) {
        setSelectedSquare(best.from);
        setMessage(`Подсказка: ${best.from} → ${best.to}`);
      }
    }
    setTimeout(() => setHintVisible(false), 3000);
  }, [squares, enPassant, whiteCaptured, blackCaptured]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col items-center w-full">
      {/* Message */}
      {message && (
        <div className="mb-2 px-4 py-2 rounded-lg bg-[#2a2a2a] text-[#d4c5b5] text-sm font-medium">
          {message}
        </div>
      )}

      {/* Winner */}
      {winner && (
        <div className="mb-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-[#1a1a1a] text-sm font-bold">
          {winner}
        </div>
      )}

      {/* Star count */}
      <div className="mb-2 flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < starCount ? 'bg-[#c9a84c] text-[#1a1a1a]' : 'bg-[#3a3a3a] text-[#666]'}`}>
            ★
          </div>
        ))}
      </div>

      {/* Captured pieces */}
      <div className="w-full max-w-[520px] mb-2 flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#888]">Белые взяли:</span>
          {Array.from({ length: whiteCaptured }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#444]" />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#888]">Чёрные взяли:</span>
          {Array.from({ length: blackCaptured }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#888]" />
          ))}
        </div>
      </div>

      {/* Board container */}
      <div className="relative w-full max-w-[520px] aspect-square">
        {/* UCBD Board */}
        {game && (
          <UniversalChessBoardDesigner
            fen={game.fen()}
            selectedSquare={selectedSquare}
            lastMove={lastMove}
            autoValidMoves={true}
            onMove={(from, to) => processWhiteMove(from, to)}
            onSquareClick={(square) => setSelectedSquare(prev => prev === square ? null : square)}
            interactive={!winner && !computerThinking}
            sqSize={sqSize}
            clickGhost={true}
            userColor="w"
            disableAutoGhost={true}
            opponentAnimatingMove={opponentAnimatingMove}
          />
        )}

        {/* Promotion UI */}
        {promotionPending && (
          <div className="absolute z-50 pointer-events-auto" style={{
            left: `${FILES.indexOf(promotionPending.to[0]) * sqSize}px`,
            top: 0,
            width: sqSize,
          }}>
            <div className="flex flex-col bg-[#2a2a2a] rounded-lg shadow-lg border border-[#444] overflow-hidden">
              {PROMOTION_PIECES.map((piece) => (
                <button
                  key={piece.code}
                  onClick={() => handlePromotion(piece.code)}
                  className="flex items-center justify-center px-2 py-1.5 hover:bg-[#3a3a3a] transition-colors"
                >
                  <span className="text-xs text-[#d4c5b5]">{piece.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-[520px] mt-3 flex items-center justify-between gap-2">
        <button
          onClick={handleUndo}
          disabled={history.length < 2 || !!winner}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-[#d4c5b5] text-sm hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 size={14} />
          Назад
        </button>

        <button
          onClick={showHint}
          disabled={!!winner || computerThinking}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-[#d4c5b5] text-sm hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Eye size={14} />
          Подсказка
        </button>

        <button
          onClick={() => switchDifficulty(difficulty)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-[#d4c5b5] text-sm hover:bg-[#3a3a3a] transition-colors"
        >
          <RotateCcw size={14} />
          Сброс
        </button>
      </div>

      {/* Difficulty buttons */}
      <div className="w-full max-w-[520px] mt-3 grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.id}
            onClick={() => switchDifficulty(diff.id as 'easy' | 'medium' | 'hard')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all ${
              difficulty === diff.id
                ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#555]'
            }`}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: diff.stars }).map((_, i) => (
                <div key={i} className="text-[#c9a84c] text-xs">★</div>
              ))}
            </div>
            <span className="text-xs font-bold" style={{ color: diff.color }}>{diff.label}</span>
            <span className="text-[10px] text-[#888]">{diff.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
