'use client';

import AvatarBubble from './AvatarBubble';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, ChevronRight, Star, Eye, Undo2 } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];

// Italian Game forced line (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5)
const ITALIAN_LINE = [
  { white: { from: 'e2', to: 'e4' }, black: { from: 'e7', to: 'e5' } },
  { white: { from: 'g1', to: 'f3' }, black: { from: 'b8', to: 'c6' } },
  { white: { from: 'f1', to: 'c4' }, black: { from: 'f8', to: 'c5' } },
];

const LEVELS = [
  { id: 0, elo: 200,  label: 'Начинающий', description: 'Компьютер почти не думает и часто ходит случайно', color: '#D4A84C', depth: 1, blunder: 80 },
  { id: 1, elo: 400,  label: 'Любитель',   description: 'Компьютер думает немного, но всё ещё ошибается', color: '#C29850', depth: 2, blunder: 50 },
  { id: 2, elo: 650,  label: 'Средний',    description: 'Компьютер играет осторожно, ошибки редки',     color: '#B07838', depth: 3, blunder: 25 },
  { id: 3, elo: 900,  label: 'Опытный',    description: 'Компьютер почти не ошибается',                 color: '#8A6040', depth: 4, blunder: 5 },
  { id: 4, elo: 1200, label: 'Мастер',     description: 'Компьютер играет сильно, никаких слабостей',   color: '#4A2A1A', depth: 5, blunder: 0 },
];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
  { code: 'n', name: 'Конь' },
];

function isLight(f: number, r: number) { return (f + r) % 2 === 0; }

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

interface AnimatingMove {
  from: string;
  to: string;
  piece: { type: string; color: 'w' | 'b' };
}

