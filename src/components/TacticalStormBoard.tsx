'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Trophy, Zap, Timer, RotateCcw, ArrowLeft, Flame, Heart, X, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];
// board squares use CSS variables (Heirloom palette)

/* ═══ Piece image (cburnett SVGs) ═══ */
function PieceImg({ type, color, size }: { type: string; color: 'w' | 'b'; size?: number }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <div
      style={{
        width: size || '100%',
        height: size || '100%',
        backgroundImage: `url(/pieces/cburnett/${pieceKey}.svg)`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
      }}
    />
  );
}

/* ═══ Types ═══ */
interface Puzzle {
  fen: string;
  moves: string[];
  theme: string;
  rating: number;
}

interface PuzzleResult {
  puzzle: Puzzle;
  status: 'correct' | 'wrong';
  index: number;
  timeSpent: number;
}

interface Props {
  onComplete?: () => void;
  lessonId?: string;
}

type Phase = 'idle' | 'playing' | 'result' | 'review';
type Mode = 'rush5' | 'rush3' | 'survival';

/* ═══ Component ═══ */
export default function TacticalStormBoard({ onComplete }: Props) {
  /* ── State ── */
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('rush5');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [showCorrect, setShowCorrect] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);

  const moveIndexRef = useRef(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'none' | 'correct' | 'wrong'>('none');
  const [lives, setLives] = useState(3);
  const [puzzleHistory, setPuzzleHistory] = useState<PuzzleResult[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks'>('tasks');
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const [isBlack, setIsBlack] = useState(false);

  const [game, setGame] = useState<Chess | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [sqSize, setSqSize] = useState(56);

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

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);

  /* ── Refs ── */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const puzzleListRef = useRef<Puzzle[]>([]);
  const usedPuzzlesRef = useRef<Set<number>>(new Set());
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livesRef = useRef(3);
  const streakRef = useRef(0);
  const puzzleIndexRef = useRef(0);
  const puzzleStartTimeRef = useRef(Date.now());
  const currentPuzzleRef = useRef<Puzzle | null>(null);
  const timeLeftRef = useRef(300);
  const timerStartRef = useRef(0);
  const scoreRef = useRef(0);

  /* ── Resize ── */
  useEffect(() => {
    const upd = () => {
      const mob = window.innerWidth < 1024;
      setSqSize(mob
        ? Math.min(64, Math.max(38, Math.floor((window.innerWidth - 32) / 8)))
        : Math.min(72, Math.max(52, Math.floor((Math.min(window.innerWidth, 900) - 340) / 8)))
      );
    };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  /* ── Load puzzle DB ── */
  useEffect(() => {
    if (puzzleListRef.current.length > 0) return;
    fetch('/puzzles/tactical-storm.json?v=2')
      .then(r => r.json())
      .then(data => {
        const puzzles = (data.puzzles || []) as Puzzle[];
        puzzles.sort((a, b) => a.rating - b.rating);
        puzzleListRef.current = puzzles;
      })
      .catch(() => {
        puzzleListRef.current = getFallbackPuzzles().sort((a, b) => a.rating - b.rating);
      });
  }, []);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    };
  }, []);

  /* ── Helpers ── */
  const BIN_SIZE = 50;
  const BIN_COUNT = 20;

  const pickPuzzle = useCallback((score: number): Puzzle => {
    const list = puzzleListRef.current;
    if (!list.length) return getFallbackPuzzles()[0];

    const bin = Math.min(Math.floor(score / 5), BIN_COUNT - 1);
    const binStart = bin * BIN_SIZE;
    const binEnd = Math.min(binStart + BIN_SIZE, list.length);

    const candidates: number[] = [];
    for (let i = binStart; i < binEnd; i++) {
      if (!usedPuzzlesRef.current.has(i)) candidates.push(i);
    }

    let searchBin = bin + 1;
    while (candidates.length === 0 && searchBin < BIN_COUNT) {
      const s = searchBin * BIN_SIZE;
      const e = Math.min(s + BIN_SIZE, list.length);
      for (let i = s; i < e; i++) {
        if (!usedPuzzlesRef.current.has(i)) candidates.push(i);
      }
      searchBin++;
    }

    if (candidates.length === 0) {
      usedPuzzlesRef.current.clear();
      for (let i = binStart; i < binEnd; i++) candidates.push(i);
    }

    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    usedPuzzlesRef.current.add(idx);
    return list[idx];
  }, []);

  const loadPuzzle = useCallback((puzzle: Puzzle) => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    
    currentPuzzleRef.current = puzzle;
    setCurrentPuzzle(puzzle);
    const ng = new Chess(puzzle.fen);
    setIsBlack(ng.turn() === 'b');
    setGame(ng);
    setSelectedSquare(null);
    setDragPiece(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
    setMoveIndex(0);
    moveIndexRef.current = 0;
    puzzleStartTimeRef.current = Date.now();
  }, []);

  const startGame = useCallback(() => {
    const totalTime = mode === 'rush3' ? 180 : mode === 'rush5' ? 300 : 0;
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    streakRef.current = 0;
    setBestStreak(0);
    setLives(3);
    livesRef.current = 3;
    setPuzzleIndex(0);
    puzzleIndexRef.current = 0;
    setShowCorrect(false);
    setTimeLeft(totalTime);
    timeLeftRef.current = totalTime;
    setMessage('');
    setMessageType('none');
    setPuzzleHistory([]);
    setActiveTab('tasks');
    setReviewIndex(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
    usedPuzzlesRef.current.clear();

    const first = pickPuzzle(0);
    loadPuzzle(first);
    setPhase('playing');

    if (timerRef.current) clearInterval(timerRef.current);
    if (mode !== 'survival') {
      timerStartRef.current = Date.now();
      timeLeftRef.current = totalTime;
      setTimeLeft(totalTime);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
        timeLeftRef.current = totalTime - elapsed;
        setTimeLeft(timeLeftRef.current);
        if (timeLeftRef.current <= 0) {
          clearInterval(timerRef.current!);
          setPhase('result');
        }
      }, 500); // 500ms for smoother updates after tab switch
    }
  }, [mode, pickPuzzle, loadPuzzle]);

  const nextPuzzle = useCallback((wasCorrect: boolean) => {
    // Always reset showCorrect when moving to next puzzle
    setShowCorrect(false);
    if (wasCorrect) {
      streakRef.current += 1;
      setStreak(streakRef.current);
      setBestStreak(s => Math.max(s, streakRef.current));
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setMessageType('wrong');
      setMessage('Неверно!');
    }

    if (currentPuzzleRef.current) {
      const timeSpent = Math.round((Date.now() - puzzleStartTimeRef.current) / 1000);
      setPuzzleHistory(prev => [...prev, {
        puzzle: currentPuzzleRef.current!,
        status: wasCorrect ? 'correct' : 'wrong',
        index: prev.length,
        timeSpent
      }]);
    }

    if (!wasCorrect && mode === 'survival') {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('result');
      flashTimeoutRef.current = setTimeout(() => {
        setMessage('');
        setMessageType('none');
      }, 800);
      return;
    }

    if (!wasCorrect) {
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0 && mode !== 'survival') {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('result');
        flashTimeoutRef.current = setTimeout(() => {
          setMessage('');
          setMessageType('none');
        }, 800);
        return;
      }
    }

    // Load next puzzle after brief delay
    const delay = wasCorrect ? 0 : 800;
    
    flashTimeoutRef.current = setTimeout(() => {
      setShowCorrect(false);
      setMessage('');
      setMessageType('none');
      setPlayerAnimatingMove(null);
      setOpponentAnimatingMove(null);
      
      puzzleIndexRef.current += 1;
      setPuzzleIndex(puzzleIndexRef.current);
      const next = pickPuzzle(wasCorrect ? scoreRef.current : scoreRef.current);
      currentPuzzleRef.current = next;
      setCurrentPuzzle(next);
      const ng = new Chess(next.fen);
      setIsBlack(ng.turn() === 'b');
      setGame(ng);
      setSelectedSquare(null);
      setDragPiece(null);
      setMoveIndex(0);
      moveIndexRef.current = 0;
      puzzleStartTimeRef.current = Date.now();
    }, delay);
  }, [streak, puzzleIndex, pickPuzzle, mode]);

  /* ─── Move logic ─── */
  const processMove = useCallback((from: string, to: string) => {
    if (!game || !currentPuzzleRef.current) return;

    const testGame = new Chess(game.fen());
    let move;
    try {
      move = testGame.move({ from, to });
    } catch {
      move = null;
    }

    if (!move) {
      setSelectedSquare(null);
      return;
    }

    // Apply the move to the actual game state so the piece stays on target square
    const newGame = new Chess(game.fen());
    newGame.move({ from, to });

    // Build UCI from move result (handles promotions correctly)
    const userUci = move.from + move.to + (move.promotion || '');
    const expected = currentPuzzleRef.current.moves[moveIndexRef.current]?.replace(/[+#]/g, '');

    if (userUci !== expected) {
      // Wrong move — puzzle failed
      setShowCorrect(false); // reset green banner on wrong move
      setGame(newGame);
      nextPuzzle(false);
      return;
    }

    // Correct move
    moveIndexRef.current += 1;
    setMoveIndex(moveIndexRef.current);
    setSelectedSquare(null);

    const movingPiece = { type: move.piece.toUpperCase(), color: move.color as 'w' | 'b' };

    if (moveIndexRef.current >= currentPuzzleRef.current.moves.length) {
      // All moves solved — puzzle complete
      setPlayerAnimatingMove({ from, to, piece: movingPiece });
      flashTimeoutRef.current = setTimeout(() => {
        setGame(newGame);
        setPlayerAnimatingMove(null);
        setShowCorrect(true);
        flashTimeoutRef.current = setTimeout(() => {
          setShowCorrect(false);
          nextPuzzle(true);
        }, 1200);
      }, 200);
      return;
    }

    // More moves needed — animate player move, then schedule opponent
    setPlayerAnimatingMove({ from, to, piece: movingPiece });

    flashTimeoutRef.current = setTimeout(() => {
      setGame(newGame);
      setPlayerAnimatingMove(null);

      opponentTimeoutRef.current = setTimeout(() => {
        if (!currentPuzzleRef.current || moveIndexRef.current >= currentPuzzleRef.current.moves.length) return;

        const oppMove = currentPuzzleRef.current.moves[moveIndexRef.current];
        const oppFrom = oppMove.slice(0, 2);
        const oppTo = oppMove.slice(2, 4);

        const oppPiece = newGame.get(oppFrom as any);
        if (oppPiece) {
          setOpponentAnimatingMove({ from: oppFrom, to: oppTo, piece: { type: oppPiece.type.toUpperCase(), color: oppPiece.color as 'w' | 'b' } });
        }

        opponentTimeoutRef.current = setTimeout(() => {
          const afterOpp = new Chess(newGame.fen());
          afterOpp.move({ from: oppFrom, to: oppTo, promotion: 'q' });

          moveIndexRef.current += 1;
          setMoveIndex(moveIndexRef.current);
          setGame(afterOpp);
          setOpponentAnimatingMove(null);
          setIsBlack(afterOpp.turn() === 'b');
        }, 200);
      }, 600); // total ~800ms from player move
    }, 200);
  }, [game, nextPuzzle]);

  /* ─── CLICK ─── */
  const handleSquareClick = useCallback((square: string) => {
    if (!game) return;
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
  }, [game, selectedSquare, processMove]);

  /* ─── DRAG & DROP ─── */
  const handlePointerDown = useCallback((e: React.PointerEvent, sq: string) => {
    if (!game) return;
    const piece = game.get(sq as any);
    if (!piece || piece.color !== game.turn()) return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, square: sq, moved: false, pointerId: e.pointerId };
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
      if (start.moved) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest('[data-square]') as HTMLElement | null;
        const targetSq = cell?.dataset.square || null;
        if (targetSq && targetSq !== start.square) {
          processMove(start.square, targetSq);
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
  }, [game, processMove]);

  /* ─── Helpers ─── */
  const getPieceAt = (sq: string) => {
    if (!game) return null;
    const p = game.get(sq as any);
    if (!p) return null;
    return { type: p.type.toUpperCase(), color: p.color as 'w' | 'b' };
  };

  const isLight = (fi: number, ri: number) => (fi + ri) % 2 === 0;

  const validMoves = selectedSquare && game
    ? (game.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to) as string[])
    : dragPiece && game
      ? (game.moves({ square: dragPiece.square as any, verbose: true }).map(m => m.to) as string[])
      : [];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };


  /* ═══════════════════════════ IDLE ═══════════════════════════ */
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto">
        {/* Hero card */}
        <div
          className="rounded-2xl py-7 px-6 w-full text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2C241B 0%, #3A2E1F 50%, #2C241B 100%)',
          }}
        >
          <h2 className="text-[26px] font-bold text-white mb-2">Тактический штурм</h2>
          <p className="text-sm" style={{ color: '#E8D5B5' }}>
            Решайте задачи на скорость. 3 жизни — нарастающая сложность!
          </p>
          <div
            className="absolute bottom-0 left-[10%] right-[10%] h-[3px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <button
            onClick={() => setMode('rush5')}
            className={`py-4 px-2 rounded-2xl border-2 text-center transition-all duration-200 ease-out ${
              mode === 'rush5'
                ? 'bg-[#F9F8F6] border-[#C9A84C] shadow-[0_0_0_2px_rgba(201,168,76,0.15),0_4px_14px_rgba(201,168,76,0.15)] -translate-y-0.5'
                : 'bg-white border-[#E8E0D5] hover:bg-[#F9F8F6] hover:-translate-y-0.5 hover:border-[#D4C9B8] hover:shadow-[0_4px_14px_rgba(44,36,27,0.12)] shadow-[0_2px_8px_rgba(44,36,27,0.06)]'
            }`}
          >
            <Clock className="w-8 h-8 mx-auto mb-2 text-[#C9A84C]" />
            <div className="font-bold text-[#2C241B] text-[15px]">5 мин</div>
            <div className="text-xs text-[#8B7355] mt-1">Классика</div>
          </button>
          <button
            onClick={() => setMode('rush3')}
            className={`py-4 px-2 rounded-2xl border-2 text-center transition-all duration-200 ease-out ${
              mode === 'rush3'
                ? 'bg-[#F9F8F6] border-[#C9A84C] shadow-[0_0_0_2px_rgba(201,168,76,0.15),0_4px_14px_rgba(201,168,76,0.15)] -translate-y-0.5'
                : 'bg-white border-[#E8E0D5] hover:bg-[#F9F8F6] hover:-translate-y-0.5 hover:border-[#D4C9B8] hover:shadow-[0_4px_14px_rgba(44,36,27,0.12)] shadow-[0_2px_8px_rgba(44,36,27,0.06)]'
            }`}
          >
            <Zap className="w-8 h-8 mx-auto mb-2 text-[#C9A84C]" />
            <div className="font-bold text-[#2C241B] text-[15px]">3 мин</div>
            <div className="text-xs text-[#8B7355] mt-1">Блиц</div>
          </button>
          <button
            onClick={() => setMode('survival')}
            className={`py-4 px-2 rounded-2xl border-2 text-center transition-all duration-200 ease-out ${
              mode === 'survival'
                ? 'bg-[#F9F8F6] border-[#C9A84C] shadow-[0_0_0_2px_rgba(201,168,76,0.15),0_4px_14px_rgba(201,168,76,0.15)] -translate-y-0.5'
                : 'bg-white border-[#E8E0D5] hover:bg-[#F9F8F6] hover:-translate-y-0.5 hover:border-[#D4C9B8] hover:shadow-[0_4px_14px_rgba(44,36,27,0.12)] shadow-[0_2px_8px_rgba(44,36,27,0.06)]'
            }`}
          >
            <Heart className="w-8 h-8 mx-auto mb-2 text-[#C9A84C]" />
            <div className="font-bold text-[#2C241B] text-[15px]">Выживание</div>
            <div className="text-xs text-[#8B7355] mt-1">1 ошибка = конец</div>
          </button>
        </div>

        <button
          onClick={startGame}
          className="w-full py-[18px] rounded-2xl text-lg font-bold uppercase tracking-widest text-[#2C241B] transition-all duration-200 ease-out relative overflow-hidden active:scale-[0.98] active:translate-y-0"
          style={{
            background: 'linear-gradient(180deg, #D4A84C 0%, #C9A84C 100%)',
            boxShadow: '0 4px 16px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #C9A84C 0%, #B8973D 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #D4A84C 0%, #C9A84C 100%)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Начать штурм
        </button>
      </div>
    );
  }


  /* ═══════════════════════════ RESULT ═══════════════════════════ */
  if (phase === 'result') {
    const correctCount = puzzleHistory.filter(p => p.status === 'correct').length;
    const wrongCount = puzzleHistory.filter(p => p.status === 'wrong').length;
    const avgTime = correctCount > 0
      ? Math.round(puzzleHistory.filter(p => p.status === 'correct').reduce((a, b) => a + b.timeSpent, 0) / correctCount)
      : 0;

    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
        {/* Score */}
        <div className="w-full rounded-2xl p-6 text-center" style={{ background: '#2C241B' }}>
          <div className="text-6xl font-bold text-white mb-1">{score}</div>
          <div className="text-sm" style={{ color: '#8B7355' }}>задач решено</div>
        </div>

        {/* Tabs */}
        <div className="w-full flex rounded-xl overflow-hidden" style={{ background: '#2C241B' }}>
          <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 text-sm font-bold transition duration-150 ${activeTab==='summary'?'text-white border-b-2 border-[#C9A84C]':'text-[#8B7355] hover:text-[#B8A08A]'}`}>
            Краткое описание
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-3 text-sm font-bold transition duration-150 ${activeTab==='tasks'?'text-white border-b-2 border-[#C9A84C]':'text-[#8B7355] hover:text-[#B8A08A]'}`}>
            Задачи
          </button>
        </div>

        {activeTab === 'summary' && (
          <div className="w-full rounded-xl p-5 text-sm" style={{ background: '#2C241B' }}>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#4A3A2A' }}>
              <div className="flex items-center gap-2" style={{ color: '#8B7355' }}>
                <Flame className="w-4 h-4" /> Рекордная серия
              </div>
              <div className="text-white font-bold">{bestStreak}</div>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#4A3A2A' }}>
              <div className="flex items-center gap-2" style={{ color: '#8B7355' }}>
                <Trophy className="w-4 h-4" /> Труднейшая задача
              </div>
              <div className="text-white font-bold">
                {puzzleHistory.length > 0 ? Math.max(...puzzleHistory.map(p => p.puzzle.rating)) : 0}
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#4A3A2A' }}>
              <div className="flex items-center gap-2" style={{ color: '#8B7355' }}>
                <Timer className="w-4 h-4" /> В среднем на задачу
              </div>
              <div className="text-white font-bold">{avgTime}s</div>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#4A3A2A' }}>
              <div className="flex items-center gap-2" style={{ color: '#8B7355' }}>
                <Check className="w-4 h-4" /> Верно
              </div>
              <div className="font-bold" style={{ color: '#C9A84C' }}>{correctCount}</div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2" style={{ color: '#8B7355' }}>
                <X className="w-4 h-4" /> Ошибок
              </div>
              <div className="font-bold" style={{ color: '#B04A3A' }}>{wrongCount}</div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-5 gap-2">
            {puzzleHistory.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  setReviewIndex(i);
                  setPhase('review');
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition hover:scale-105 border ${
                  r.status === 'correct'
                    ? 'bg-[#3A2E1F] border-[rgba(201,168,76,0.25)] hover:bg-[#4A3A2A]'
                    : 'bg-[#3A2E1F] border-[rgba(176,74,58,0.25)] hover:bg-[#4A3A2A]'
                }`}
              >
                {r.status === 'correct' ? (
                  <Check className="w-4 h-4 text-[#C9A84C]" />
                ) : (
                  <X className="w-4 h-4 text-[#B04A3A]" />
                )}
                <span className="text-[10px] text-[#8B7355]">{r.puzzle.rating}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex w-full gap-3">
          <button onClick={() => setPhase('idle')} className="flex-1 py-3 bg-[#4A3A2A] hover:bg-[#5A4A3A] text-white rounded-xl font-bold flex items-center justify-center gap-1 transition duration-150">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <button onClick={startGame} className="flex-1 py-3 bg-[#C9A84C] hover:bg-[#B8973D] text-[#2C241B] rounded-xl font-bold flex items-center justify-center gap-1 transition duration-150">
            <RotateCcw className="w-4 h-4" /> Играть снова
          </button>
        </div>
      </div>
    );
  }


  /* ═══════════════════════════ REVIEW ═══════════════════════════ */
  if (phase === 'review' && reviewIndex !== null && puzzleHistory[reviewIndex]) {
    const result = puzzleHistory[reviewIndex];
    const reviewGame = new Chess(result.puzzle.fen);
    const moveFrom = result.puzzle.moves[0]?.substring(0, 2);
    const moveTo = result.puzzle.moves[0]?.substring(2, 4);
    const reviewIsBlack = reviewGame.turn() === 'b';

    const rFiles = reviewIsBlack ? REVERSED_FILES : FILES;
    const rRanks = reviewIsBlack ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;

    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
        <div className="w-full rounded-xl p-4 flex items-center justify-between" style={{ background: '#2C241B' }}>
          <button
            onClick={() => {
              setReviewIndex(null);
              setPhase('result');
            }}
            className="text-[#8B7355] hover:text-[#C9A84C] flex items-center gap-1 text-sm transition duration-150"
          >
            <ChevronLeft className="w-4 h-4" /> К результатам
          </button>
          <span className="text-white font-bold text-sm">
            Задача {reviewIndex + 1} / {puzzleHistory.length}
          </span>
        </div>

        <div className="w-full rounded-xl p-3 text-center" style={{ background: '#2C241B' }}>
          <div className={`text-sm font-bold mb-1 ${result.status === 'correct' ? 'text-[#C9A84C]' : 'text-[#B04A3A]'}`}>
            {result.status === 'correct' ? '✓ Верно' : '✗ Ошибка'}
          </div>
          <div className="text-[#8B7355] text-xs">
            Рейтинг: {result.puzzle.rating} | Время: {result.timeSpent}с
          </div>
          {result.puzzle.moves[0] && (
            <div className="text-white text-sm mt-1">
              Правильный ход: <span className="font-bold text-[#C9A84C]">{moveFrom} → {moveTo}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center w-full">
          <div className="relative select-none" style={{ width: sqSize * 8, height: sqSize * 8 }}>
            {rRanks.map((rank, ri) =>
              rFiles.map((file, fi) => {
                const sq = file + rank;
                const pieceObj = reviewGame.get(sq as any);
                const isLight = (ri + fi) % 2 === 0;
                const isFrom = sq === moveFrom;
                const isTo = sq === moveTo;

                return (
                  <div
                    key={sq}
                    data-square={sq}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: fi * sqSize,
                      top: ri * sqSize,
                      width: sqSize,
                      height: sqSize,
                      backgroundColor: isFrom || isTo ? 'rgba(201,168,76,0.45)' : (isLight ? 'var(--square-light)' : 'var(--square-dark)'),
                      opacity: isFrom ? 0.5 : 1,
                    }}
                  >
                    {pieceObj && (
                      <div style={{ width: sqSize * 0.82, height: sqSize * 0.82 }}>
                        <PieceImg type={pieceObj.type.toUpperCase()} color={pieceObj.color as 'w' | 'b'} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex w-full gap-3">
          <button
            onClick={() => setReviewIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev))}
            disabled={reviewIndex === 0}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition duration-150 ${reviewIndex > 0 ? 'bg-[#4A3A2A] text-white hover:bg-[#5A4A3A]' : 'bg-[#2C241B] text-[#5A4A3A] cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Предыдущая
          </button>
          <button
            onClick={() => setReviewIndex(prev => (prev !== null && prev < puzzleHistory.length - 1 ? prev + 1 : prev))}
            disabled={reviewIndex >= puzzleHistory.length - 1}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition duration-150 ${reviewIndex < puzzleHistory.length - 1 ? 'bg-[#4A3A2A] text-white hover:bg-[#5A4A3A]' : 'bg-[#2C241B] text-[#5A4A3A] cursor-not-allowed'}`}
          >
            Следующая <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════ PLAYING ═══════════════════════════ */
  const turnText = game ? (game.turn() === 'w' ? 'Ход белых' : 'Ход чёрных') : '';

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex w-full justify-between items-center bg-white border border-[#E8E0D5] rounded-xl p-3 shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs text-[#8B7355] uppercase">Очки</span>
          <span className="text-2xl font-bold text-[#2C241B]">{score}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-[#C9A84C]">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{streak}</span>
          </div>
          {mode !== 'survival' && (
            <span className="text-lg font-mono font-bold text-[#2C241B]">{formatTime(Math.ceil(timeLeft))}</span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-[#8B7355] uppercase">Задача</span>
          <span className="text-2xl font-bold text-[#2C241B]">{puzzleIndex + 1}</span>
        </div>
      </div>

      {/* Timer bar */}
      {mode !== 'survival' && (
        <div className="w-full h-1.5 bg-[#E8E0D5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A84C] rounded-full"
            style={{
              width: `${(timeLeft / (mode === 'rush3' ? 180 : 300)) * 100}%`,
              transition: 'width 1s linear',
            }}
          />
        </div>
      )}

      {/* Turn / Theme hint */}
      <div className="flex w-full justify-between items-center px-1">
        <span className="text-sm font-medium text-[#2C241B]">{turnText}</span>
        {currentPuzzle && (
          <span className="text-xs text-[#8B7355] uppercase bg-[#F5F0E8] border border-[#E8E0D5] px-2 py-0.5 rounded">
            {currentPuzzle.theme}
          </span>
        )}
      </div>

      {/* Feedback flash — wrong only */}
      {messageType === 'wrong' && (
        <div className="w-full text-center py-2 rounded-lg font-bold text-lg bg-[#B04A3A] text-white">
          {message}
        </div>
      )}

      {/* Toast container — always reserves space, no layout shift */}
      <div className="h-10 w-full flex justify-center items-start relative">
        <div
          className={`absolute top-0 transition-all duration-200 ${
            showCorrect ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="bg-[#C9A84C] text-[#2C241B] px-6 py-2 rounded-lg font-bold text-base shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            Правильно
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex justify-center w-full relative">
        <div
          data-board
          className="grid border-[3px] border-[#2C241B] rounded-sm relative select-none"
          style={{
            gridTemplateColumns: `repeat(8, ${sqSize}px)`,
            gridTemplateRows: `repeat(8, ${sqSize}px)`,
            touchAction: 'none',
          }}
        >
          {(isBlack ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS).map((rank, ri) =>
            (isBlack ? REVERSED_FILES : FILES).map((file, fi) => {
              const sq = `${file}${rank}`;
              const pieceObj = getPieceAt(sq);
              const light = isLight(isBlack ? 7-fi : fi, isBlack ? 7-ri : ri);
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
                    cursor: pieceObj && pieceObj.color === game?.turn() ? 'grab' : 'default',
                    touchAction: 'none',
                    backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)',
                    opacity: isDragSource ? 0.3 : 1,
                  }}
                  onClick={() => handleSquareClick(sq)}
                  onPointerDown={(e) => handlePointerDown(e, sq)}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {/* Selection highlight */}
                  {sel && (
                    <div className="absolute inset-0 bg-[rgba(184,149,106,0.35)] pointer-events-none z-10" />
                  )}
                    {lastMove && sq === lastMove.from && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.55)] pointer-events-none z-[5]" />
                    )}
                    {lastMove && sq === lastMove.to && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.70)] pointer-events-none z-[5]" />
                    )}


                  {/* Coordinates */}
                  {fi === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>{rank}</span>
                  )}
                  {ri === 7 && (
                    <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>{file}</span>
                  )}

                  {/* Valid move indicator */}
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

                  {/* Piece */}
                  {pieceObj && !isDragSource && !(playerAnimatingMove && sq === playerAnimatingMove.from) && (
                    <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                      <PieceImg type={pieceObj.type} color={pieceObj.color} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Player ghost */}
        {playerAnimatingMove && (() => {
          const files = isBlack ? REVERSED_FILES : FILES;
          const ranks = isBlack ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
          const fromFi = files.indexOf(playerAnimatingMove.from[0]);
          const fromRi = ranks.indexOf(playerAnimatingMove.from[1]);
          const toFi = files.indexOf(playerAnimatingMove.to[0]);
          const toRi = ranks.indexOf(playerAnimatingMove.to[1]);
          return (
            <div
              className="absolute pointer-events-none z-40 animate-player-move flex items-center justify-center"
              style={{
                left: fromFi * sqSize,
                top: fromRi * sqSize,
                width: sqSize,
                height: sqSize,
                ['--ghost-dx' as any]: `${(toFi - fromFi) * sqSize}px`,
                ['--ghost-dy' as any]: `${(toRi - fromRi) * sqSize}px`,
              }}
            >
              <div style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                <PieceImg type={playerAnimatingMove.piece.type} color={playerAnimatingMove.piece.color} />
              </div>
            </div>
          );
        })()}

        {/* Opponent ghost */}
        {opponentAnimatingMove && (() => {
          const files = isBlack ? REVERSED_FILES : FILES;
          const ranks = isBlack ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
          const fromFi = files.indexOf(opponentAnimatingMove.from[0]);
          const fromRi = ranks.indexOf(opponentAnimatingMove.from[1]);
          const toFi = files.indexOf(opponentAnimatingMove.to[0]);
          const toRi = ranks.indexOf(opponentAnimatingMove.to[1]);
          return (
            <div
              className="absolute pointer-events-none z-40 animate-opponent-move flex items-center justify-center"
              style={{
                left: fromFi * sqSize,
                top: fromRi * sqSize,
                width: sqSize,
                height: sqSize,
                ['--ghost-dx' as any]: `${(toFi - fromFi) * sqSize}px`,
                ['--ghost-dy' as any]: `${(toRi - fromRi) * sqSize}px`,
              }}
            >
              <div style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                <PieceImg type={opponentAnimatingMove.piece.type} color={opponentAnimatingMove.piece.color} />
              </div>
            </div>
          );
        })()}

        {/* Floating dragged piece */}
        {dragPiece && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: dragPos.x - Math.round(sqSize * 0.425),
              top: dragPos.y - Math.round(sqSize * 0.425),
              width: Math.round(sqSize * 0.85),
              height: Math.round(sqSize * 0.85),
            }}
          >
            <PieceImg type={dragPiece.type} color={dragPiece.color} size={Math.round(sqSize * 0.85)} />
          </div>
        )}
      </div>

      {/* Error indicators + Difficulty */}
      <div className="flex w-full justify-between items-center mt-1">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded flex items-center justify-center ${
                i < (3 - lives)
                  ? 'bg-[#B04A3A] text-white'
                  : 'bg-[#F5F0E8] text-[#8B7355]'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>
        {currentPuzzle && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#8B7355] uppercase">Сложность</span>
            <span className="text-sm font-bold text-[#2C241B]">{currentPuzzle.rating}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex w-full gap-2 mt-1">
        <button onClick={() => setPhase('idle')} className="w-full py-2.5 bg-[#F5F0E8] hover:bg-[#EBE4DA] text-[#2C241B] border border-[#D4C9B8] rounded-lg font-medium text-sm transition duration-150 ease-out">
          Стоп
        </button>
      </div>
    </div>
  );
}

/* ═══ Fallback puzzles if JSON fails ═══ */
function getFallbackPuzzles(): Puzzle[] {
  return [
    { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', moves: ['Qxf7#'], theme: 'mate-in-1', rating: 400 },
    { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', moves: ['Nxe5'], theme: 'fork', rating: 500 },
    { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', moves: ['Qh4'], theme: 'attack', rating: 600 },
    { fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', moves: ['Nxe5'], theme: 'fork', rating: 700 },
    { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', moves: ['Nxe5'], theme: 'fork', rating: 800 },
  ];
}
