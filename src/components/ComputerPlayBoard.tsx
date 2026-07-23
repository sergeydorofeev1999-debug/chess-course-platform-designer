'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, ChevronRight } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

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
    <img
      src={`/pieces/cburnett/${pieceKey}.svg`}
      alt=""
      className="w-full h-full"
      draggable={false}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
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

export default function ComputerPlayBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [sqSize, setSqSize] = useState(52);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [thinking, setThinking] = useState(false);
  const [gameOver, setGameOver] = useState<{ result: string; reason: string } | null>(null);
  const [playerColor] = useState<'w' | 'b'>('w');
  const [promotionPending, setPromotionPending] = useState<{from:string; to:string}|null>(null);

  const mountedRef = useRef(true);
  const workerRef = useRef<Worker | null>(null);
  const openingStepRef = useRef(0);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);

  const storageKey = lessonId ? `computerplay_progress_${lessonId}` : 'computerplay_progress';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLevelStars(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

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

  // ─── STOCKFISH WORKER ────
  useEffect(() => {
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;
    worker.postMessage('uci');
    return () => { worker.terminate(); };
  }, []);

  const makeComputerMove = useCallback((g: Chess, level: number, openStep: number) => {
    if (!workerRef.current) return;
    const cfg = LEVELS[level];
    if (!cfg) return;

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
          g.move({ from: moveUci.slice(0, 2), to: moveUci.slice(2, 4), promotion: moveUci.slice(4, 5) || undefined });
          setGame(new Chess(g.fen()));
          checkGameOver(g, 'after computer');
        } catch {}
      }
    };

    worker.addEventListener('message', onMsg);
    worker.postMessage('setoption name UCI_LimitStrength value true');
    worker.postMessage(`setoption name UCI_Elo value ${cfg.elo}`);
    worker.postMessage('setoption name Skill Level value ' + Math.min(20, Math.max(0, cfg.depth)));
    worker.postMessage(`position fen ${g.fen()}`);
    worker.postMessage(`go depth ${cfg.depth}`);
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
    const g = new Chess();
    setSelectedLevel(levelIndex);
    setGame(g);
    setSelectedSquare(null);
    setMessage('');
    setIsComplete(false);
    setGameOver(null);
    setThinking(false);
    setPromotionPending(null);
    openingStepRef.current = 0;

    if (playerColor === 'b') {
      // Computer moves first as white — no forced line for white
      setTimeout(() => {
        if (mountedRef.current) makeComputerMove(g, levelIndex, openingStepRef.current);
      }, 500);
    }
  }, [playerColor, makeComputerMove]);

  const reset = useCallback(() => {
    if (selectedLevel !== null) {
      startGame(selectedLevel);
    }
  }, [selectedLevel, startGame]);

  // ──── PROCESS PLAYER MOVE ────
  const processMove = useCallback((from: string, to: string, promotion?: string) => {
    if (!game || selectedLevel === null || isComplete || gameOver) return;
    const g = game;
    if (g.turn() !== playerColor) return;

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

      setGame(new Chess(g.fen()));
      setSelectedSquare(null);

      if (g.isGameOver()) {
        checkGameOver(g, 'after player');
        return;
      }

      // ── Italian opening forced line ──
      const step = openingStepRef.current;
      if (playerColor === 'w' && step < ITALIAN_LINE.length) {
        const expected = ITALIAN_LINE[step].white;
        if (move.from === expected.from && move.to === expected.to) {
          // White followed the line — play forced black response
          setTimeout(() => {
            if (!mountedRef.current) return;
            const blackMove = ITALIAN_LINE[step].black;
            try {
              g.move({ from: blackMove.from, to: blackMove.to });
              setGame(new Chess(g.fen()));
              openingStepRef.current = step + 1;
              checkGameOver(g, 'after computer forced');
            } catch {}
          }, 400);
          return;
        } else {
          // White deviated — disable forced line
          openingStepRef.current = ITALIAN_LINE.length;
        }
      }

      // Computer's turn (Stockfish)
      setTimeout(() => {
        if (mountedRef.current) makeComputerMove(new Chess(g.fen()), selectedLevel, openingStepRef.current);
      }, 300);
    } catch {}
  }, [game, selectedLevel, isComplete, gameOver, playerColor, checkGameOver, makeComputerMove]);

  // ──── CLICK ────
  const handleSquareClick = useCallback((sq: string) => {
    if (!game || game.turn() !== playerColor || isComplete || gameOver || thinking || promotionPending) return;
    const piece = game.get(sq as any);

    if (selectedSquare === sq) {
      setSelectedSquare(null);
    } else if (selectedSquare) {
      processMove(selectedSquare, sq);
    } else {
      if (piece && piece.color === playerColor) {
        setSelectedSquare(sq);
      }
    }
  }, [game, selectedSquare, processMove, playerColor, isComplete, gameOver, thinking, promotionPending]);

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
    : dragPiece && game
      ? (game.moves({ square: dragPiece.square as any, verbose: true }).map(m => m.to) as string[])
      : [];

  const turnText = game ? (game.turn() === 'w' ? 'Ход белых' : 'Ход чёрных') : '';

  // ──── LEVEL SELECTOR ────
  if (selectedLevel === null) {
    const allCompleted = LEVELS.every(l => levelStars[l.id] > 0);
    return (
      <div className="flex flex-col items-center gap-6 w-full px-4 py-6">
        <h3 className="text-[20px] font-bold text-[#2C241B] text-center">
          Выберите уровень сложности
        </h3>
        <p className="text-[#6B5B3D] text-center max-w-sm px-4">
          Сыграйте с компьютером от начальной позиции. Вы играете белыми.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {LEVELS.map((lvl) => {
            const earned = levelStars[lvl.id] || 0;
            const isDone = earned > 0;
            const circleColor = lvl.color;
            const borderColor = isDone
              ? circleColor
              : (lvl.id === 0 ? '#F5EFE0' : lvl.id === 1 ? '#F2EBD8' : lvl.id === 2 ? '#F0E8DA' : lvl.id === 3 ? '#EBE0D4' : '#E8DCD4');
            const titleColor  = lvl.id === 0 ? '#A07820' : lvl.id === 1 ? '#906820' : lvl.id === 2 ? '#805820' : lvl.id === 3 ? '#704820' : '#3A1A0A';
            const descColor   = lvl.id === 0 ? '#B89A60' : lvl.id === 1 ? '#A88A60' : lvl.id === 2 ? '#A08860' : lvl.id === 3 ? '#907860' : '#7A5A4A';
            return (
              <button
                key={lvl.id}
                onClick={() => startGame(lvl.id)}
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
                  {isDone ? <Trophy size={20} /> : <StarPng filled={false} size={20} />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base" style={{ color: titleColor }}>{lvl.elo} Elo — {lvl.label}</div>
                  <div className="text-[13px]" style={{ color: descColor }}>{lvl.description}</div>
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

  if (!game) return null;

  const currentLevel = LEVELS[selectedLevel];

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN */}
      <div className="w-full lg:w-[300px] flex-shrink-0 space-y-2">
        <div className="hidden lg:flex flex-col gap-2">
          <button
            onClick={() => setSelectedLevel(null)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#6B5B3D] bg-[#E8E0D4] rounded hover:bg-[#D4C5B5] transition w-full justify-center"
          >
            ← Выбрать уровень
          </button>
          <div className="text-center text-sm font-bold text-slate-700">
            Уровень: {currentLevel.elo} Elo — {currentLevel.label}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-5 gap-1 rounded p-1 border border-[#D4C5B5]">
          {LEVELS.map((lvl, idx) => {
            const earned = levelStars[idx] || 0;
            const isCurrent = idx === selectedLevel;
            const isDone = earned > 0;
            return (
              <button
                key={idx}
                onClick={() => startGame(idx)}
                className={`flex items-center justify-center px-1 py-1 rounded transition ${
                  isCurrent
                    ? 'bg-blue-500 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                } cursor-pointer hover:brightness-110`}
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
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs text-[#6B5B3D] bg-[#E8E0D4] rounded hover:bg-[#D4C5B5] transition w-full justify-center"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 flex flex-col items-center gap-3">
        <div className="px-6 py-3 rounded-xl text-center font-bold text-white bg-[#C9A84C] mb-2 w-full">
          Игра против компьютера — {currentLevel.label} ({currentLevel.elo} Elo)
        </div>

        <div className="text-center font-bold text-slate-700 text-lg">
          {turnText}
        </div>

        {message && (
          <div className={`px-6 py-3 rounded-xl text-center font-bold text-white ${
            message.includes('Победа') ? 'bg-[#8B7355]' : message.includes('Поражение') ? 'bg-[#4A3F35]' : 'bg-[#C9A84C]'
          }`}>
            {message.includes('Победа') && <Trophy className="w-5 h-5 inline-block mr-2" />}
            {message}
          </div>
        )}

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
            {DISPLAY_RANKS.map((rank, ri) => (
              FILES.map((file, fi) => {
                const sq = `${file}${rank}`;
                const pieceObj = getPieceAt(sq);
                const light = isLight(fi, ri);
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
                      cursor: pieceObj && pieceObj.color === playerColor && !gameOver && !isComplete && !thinking ? 'grab' : 'default',
                      touchAction: 'none',
                      backgroundColor: light ? '#f0d9b5' : '#b58863',
                      opacity: isDragSource ? 0.3 : 1,
                    }}
                    onClick={() => handleSquareClick(sq)}
                    onPointerDown={(e) => handlePointerDown(e, sq)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    {sel && (
                      <div className="absolute inset-[1px] rounded-[5px] bg-[rgba(201,168,76,0.45)] pointer-events-none z-10" />
                    )}
                    {fi === 0 && (
                      <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[#b58863]' : 'text-[#f0d9b5]'}`}>
                        {rank}
                      </span>
                    )}
                    {ri === 7 && (
                      <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[#b58863]' : 'text-[#f0d9b5]'}`}>
                        {file}
                      </span>
                    )}
                    {isValidMove && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        {pieceObj ? (
                          // Золотое кольцо вокруг вражеской фигуры
                          <div
                            style={{ 
                              width: sqSize, 
                              height: sqSize, 
                              borderRadius: '50%', 
                              border: '4px solid #C9A84C', 
                              boxSizing: 'border-box', 
                            }}
                          />
                        ) : (
                          // Золотая точка на пустой клетке
                          <div
                            style={{ 
                              width: Math.round(sqSize * 0.3), 
                              height: Math.round(sqSize * 0.3), 
                              backgroundColor: '#C9A84C', 
                              borderRadius: '50%', 
                              opacity: 0.85, 
                            }}
                          />
                        )}
                      </div>
                    )}
                    {pieceObj && !isDragSource && (
                      <div className="relative pointer-events-none" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                        <PieceImg type={pieceObj.type} color={pieceObj.color} />
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          {promotionPending && (
            <div className="absolute z-50 pointer-events-auto promotion-panel" style={{
              left: `${FILES.indexOf(promotionPending.to[0]) * sqSize}px`,
              top: promotionPending.from[1] === '2' ? 4 * sqSize : 0,
              width: sqSize,
              height: 4 * sqSize,
              backgroundColor: promotionPending.from[1] === '2' ? '#F5F0E8' : '#2C241B',
              borderRadius: '0px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {PROMOTION_PIECES.map(({ code, name }) => {
                const isBlackPawn = promotionPending.from[1] === '2';
                return (
                <button
                  key={code}
                  onClick={() => {
                    processMove(promotionPending.from, promotionPending.to, code);
                    setPromotionPending(null);
                  }}
                  className="w-full aspect-square flex items-center justify-center transition-all duration-150"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid transparent',
                    borderRadius: '0px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isBlackPawn ? 'rgba(44, 36, 27, 0.08)' : 'rgba(201, 168, 76, 0.15)';
                    e.currentTarget.style.borderColor = '#C9A84C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = isBlackPawn ? 'rgba(44, 36, 27, 0.15)' : 'rgba(201, 168, 76, 0.25)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = isBlackPawn ? 'rgba(44, 36, 27, 0.08)' : 'rgba(201, 168, 76, 0.15)';
                  }}
                  title={name}
                >
                  <img
                    src={`/pieces/cburnett/${isBlackPawn ? 'b' : 'w'}${code.toUpperCase()}.svg`}
                    alt={name}
                    draggable={false}
                    style={{ width: '78%', height: '78%', objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
                  />
                </button>
                );
              })}
            </div>
          )}

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

        <button
          onClick={reset}
          className="flex lg:hidden items-center gap-1 px-3 py-1.5 text-xs text-[#6B5B3D] bg-[#E8E0D4] rounded hover:bg-[#D4C5B5] transition"
        >
          <RotateCcw size={14} /> Заново
        </button>

        <button
          onClick={() => setSelectedLevel(null)}
          className="flex lg:hidden items-center gap-1 px-3 py-1.5 text-xs text-[#6B5B3D] bg-[#E8E0D4] rounded hover:bg-[#D4C5B5] transition"
        >
          ← Выбрать уровень
        </button>
      </div>
    </div>
  );
}