export default function ComputerPlayBoard({ onComplete, lessonId, lessonTitle }: { onComplete: () => void; lessonId?: string; lessonTitle?: string }) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<'w' | 'random' | 'b'>('random');
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [hideMoveHints, setHideMoveHints] = useState(false);
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [sqSize, setSqSize] = useState(52);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [thinking, setThinking] = useState(false);
  const [gameOver, setGameOver] = useState<{ result: string; reason: string } | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [promotionPending, setPromotionPending] = useState<{from:string; to:string}|null>(null);
  const [history, setHistory] = useState<{fen: string; openingStep: number; lastMove: {from: string; to: string} | null}[]>([]);
  const [hintComputing, setHintComputing] = useState(false);

  const [lastMove, setLastMove] = useState<{from: string; to: string} | null>(null);
  const [hintArrow, setHintArrow] = useState<{from: string; to: string} | null>(null);

  // Ghost animation states
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<AnimatingMove | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<AnimatingMove | null>(null);

  const mountedRef = useRef(true);
  const workerRef = useRef<Worker | null>(null);
  const openingStepRef = useRef(0);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const wasDragRef = useRef(false);

  const storageKey = lessonId ? `computerplay_progress_${lessonId}` : 'computerplay_progress';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLevelStars(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const isMobile = window.innerWidth < 1024;
        if (isMobile) {
          setSqSize(Math.min(64, Math.max(36, Math.floor((window.innerWidth - 24) / 8))));
        } else {
          setSqSize(Math.min(64, Math.max(48, Math.floor((window.innerWidth - 340) / 8))));
        }
      }, 150);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      clearTimeout(timeout);
    };
  }, []);

  const isReversed = playerColor === 'b';
  const files = isReversed ? REVERSED_FILES : FILES;
  const ranks = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
  useEffect(() => {
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;
    worker.postMessage('uci');
    return () => { worker.terminate(); };
  }, []);

  const makeComputerMove = useCallback((g: Chess, level: number, openStep: number) => {
    const cfg = LEVELS[level];
    if (!cfg) return;

    // ── Italian opening forced line ──
    if (openStep < ITALIAN_LINE.length) {
      const forced = playerColor === 'w' ? ITALIAN_LINE[openStep].black : ITALIAN_LINE[openStep].white;
      try {
        const movedPiece = g.get(forced.from as any);
        const pieceData = movedPiece
          ? { type: movedPiece.type.toUpperCase(), color: movedPiece.color as 'w' | 'b' }
          : { type: 'P', color: 'b' as 'w' | 'b' };

        setOpponentAnimatingMove({ from: forced.from, to: forced.to, piece: pieceData });
        setLastMove({ from: forced.from, to: forced.to });

        setTimeout(() => {
          if (!mountedRef.current) return;
          const newG = new Chess(g.fen());
          newG.move({ from: forced.from, to: forced.to });
          setGame(new Chess(newG.fen()));
          setOpponentAnimatingMove(null);
          openingStepRef.current = openStep + 1;
          checkGameOver(newG, 'after computer forced');
        }, 200);
        return;
      } catch {}
    }

    if (!workerRef.current) return;
    setThinking(true);
    const worker = workerRef.current;

    const onMsg = (e: MessageEvent) => {
      const line = e.data;
      if (typeof line !== 'string') return;

      if (line.startsWith('bestmove')) {
        worker.removeEventListener('message', onMsg);
        setThinking(false);

        const parts = line.split(' ');
        const bestMove = parts[1];
        if (!bestMove || bestMove === '(none)') return;

        let moveUci: string;
        if (cfg.blunder > 0 && Math.random() * 100 < cfg.blunder) {
          const legal = g.moves({ verbose: true });
          if (legal.length > 0) {
            const random = legal[Math.floor(Math.random() * legal.length)];
            moveUci = random.from + random.to + (random.promotion || '');
          } else {
            moveUci = bestMove;
          }
        } else {
          moveUci = bestMove;
        }

        try {
          const from = moveUci.slice(0, 2);
          const to = moveUci.slice(2, 4);
          const promotion = moveUci.slice(4, 5) || undefined;

          const movedPiece = g.get(from as any);
          const pieceData = movedPiece
            ? { type: movedPiece.type.toUpperCase(), color: movedPiece.color as 'w' | 'b' }
            : { type: 'P', color: 'b' as 'w' | 'b' };

          // Show opponent ghost animation
          setOpponentAnimatingMove({ from, to, piece: pieceData });
          setLastMove({ from, to });

          // After 200ms update board and remove ghost
          setTimeout(() => {
            if (!mountedRef.current) return;
            const newG = new Chess(g.fen());
            newG.move({ from, to, promotion });
            setGame(new Chess(newG.fen()));
            setOpponentAnimatingMove(null);
            checkGameOver(newG, 'after computer');
          }, 200);
        } catch {}
      }
    };

    worker.addEventListener('message', onMsg);
    worker.postMessage('setoption name UCI_LimitStrength value true');
    worker.postMessage(`setoption name UCI_Elo value ${cfg.elo}`);
    worker.postMessage('setoption name Skill Level value ' + Math.min(20, Math.max(0, cfg.depth)));
    worker.postMessage(`position fen ${g.fen()}`);
    worker.postMessage(`go depth ${cfg.depth}`);
  }, [playerColor]);

  const getStockfishHint = useCallback((g: Chess) => {
    if (!g) return;

    // ── Italian opening hint ──
    const step = openingStepRef.current;
    if (step < ITALIAN_LINE.length && g.turn() === playerColor) {
      if (playerColor === 'w') {
        setHintArrow({ from: ITALIAN_LINE[step].white.from, to: ITALIAN_LINE[step].white.to });
      } else {
        setHintArrow({ from: ITALIAN_LINE[step].black.from, to: ITALIAN_LINE[step].black.to });
      }
      return;
    }

    if (!workerRef.current) return;
    setHintComputing(true);
    const worker = workerRef.current;

    const onMsg = (e: MessageEvent) => {
      const line = e.data;
      if (typeof line !== 'string') return;

      if (line.startsWith('bestmove')) {
        worker.removeEventListener('message', onMsg);
        setHintComputing(false);

        const parts = line.split(' ');
        const bestMove = parts[1];
        if (!bestMove || bestMove === '(none)') return;

        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);
        setHintArrow({ from, to });
      }
    };

    worker.addEventListener('message', onMsg);
    worker.postMessage('setoption name Skill Level value 20');
    worker.postMessage('setoption name UCI_LimitStrength value false');
    worker.postMessage(`position fen ${g.fen()}`);
    worker.postMessage('go depth 10');
  }, []);

  const checkGameOver = useCallback((g: Chess, context: string) => {
    if (g.isGameOver()) {
      let result: string;
      let reason: string;
      if (g.isCheckmate()) {
        result = g.turn() === 'w' ? '0-1' : '1-0';
        reason = 'Мат!';
      } else if (g.isDraw()) {
        result = '½-½';
        reason = 'Ничья';
      } else {
        result = '½-½';
        reason = 'Партия окончена';
      }

      const playerWon = result === '1-0' && playerColor === 'w' || result === '0-1' && playerColor === 'b';
      setGameOver({ result, reason });

      if (playerWon && selectedLevel !== null) {
        setLevelStars(prev => {
          const next = { ...prev, [selectedLevel]: Math.max(prev[selectedLevel] || 0, 1) };
          try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
          return next;
        });
      }

      if (playerWon) {
        setIsComplete(true);
        setMessage('Победа! Вы выиграли у компьютера!');
        onComplete();
      } else {
        setMessage(result === '½-½' ? 'Ничья!' : 'Поражение. Попробуйте снова!');
      }
    }
  }, [playerColor, selectedLevel, storageKey, onComplete]);

  const startGame = useCallback((levelIndex: number) => {
    let color: 'w' | 'b' = 'w';
    if (selectedColor === 'random') {
      color = Math.random() < 0.5 ? 'w' : 'b';
    } else if (selectedColor === 'b') {
      color = 'b';
    }
    setPlayerColor(color);

    const g = new Chess();
    setSelectedLevel(levelIndex);
    setGame(g);
    setSelectedSquare(null);
    setMessage('');
    setIsComplete(false);
    setGameOver(null);
    setThinking(false);
    setPromotionPending(null);
    setLastMove(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
    wasDragRef.current = false;
    setDragPiece(null);
    pointerStartRef.current = null;
    openingStepRef.current = 0;
    setHistory([]);

    if (color === 'b') {
      // Computer moves first as white — no forced line for white
      setTimeout(() => {
        if (mountedRef.current) makeComputerMove(g, levelIndex, openingStepRef.current);
      }, 500);
    }
  }, [selectedColor, makeComputerMove]);

  const undoMove = useCallback(() => {
    if (history.length === 0 || !game) return;
    const last = history[history.length - 1];
    setGame(new Chess(last.fen));
    openingStepRef.current = last.openingStep;
    setSelectedSquare(null);
    setPromotionPending(null);
    setPlayerAnimatingMove(null);
    setOpponentAnimatingMove(null);
    setLastMove(last.lastMove);
    wasDragRef.current = false;
    setDragPiece(null);
    pointerStartRef.current = null;
    setHistory(h => h.slice(0, -1));
  }, [history, game]);

  const reset = useCallback(() => {
    if (selectedLevel !== null) {
      // Preserve color choice on reset
      startGame(selectedLevel);
    }
  }, [selectedLevel, startGame]);

  // ──── PROCESS PLAYER MOVE ────
  const processMove = useCallback((from: string, to: string, promotion?: string) => {
    if (!game || selectedLevel === null || isComplete || gameOver) return;
    const g = new Chess(game.fen());
    if (g.turn() !== playerColor) return;

    const prevFen = game.fen();
    const prevStep = openingStepRef.current;

    // Clear hint arrow on move
    setHintArrow(null);

    // Check if pawn promotion needed
    const piece = g.get(from as any);
    if (piece?.type === 'p' && !promotion) {
      const lastRank = playerColor === 'w' ? '8' : '1';
      if (to[1] === lastRank) {
        setPromotionPending({ from, to });
        setSelectedSquare(null);
        return;
      }
    }

    try {
      const move = g.move({ from, to, promotion });
      if (!move) return;

      const pieceData = piece
        ? { type: piece.type.toUpperCase(), color: piece.color as 'w' | 'b' }
        : { type: 'P', color: playerColor };

      const wasDrag = wasDragRef.current;
      wasDragRef.current = false;

      if (!wasDrag) {
        setPlayerAnimatingMove({ from, to, piece: pieceData });
      }
      setLastMove({ from, to });
      setSelectedSquare(null);
      setHistory(h => [...h, { fen: prevFen, openingStep: prevStep, lastMove }]);

      // Commit drops immediately; wait for the ghost on click moves.
      const finishPlayerMove = () => {
        if (!mountedRef.current) return;
        setGame(new Chess(g.fen()));
        setPlayerAnimatingMove(null);

        if (g.isGameOver()) {
          checkGameOver(g, 'after player');
          return;
        }

        // ── Italian opening tracking ──
        const step = openingStepRef.current;
        if (step < ITALIAN_LINE.length) {
          const expected = playerColor === 'w' ? ITALIAN_LINE[step].white : ITALIAN_LINE[step].black;
          if (move.from === expected.from && move.to === expected.to) {
            openingStepRef.current = step + 1;  // Followed the line
          } else {
            openingStepRef.current = ITALIAN_LINE.length;  // Deviated
          }
        }

        // Computer's turn (forced line or Stockfish)
        setTimeout(() => {
          if (mountedRef.current) makeComputerMove(new Chess(g.fen()), selectedLevel, openingStepRef.current);
        }, 600);
      };

      if (wasDrag) {
        finishPlayerMove();
      } else {
        setTimeout(finishPlayerMove, 200);
      }
    } catch {
      wasDragRef.current = false;
    }
  }, [game, selectedLevel, isComplete, gameOver, playerColor, checkGameOver, makeComputerMove]);

  // ──── CLICK ────
  const handleSquareClick = useCallback((sq: string) => {
    if (!game || game.turn() !== playerColor || isComplete || gameOver || thinking || promotionPending) return;
    const piece = game.get(sq as any);

    if (selectedSquare === sq) {
      setSelectedSquare(null);
      setHideMoveHints(false);
    } else if (selectedSquare && piece && piece.color === playerColor) {
      setSelectedSquare(sq);
      setHideMoveHints(false);
    } else if (selectedSquare) {
      const legalTargets = game.moves({ square: selectedSquare as any, verbose: true }).map(move => move.to as string);
      const selectedPiece = game.get(selectedSquare as any);
      const promotionTarget = selectedPiece?.type === 'p' && sq[1] === (playerColor === 'w' ? '8' : '1');
      if (!legalTargets.includes(sq) && !promotionTarget) {
        setSelectedSquare(null);
        setDragPiece(null);
        setHideMoveHints(true);
        return;
      }
      setHideMoveHints(false);
      wasDragRef.current = false;
      processMove(selectedSquare, sq);
    } else {
      if (piece && piece.color === playerColor) {
        setSelectedSquare(sq);
        setHideMoveHints(false);
      }
    }
  }, [selectedSquare, processMove, playerColor, isComplete, gameOver, thinking, promotionPending]);

  // ──── DRAG & DROP ────
  const handlePointerDown = useCallback((e: React.PointerEvent, sq: string) => {
    if (!game || game.turn() !== playerColor || isComplete || gameOver || thinking || promotionPending) return;
    const piece = game.get(sq as any);
    if (!piece || piece.color !== playerColor) return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, square: sq, moved: false, pointerId: e.pointerId };
  }, [game, playerColor, isComplete, gameOver, thinking, promotionPending]);

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
        start.moved = true;
        wasDragRef.current = true;
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
        // Clear drag BEFORE processMove to prevent drag + ghost overlay overlap
        setDragPiece(null);
        pointerStartRef.current = null;
        if (targetSq && targetSq !== start.square) {
          processMove(start.square, targetSq);
        } else {
          wasDragRef.current = false;
        }
        return;
      }
      pointerStartRef.current = null;
    };

    const handleGlobalCancel = (e: PointerEvent) => {
      if (pointerStartRef.current && e.pointerId === pointerStartRef.current.pointerId) {
        wasDragRef.current = false;
        setDragPiece(null);
        pointerStartRef.current = null;
      }
    };

    const handleBlur = () => {
      setDragPiece(null);
      pointerStartRef.current = null;
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalCancel);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalCancel);
      window.removeEventListener('blur', handleBlur);
    };
  }, [game, processMove]);

  const getPieceAt = (sq: string) => {
    if (!game) return null;
    const p = game.get(sq as any);
    return p ? { type: p.type, color: p.color as 'w' | 'b' } : null;
  };

  const validMoves = useMemo(() => {
    if (hideMoveHints) return [];
    if (selectedSquare && game) {
      return game.moves({ square: selectedSquare as any, verbose: true }).map((m: any) => m.to) as string[];
    }
    if (dragPiece && game) {
      return game.moves({ square: dragPiece.square as any, verbose: true }).map((m: any) => m.to) as string[];
    }
    return [];
  }, [selectedSquare, dragPiece, game, hideMoveHints]);

  const turnText = game ? (game.turn() === 'w' ? 'Ход белых' : 'Ход чёрных') : '';

  // ──── LEVEL SELECTOR ────
  if (selectedLevel === null) {
    const allCompleted = LEVELS.every(l => levelStars[l.id] > 0);
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4 py-6">
        {lessonTitle ? (
          <div className="text-center w-full">
            <h2 className="text-[20px] font-bold text-[#2C241B]">{lessonTitle}</h2>
            <p className="text-[14px] font-medium text-[#8B7355] mt-1">Выберите уровень сложности</p>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl py-7 px-6 w-full text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2C241B 0%, #3A2E1F 50%, #2C241B 100%)',
              }}
            >
              <h2 className="text-white text-2xl font-bold mb-2">Игра против компьютера</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#E8D5B5' }}>
                Сыграйте с компьютером от начальной позиции.
              </p>
              <div
                className="absolute bottom-0 left-[10%] right-[10%] h-[3px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
                  opacity: 0.6,
                }}
              />
            </div>
            <h3 className="text-xl font-bold text-[#2C241B] text-center mb-1">
              Выберите уровень сложности
            </h3>
          </>
        )}

        <div className="flex flex-col gap-3 w-full">
          {/* Color selector */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setSelectedColor('w')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-bold transition-all duration-150 ${
                selectedColor === 'w'
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#8A6A3A]'
                  : 'border-[rgba(201,168,76,0.25)] bg-white text-[#8B7355]'
              }`}
            >
              <img src="/pieces/cburnett/wP.svg" alt="" className="w-5 h-5" draggable={false} /> Белые
            </button>
            <button
              onClick={() => setSelectedColor('random')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-bold transition-all duration-150 ${
                selectedColor === 'random'
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#8A6A3A]'
                  : 'border-[rgba(201,168,76,0.25)] bg-white text-[#8B7355]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Случайно
            </button>
            <button
              onClick={() => setSelectedColor('b')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-bold transition-all duration-150 ${
                selectedColor === 'b'
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#8A6A3A]'
                  : 'border-[rgba(201,168,76,0.25)] bg-white text-[#8B7355]'
              }`}
            >
              <img src="/pieces/cburnett/bP.svg" alt="" className="w-5 h-5" draggable={false} /> Чёрные
            </button>
          </div>

          {LEVELS.map((lvl) => {
            const earned = levelStars[lvl.id] || 0;
            const isDone = earned > 0;
            const circleColor = lvl.color;
            const starColor = ['#8A6040', '#4A2A1A'].includes(circleColor) ? '#FFFFFF' : '#2C241B';
            return (
              <button
                key={lvl.id}
                onClick={() => startGame(lvl.id)}
                className="flex items-center gap-3.5 px-4 py-4 rounded-2xl bg-white transition-all duration-150 ease-out hover:-translate-y-px text-left cursor-pointer"
                style={{ border: `2px solid rgba(201,168,76,0.15)` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = circleColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                  style={{
                    backgroundColor: circleColor,
                    boxShadow: `0 2px 8px ${circleColor}40`,
                  }}
                >
                  {isDone ? (
                    <Trophy size={20} className="text-white" />
                  ) : (
                    <Star size={20} style={{ color: starColor }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base text-[#2C241B]">{lvl.elo} Elo — {lvl.label}</div>
                  <div className="text-[13px] text-[#8B7355]">{lvl.description}</div>
                </div>
                <ChevronRight size={20} className="flex-shrink-0 text-[#C9A84C]" />
              </button>
            );
          })}
        </div>

        {allCompleted && (
          <div className="mt-4 px-6 py-3 bg-[#C9A84C] rounded-xl text-[#2C241B] font-bold flex items-center justify-center gap-2">
            <Trophy size={20} className="text-[#2C241B]" /> Все уровни пройдены!
          </div>
        )}
      </div>
    );
  }

  if (!game) return null;

  const currentLevel = LEVELS[selectedLevel];

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN */}
      <div className="hidden lg:flex w-full lg:w-[300px] flex-shrink-0 flex-col gap-2">
        <div className="hidden lg:flex flex-col gap-2">
          <button
            onClick={() => {
              if (game && !hintComputing) {
                if (hintArrow) {
                  setHintArrow(null);
                } else {
                  getStockfishHint(game);
                }
              }
            }}
            disabled={!game || hintComputing}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded hover:bg-[#EBE4DA] transition w-full justify-center ${
              hintArrow
                ? 'text-[#8a6a3a] bg-[#c9a84c]/10 border border-[#c9a84c]/40'
                : 'text-[#2C241B] bg-[#F5F0E8] border border-[#D4C9B8]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Eye size={14} /> {hintArrow ? 'Скрыть' : 'Подсказка'}
          </button>
          <div className="text-center text-sm font-bold text-[#2C241B]">
            Уровень: {currentLevel.elo} Elo — {currentLevel.label}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-5 gap-1 rounded p-1 border border-[#D4C9B8]">
          {LEVELS.map((lvl, idx) => {
            const earned = levelStars[idx] || 0;
            const isCurrent = idx === selectedLevel;
            const isDone = earned > 0;
            return (
              <button
                key={idx}
                onClick={() => startGame(idx)}
                className={`flex items-center justify-center px-1 py-1 rounded transition cursor-pointer hover:brightness-110 ${
                  isCurrent
                    ? 'bg-[#C9A84C] text-white'
                    : isDone
                    ? 'bg-[#B07838] text-white'
                    : 'bg-[#F5F0E8] text-[#8B7355] hover:bg-[#EBE4DA]'
                }`}
              >
                <div className="flex gap-0.5">
                  <StarPng filled={earned > 0} size={14} />
                </div>
                <span className="ml-1 text-xs font-medium">{lvl.elo}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={reset}
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs text-[#2C241B] bg-[#F5F0E8] border border-[#D4C9B8] rounded hover:bg-[#EBE4DA] transition w-full justify-center"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 flex flex-col items-center gap-3 px-2">
        {thinking && (
          <div className="w-full h-1.5 bg-[#F5F0E8] rounded-full overflow-hidden">
            <div className="h-full bg-[#C9A84C] rounded-full w-full transition-opacity duration-300 opacity-100" />
          </div>
        )}

        {message && (
          <div className={`px-6 py-3 rounded-xl text-center font-bold text-white w-full flex items-center justify-center gap-2 ${
            message.includes('Победа') ? 'bg-[#C9A84C]' : message.includes('Поражение') ? 'bg-[#B04A3A]' : 'bg-[#8B7355]'
          }`}>
            {message.includes('Победа') && <Trophy className="w-5 h-5 text-white" />}
            {message}
          </div>
        )}

        {/* Avatar + speech bubble */}
        <div className="w-full flex flex-col gap-2 max-w-sm lg:hidden">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
              <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
            </div>
            <AvatarBubble className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
              <p className="text-sm text-[var(--text-primary)] leading-snug">
                Сыграйте с компьютером и постарайтесь выиграть!
              </p>
            </AvatarBubble>
          </div>
        </div>

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
            {ranks.map((rank, ri) => (
              files.map((file, fi) => {
                const sq = `${file}${rank}`;
                const pieceObj = getPieceAt(sq);
                const light = isLight(fi, ri);
                const sel = selectedSquare === sq || dragPiece?.square === sq;
                const isValidMove = validMoves.includes(sq);
                const isDragSource = dragPiece?.square === sq;
                const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
                // Hide original piece if it's being animated from this square
                const isAnimatingSource =
                  (playerAnimatingMove && (sq === playerAnimatingMove.from || sq === playerAnimatingMove.to)) ||
                  (opponentAnimatingMove && (sq === opponentAnimatingMove.from || sq === opponentAnimatingMove.to));

                return (
                  <div
                    key={sq}
                    data-square={sq}
                    className="flex items-center justify-center relative select-none"
                    style={{
                      width: sqSize,
                      height: sqSize,
                      cursor: pieceObj && pieceObj.color === playerColor && !gameOver && !isComplete ? 'grab' : 'default',
                      touchAction: 'none',
                      backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)',
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
                      <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[#8B6914]' : 'text-[#E8D5B5]'}`}>
                        {rank}
                      </span>
                    )}
                    {ri === 7 && (
                      <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[#8B6914]' : 'text-[#E8D5B5]'}`}>
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
                    {pieceObj && !isDragSource && !isAnimatingSource && (
                      <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                        <PieceImg type={pieceObj.type} color={pieceObj.color} />
                      </div>
                    )}
                  </div>
                );
              })
            ))}

            {/* Player move ghost piece */}
            {playerAnimatingMove && (() => {
              const fArr = isReversed ? REVERSED_FILES : FILES;
              const rArr = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
              const fromF = fArr.indexOf(playerAnimatingMove.from[0]);
              const fromR = rArr.indexOf(playerAnimatingMove.from[1]);
              const toF = fArr.indexOf(playerAnimatingMove.to[0]);
              const toR = rArr.indexOf(playerAnimatingMove.to[1]);
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

            {/* Opponent move ghost piece */}
            {opponentAnimatingMove && (() => {
              const fArr = isReversed ? REVERSED_FILES : FILES;
              const rArr = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
              const fromF = fArr.indexOf(opponentAnimatingMove.from[0]);
              const fromR = rArr.indexOf(opponentAnimatingMove.from[1]);
              const toF = fArr.indexOf(opponentAnimatingMove.to[0]);
              const toR = rArr.indexOf(opponentAnimatingMove.to[1]);
              const x1 = fromF * sqSize;
              const y1 = fromR * sqSize;
              const x2 = toF * sqSize;
              const y2 = toR * sqSize;
              return (
                <div
                  key={opponentAnimatingMove.from + '-' + opponentAnimatingMove.to}
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
                    <PieceImg type={opponentAnimatingMove.piece.type} color={opponentAnimatingMove.piece.color} />
                  </div>
                </div>
              );
            })()}

            {/* Hint arrow SVG */}
            {hintArrow && (() => {
              const fArr = isReversed ? REVERSED_FILES : FILES;
              const rArr = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
              const fromF = fArr.indexOf(hintArrow.from[0]);
              const fromR = rArr.indexOf(hintArrow.from[1]);
              const toF = fArr.indexOf(hintArrow.to[0]);
              const toR = rArr.indexOf(hintArrow.to[1]);
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
                <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                  <path d={pathD} fill="rgba(44, 36, 27, 0.35)" className="arrow-hint-line" />
                </svg>
              );
            })()}

          {promotionPending && (
            <div className="absolute z-50 pointer-events-auto" style={{
              left: `${(isReversed ? REVERSED_FILES : FILES).indexOf(promotionPending.to[0]) * sqSize}px`,
              top: promotionPending.from[1] === '2' ? 4 * sqSize : 0,
              width: sqSize,
              height: 4 * sqSize,
              backgroundColor: promotionPending.from[1] === '2' ? '#F5F0E8' : '#2C241B',
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
                  onClick={() => { processMove(promotionPending.from, promotionPending.to, code); setPromotionPending(null); }}
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
        {dragPiece && !playerAnimatingMove && !opponentAnimatingMove && (
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

        <button
          onClick={() => { setSelectedLevel(null); setSelectedColor('random'); }}
          className="flex lg:hidden items-center gap-1 px-3 py-1.5 text-xs text-[#2C241B] bg-[#F5F0E8] border border-[#D4C9B8] rounded-lg hover:bg-[#EBE4DA] transition"
        >
          ← Выбрать уровень
        </button>

        {/* Mobile action buttons */}
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                if (game && !hintComputing) {
                  if (hintArrow) {
                    setHintArrow(null);
                  } else {
                    getStockfishHint(game);
                  }
                }
              }}
              disabled={!game || hintComputing}
              className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                hintArrow
                  ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10'
                  : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Eye size={14} /> {hintArrow ? 'Скрыть' : 'Подсказка'}
            </button>
            <button
              onClick={reset}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200"
            >
              <RotateCcw size={14} /> Заново
            </button>
            <button
              onClick={undoMove}
              disabled={history.length === 0 || thinking || !!gameOver || isComplete}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 size={14} /> Вернуть ход
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
