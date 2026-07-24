'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const START_FEN_1 = '6k1/p4pp1/R6p/P2r4/8/8/5PPP/6K1 w - - 0 1';
const START_FEN_2 = 'r2q1rk1/pp1b1pp1/3p3p/3n4/1P1pQ3/P2B1P2/2P3PP/R2N1R1K b - - 0 1';
const START_FEN_3 = '1k5r/ppp2ppp/7r/4p3/Q3P2q/2RP4/PP3PPP/5R1K w - - 2 3';
const START_FEN_4 = 'r4rk1/ppp2pp1/3b3p/3p4/3P1q2/2PQ1B2/PP3PPP/4RRK1 w - - 1 2';
const START_FEN_5 = '7R/p5p1/2k1p1p1/3p4/5P2/1Pb5/r1P3P1/2KR4 w - - 0 2';
const START_FEN_6 = '6k1/5p1p/n1q1pQpP/4P3/1p6/1B1r2P1/P4P1K/8 b - - 0 1';
const START_FEN_7 = 'r4rk1/ppp1nppp/2np4/8/3PP3/2QBBqPb/PP3P1P/RN2R1K1 w - - 0 1';
const START_FEN_8 = 'b4rk1/1q3p1p/5BpQ/8/8/6PP/5P1K/5R2 b - - 0 1';

const DEFENSE_MOVES: Record<1|2|3|4|5|6|7|8, Set<string>> = {
  1: new Set(['g1,f1', 'f2,f3', 'f2,f4', 'g2,g3', 'g2,g4', 'h2,h3', 'h2,h4']),
  2: new Set(['d5,f6']),
  3: new Set(['h2,h3']),
  4: new Set(['g2,g3']),
  5: new Set(['h8,c8', 'c8,c3']),
  6: new Set(['g8,f8']),
  7: new Set(['d3,f1']),
  8: new Set(['b7,g2']),
};

const EXERCISE_FENS: Record<1|2|3|4|5|6|7|8, string> = {
  1: START_FEN_1,
  2: START_FEN_2,
  3: START_FEN_3,
  4: START_FEN_4,
  5: START_FEN_5,
  6: START_FEN_6,
  7: START_FEN_7,
  8: START_FEN_8,
};

const HINTS: Record<number, { from: string; to: string }[]> = {
  1: [{ from: 'g1', to: 'f1' }],
  2: [{ from: 'd5', to: 'f6' }],
  3: [{ from: 'h2', to: 'h3' }],
  4: [{ from: 'g2', to: 'g3' }],
  5: [{ from: 'h8', to: 'c8' }],
  6: [{ from: 'g8', to: 'f8' }],
  7: [{ from: 'd3', to: 'f1' }],
  8: [{ from: 'b7', to: 'g2' }],
};

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

export default function DefendMateBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isFail, setIsFail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sqSize, setSqSize] = useState(52);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [sequenceStep, setSequenceStep] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { isFailRef.current = isFail; }, [isFail]);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);

  const storageKey = lessonId ? `defendmate_progress_${lessonId}` : 'defendmate_progress';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setExerciseStars(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!game) setGame(new Chess(EXERCISE_FENS[exercise]));
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
    setGame(new Chess(EXERCISE_FENS[exercise]));
    setSelectedSquare(null);
    setMessage('');
    setHintVisible(false);
    setIsFail(false);
    setIsComplete(false);
    setDragPiece(null);
    setSequenceStep(0);
  }, [exercise]);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const handleHint = useCallback(() => {
    setHintVisible(prev => !prev);
  }, []);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    setExercise(num);
    setHintVisible(false);
    setGame(new Chess(EXERCISE_FENS[num]));
    setSelectedSquare(null);
    setMessage('');
    setIsFail(false);
    setIsComplete(false);
    setDragPiece(null);
    setSequenceStep(0);
  }, []);

  // ──── DEFEND MATE LOGIC ────
  const processMove = useCallback((from: string, to: string) => {
    if (!game) return;
    const g = game;
    const validMoves = DEFENSE_MOVES[exercise];

    try {
      // ── Exercise 5: multi-move sequence ──
      if (exercise === 5) {
        if (sequenceStep === 0 && from === 'h8' && to === 'c8') {
          g.move({ from, to });
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setSequenceStep(1);
          setMessage('Хорошо! Чёрный король отходит...');

          // Computer reply: Kc6-d7 (or Kc6-b7 if d7 illegal)
          setTimeout(() => {
            if (!mountedRef.current) return;
            try {
              const afterComp = new Chess(g.fen());
              const compMove = afterComp.move({ from: 'c6', to: 'd7' });
              if (!compMove) afterComp.move({ from: 'c6', to: 'b7' });
              setGame(new Chess(afterComp.fen()));
              setMessage('Съешьте черного слона!');
            } catch {}
          }, 1200);
          return;
        }
        if (sequenceStep === 1 && from === 'c8' && to === 'c3') {
          g.move({ from, to });
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setIsComplete(true);
          setMessage('Отлично! Вы защитились от мата!');
          saveStars(exercise, 3);
          return;
        }
        // Wrong move in sequence — fall through to fail logic
      }

      const move = g.move({ from, to });
      if (!move) return;

      if (validMoves.has(`${from},${to}`)) {
        setGame(new Chess(g.fen()));
        setSelectedSquare(null);
        setIsComplete(true);
        setMessage('Отлично! Вы защитились от мата!');
        saveStars(exercise, 3);
        if (exercise === 8) onComplete();
        return;
      }

      const wrongMoveFen = g.fen();
      const afterWhite = new Chess(wrongMoveFen);

      const mateMove = afterWhite.moves({ verbose: true }).find((m: any) => m.san.includes('#'));
      const captureMoves = afterWhite.moves({ verbose: true }).filter((m: any) => m.captured);

      setGame(new Chess(wrongMoveFen));
      setSelectedSquare(null);
      setIsFail(true);

      if (mateMove) {
        setMessage('Не защитились! Соперник ставит мат.');
        setTimeout(() => {
          if (!mountedRef.current) return;
          try {
            afterWhite.move(mateMove);
            setGame(new Chess(afterWhite.fen()));
          } catch {}
        }, 1000);
      } else if (captureMoves.length > 0) {
        setMessage('Вы потеряли фигуру!');
        setTimeout(() => {
          if (!mountedRef.current) return;
          try {
            afterWhite.move(captureMoves[0]);
            setGame(new Chess(afterWhite.fen()));
          } catch {}
        }, 1000);
      } else {
        setMessage('Не защитились! Соперник ставит мат.');
      }
    } catch {
      // invalid move
    }
  }, [game, exercise, saveStars, onComplete, sequenceStep]);

  const isFlipped = exercise === 2 || exercise === 6 || exercise === 8;

  // Convert visual square (what user sees on flipped board) to chess.js square
  const toChessSquare = useCallback((visualSq: string) => {
    if (!isFlipped) return visualSq;
    const file = visualSq[0];
    const rank = visualSq[1];
    const chessFile = String.fromCharCode('a'.charCodeAt(0) + ('h'.charCodeAt(0) - file.charCodeAt(0)));
    const chessRank = String.fromCharCode('1'.charCodeAt(0) + ('8'.charCodeAt(0) - rank.charCodeAt(0)));
    return `${chessFile}${chessRank}`;
  }, [isFlipped]);

  // Convert chess.js square to visual square (for valid move highlighting on flipped board)
  const toVisualSquare = useCallback((chessSq: string) => {
    if (!isFlipped) return chessSq;
    const file = chessSq[0];
    const rank = chessSq[1];
    const visualFile = String.fromCharCode('a'.charCodeAt(0) + ('h'.charCodeAt(0) - file.charCodeAt(0)));
    const visualRank = String.fromCharCode('1'.charCodeAt(0) + ('8'.charCodeAt(0) - rank.charCodeAt(0)));
    return `${visualFile}${visualRank}`;
  }, [isFlipped]);

  // ──── CLICK ────
  const handleSquareClick = useCallback((visualSq: string) => {
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const sq = isFlipped ? toChessSquare(visualSq) : visualSq;
    const piece = game.get(sq as any);

    if (selectedSquare === sq) {
      setSelectedSquare(null);
    } else if (selectedSquare) {
      processMove(selectedSquare, sq);
      setSelectedSquare(null);
    } else {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(sq);
      }
    }
  }, [game, selectedSquare, processMove, isFlipped, toChessSquare]);

  // ──── DRAG & DROP ────
  const handlePointerDown = useCallback((e: React.PointerEvent, visualSq: string) => {
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const sq = isFlipped ? toChessSquare(visualSq) : visualSq;
    const piece = game.get(sq as any);
    if (!piece || piece.color !== game.turn()) return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, square: sq, moved: false, pointerId: e.pointerId };
  }, [game, isFlipped, toChessSquare]);

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
        const targetVisualSq = cell?.dataset.square || null;
        if (targetVisualSq) {
          const targetChessSq = isFlipped ? toChessSquare(targetVisualSq) : targetVisualSq;
          if (targetChessSq !== start.square) {
            processMove(start.square, targetChessSq);
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
  }, [game, processMove, isFlipped, toChessSquare]);

  // ──── HELPERS ────
  const getPieceAt = (sq: string) => {
    if (!game) return null;
    const chessSq = isFlipped ? toChessSquare(sq) : sq;
    const p = game.get(chessSq as any);
    if (!p) return null;
    return { type: p.type.toUpperCase(), color: p.color as 'w' | 'b' };
  };

  const isLight = (f: number, r: number) => (f + r) % 2 === 0;

  const validMovesChess = selectedSquare && game
    ? (game.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to) as string[])
    : dragPiece && game
      ? (game.moves({ square: dragPiece.square as any, verbose: true }).map(m => m.to) as string[])
      : [];

  const validMoves = isFlipped ? validMovesChess.map(toVisualSquare) : validMovesChess;

  const turnText = game ? (game.turn() === 'w' ? 'Ход белых' : 'Ход чёрных') : '';

  if (!game) return null;

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
              Защититесь от мата!
            </p>
          </div>
        </div>

        {/* Exercise pills */}
        <div className="w-full flex flex-col gap-[1px]">
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
          <span className="text-xs font-bold text-[var(--text-primary)]">Задание {exercise} из 8</span>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 8) * 100}%` }} />
          </div>
        </div>

        {/* Заново */}
        <button onClick={reset} className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200">
          <RotateCcw size={14} /> Заново
        </button>

        {/* Подсказка */}
        <button onClick={handleHint} className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all duration-200 ${hintVisible ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}>
          <Eye size={14} /> Подсказка
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
                Защититесь от угрозы мата!
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block text-center font-bold text-slate-700 text-lg">
          {turnText}
        </div>

        {/* Fail banner */}
        {isFail && (
          <div className="w-full max-w-sm">
            <div className="bg-[#c62828] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">{message}</p>
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
                const chessSq = isFlipped ? toChessSquare(sq) : sq;
                const sel = selectedSquare === chessSq || dragPiece?.square === chessSq;
                const isValidMove = validMoves.includes(sq);
                const isDragSource = dragPiece?.square === chessSq;

                return (
                  <div
                    key={sq}
                    data-square={sq}
                    className="flex items-center justify-center relative select-none"
                    style={{
                      width: sqSize,
                      height: sqSize,
                      cursor: pieceObj && pieceObj.color === game?.turn() && !isFail && !isComplete ? 'grab' : 'default',
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
                    {fi === 0 && (
                      <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>
                        {isFlipped ? DISPLAY_RANKS[7 - ri] : rank}
                      </span>
                    )}
                    {ri === 7 && (
                      <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>
                        {isFlipped ? FILES[7 - fi] : file}
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

          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && !dragPiece && (
            (() => {
              const arrows = HINTS[exercise] || [];
              if (arrows.length === 0) return null;
              return (
                <svg className="absolute inset-0 pointer-events-none z-[35]" style={{ width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                  {arrows.map((arrow, i) => {
                    const fromF = FILES.indexOf(arrow.from[0]);
                    const fromR = DISPLAY_RANKS.indexOf(arrow.from[1]);
                    const toF = FILES.indexOf(arrow.to[0]);
                    const toR = DISPLAY_RANKS.indexOf(arrow.to[1]);
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
                      <div className="flex"><svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                      <div className="flex gap-[1px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
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

