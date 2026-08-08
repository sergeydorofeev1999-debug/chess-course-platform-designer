'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';

const FILES = ['a','b','c','d','e','f','g','h'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];
// Utility: compare two FENs and detect piece movements using chess.js
function diffFen(prevFen: string, nextFen: string): {
  moved: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } }[];
  captured: string[];
} {
  const moved: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } }[] = [];
  const captured: string[] = [];

  try {
    const prev = new Chess(prevFen);
    const allMoves = prev.moves({ verbose: true });
    
    for (const move of allMoves) {
      const test = new Chess(prev.fen());
      try {
        // chess.js 1.4.0: moves({verbose:true}) returns objects, but move() may need SAN string or explicit from/to
        const moveInput = typeof move === 'string' ? move : { from: move.from, to: move.to, promotion: move.promotion };
        test.move(moveInput);
        if (test.fen() === nextFen) {
          moved.push({
            from: move.from,
            to: move.to,
            piece: { type: move.piece.toUpperCase(), color: move.color as 'w' | 'b' },
          });
          break;
        }
      } catch {
        // ignore invalid moves
      }
    }
  } catch {
    // ignore FEN parse errors
  }

  return { moved, captured };
}


const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

function PieceImg({ type, color, theme }: { type: string; color: 'w' | 'b'; theme: string }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <img
      src={`/pieces/${theme}/${pieceKey}.svg`}
      alt=""
      className="w-full h-full"
      draggable={false}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
    />
  );
}

function GhostAnimPiece({
  from, to, piece, sqSize, pieceTheme, isReversed = false
}: {
  from: string;
  to: string;
  piece: { type: string; color: 'w' | 'b' };
  sqSize: number;
  pieceTheme: string;
  isReversed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const files = isReversed ? REVERSED_FILES : FILES;
  const ranks = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;
  
  const fromF = files.indexOf(from[0]);
  const fromR = ranks.indexOf(from[1]);
  const toF = files.indexOf(to[0]);
  const toR = ranks.indexOf(to[1]);
  
  const x1 = fromF * sqSize + (sqSize - sqSize * 0.85) / 2;
  const y1 = fromR * sqSize + (sqSize - sqSize * 0.85) / 2;
  const x2 = toF * sqSize + (sqSize - sqSize * 0.85) / 2;
  const y2 = toR * sqSize + (sqSize - sqSize * 0.85) / 2;
  
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Start position, no transition
    el.style.transition = 'none';
    el.style.left = `${x1}px`;
    el.style.top = `${y1}px`;
    // Force reflow so browser registers the starting position
    void el.getBoundingClientRect();
    // Use rAF to guarantee initial paint before starting animation
    requestAnimationFrame(() => {
      el.style.transition = 'left 200ms linear, top 200ms linear';
      el.style.left = `${x2}px`;
      el.style.top = `${y2}px`;
    });
  }, [from, to, sqSize, x1, y1, x2, y2]);
  
  return (
    <div
      ref={ref}
      className="absolute pointer-events-none"
      style={{
        left: x1,
        top: y1,
        width: Math.round(sqSize * 0.85),
        height: Math.round(sqSize * 0.85),
        zIndex: 60,
      }}
    >
      <PieceImg type={piece.type} color={piece.color} theme={pieceTheme} />
    </div>
  );
}

export interface GhostMove {
  from: string;
  to: string;
}

export interface SquareOverlay {
  square: string;
  element: React.ReactNode;
}

export interface UniversalChessBoardDesignerProps {
  fen?: string;
  pieces?: Record<string, { type: string; color: 'w' | 'b' }>;
  validMoves?: string[];
  turn?: 'w' | 'b';
  isReversed?: boolean;
  selectedSquare?: string | null;
  autoValidMoves?: boolean;
  lastMove?: { from: string; to: string } | null;
  ghostMove?: GhostMove | null;
  onGhostComplete?: () => void;
  onSquareClick?: (square: string) => void;
  onMove?: (from: string, to: string, promotion?: string) => void;
  onDragPieceChange?: (piece: { square: string; type: string; color: 'w' | 'b' } | null) => void;
  onSelectionChange?: (square: string | null) => void;
  playerAnimatingMove?: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null;
  opponentAnimatingMove?: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null;
  interactive?: boolean;
  customOverlays?: SquareOverlay[];
  sqSize?: number;
  className?: string;
  pieceTheme?: 'cburnett' | 'alpha' | 'merida';
  disableAutoGhost?: boolean;
  clickGhost?: boolean;
  userColor?: 'w' | 'b';
  sequentialFens?: string[];
  sequentialDelay?: number;
  onSequentialComplete?: () => void;
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

export default function UniversalChessBoardDesigner({
  fen,
  pieces: propPieces,
  validMoves: propValidMoves,
  isReversed = false,
  selectedSquare = null,
  autoValidMoves = false,
  lastMove = null,
  ghostMove = null,
  onGhostComplete,
  onSquareClick,
  onMove,
  onDragPieceChange,
  onSelectionChange,
  playerAnimatingMove,
  opponentAnimatingMove,
  turn,
  interactive = true,
  customOverlays = [],
  sqSize: propSqSize,
  className = '',
  pieceTheme = 'cburnett',
  disableAutoGhost = false,
  clickGhost = false,
  userColor,
  sequentialFens,
  sequentialDelay = 600,
  onSequentialComplete,
}: UniversalChessBoardDesignerProps) {

  // Internal fen for instant drag feedback
  const [internalFen, setInternalFen] = useState<string | null>(null);
  
  // Track previous FEN for auto-detecting piece movements
  const skipAutoAnimRef = useRef(false); // skip auto-animation after drag (internalFen already did instant move)
  const [previousFen, setPreviousFen] = useState<string>(fen || 'start');
  const [animatingFen, setAnimatingFen] = useState<string | null>(null); // old FEN displayed during ghost animation
  const [autoAnimatingMoves, setAutoAnimatingMoves] = useState<{
    from: string;
    to: string;
    piece: { type: string; color: 'w' | 'b' };
  }[]>([]);

  // Sequential playback state
  const [seqState, setSeqState] = useState<{
    fens: string[];
    currentIndex: number;
    prevFen: string;
    currentAnim: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null;
  } | null>(null);
  const seqTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internalFen when external fen changes (new position from parent)
  useEffect(() => {
    setInternalFen(null);
  }, [fen]);

  // Reset internalFen during animations to avoid duplicate pieces
  useEffect(() => {
    if (playerAnimatingMove || opponentAnimatingMove) {
      setInternalFen(null);
    }
  }, [playerAnimatingMove, opponentAnimatingMove]);

  // Auto-detect piece movements when fen changes
  useEffect(() => {
    // If skipAutoAnimRef is set (after clickGhost/drag), reset it and skip THIS change only
    if (skipAutoAnimRef.current) {
      skipAutoAnimRef.current = false;
      setPreviousFen(fen || 'start');
      return;
    }
    if (disableAutoGhost) {
      setPreviousFen(fen || 'start');
      return;
    }
    const currentFen = fen || 'start';
    
    if (currentFen === previousFen) {
      setPreviousFen(currentFen);
      return;
    }
    
    // We have a new FEN and previousFen holds the OLD FEN
    if (currentFen !== 'start' && previousFen !== 'start') {
      try {
        const { moved } = diffFen(previousFen, currentFen);
        if (moved.length > 0) {
          // If userColor is set, skip animation for user's own moves (already handled by clickGhost/drag)
          // Only animate opponent moves
          if (userColor && moved[0].piece.color === userColor) {
            setPreviousFen(currentFen);
            return;
          }

          // If sequential playback is active, skip auto-detect
          if (seqState) {
            setPreviousFen(currentFen);
            return;
          }

          // Start ghost animation - show old position for 200ms
          setAnimatingFen(previousFen);
          setAutoAnimatingMoves(moved);
          const timeout = setTimeout(() => {
            setAutoAnimatingMoves([]);
            setAnimatingFen(null);
          }, 200);
          // Update previousFen AFTER starting animation
          setPreviousFen(currentFen);
          return () => clearTimeout(timeout);
        }
      } catch {
        // ignore FEN parse errors
      }
    }
    
    setPreviousFen(currentFen);
  }, [fen, userColor, seqState]);

  const displayFen = seqState
    ? (seqState.currentAnim ? seqState.prevFen : seqState.fens[seqState.currentIndex])
    : (animatingFen || internalFen || fen);

  // Sequential playback engine: auto-advance through fens with 200ms animate + pause + next
  useEffect(() => {
    if (!sequentialFens || sequentialFens.length === 0) return;
    
    // Initialize or reset when fens change
    const initialFen = fen || 'start';
    setSeqState({
      fens: sequentialFens,
      currentIndex: 0,
      prevFen: initialFen,
      currentAnim: null,
    });

    return () => {
      if (seqTimeoutRef.current) clearTimeout(seqTimeoutRef.current);
    };
  }, [sequentialFens]);

  // Step through sequential fens
  useEffect(() => {
    if (!seqState) return;
    
    const currentFenStr = seqState.fens[seqState.currentIndex];
    if (!currentFenStr) {
      // Finished all fens
      setSeqState(null);
      onSequentialComplete?.();
      return;
    }

    // Detect move from prevFen to currentFen
    try {
      const { moved } = diffFen(seqState.prevFen, currentFenStr);
      if (moved.length > 0) {
        setSeqState(prev => prev ? { ...prev, currentAnim: moved[0] } : null);
      }
    } catch {
      // ignore diff errors
    }

    // After 200ms animation, clear currentAnim to show final position
    seqTimeoutRef.current = setTimeout(() => {
      setSeqState(prev => prev ? { ...prev, currentAnim: null } : null);

      // After sequentialDelay pause, advance to next
      seqTimeoutRef.current = setTimeout(() => {
        setSeqState(prev => {
          if (!prev) return null;
          const nextIndex = prev.currentIndex + 1;
          const nextPrevFen = prev.fens[prev.currentIndex];
          return {
            ...prev,
            currentIndex: nextIndex,
            prevFen: nextPrevFen,
            currentAnim: null,
          };
        });
      }, sequentialDelay);
    }, 200);

    return () => {
      if (seqTimeoutRef.current) clearTimeout(seqTimeoutRef.current);
    };
  }, [seqState?.currentIndex, seqState?.prevFen, seqState?.fens, sequentialDelay, onSequentialComplete]);

  const game = useMemo(() => {
    try { return new Chess(displayFen); } catch { return new Chess(); }
  }, [displayFen]);

  const [sqSize, setSqSize] = useState(propSqSize ?? 52);
  const [internalSelectedSquare, setInternalSelectedSquare] = useState<string | null>(null);
  useEffect(() => {
    if (propSqSize !== undefined) {
      setSqSize(propSqSize);
      return;
    }
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
  }, [propSqSize]);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  const validMoves = useMemo(() => {
    if (propValidMoves) return propValidMoves;
    if (!autoValidMoves) return [];
    const targetSquare = selectedSquare || internalSelectedSquare || dragPiece?.square;
    if (!targetSquare) return [];
    try {
      return game.moves({ verbose: true, square: targetSquare as any }).map((m: any) => m.to);
    } catch {
      return [];
    }
  }, [game, selectedSquare, internalSelectedSquare, dragPiece, autoValidMoves, propValidMoves]);

  const [ghostAnim, setGhostAnim] = useState<{
    from: string;
    to: string;
    phase: 'out' | 'pause' | 'in';
    piece: { type: string; color: 'w' | 'b' };
  } | null>(null);
  const [localPlayerAnimatingMove, setLocalPlayerAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [localOpponentAnimatingMove, setLocalOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);

  const ghostTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePlayerAnimatingMove = playerAnimatingMove || localPlayerAnimatingMove;
  const activeOpponentAnimatingMove = opponentAnimatingMove || localOpponentAnimatingMove;

  const files = isReversed ? REVERSED_FILES : FILES;
  const ranks = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;

  const getPieceAt = useCallback((sq: string) => {
    if (propPieces) {
      const p = propPieces[sq];
      if (!p) return null;
      return { type: p.type.toUpperCase(), color: p.color };
    }
    try {
      const p = game.get(sq as any);
      if (!p) return null;
      return { type: p.type.toUpperCase(), color: p.color as 'w' | 'b' };
    } catch {
      return null;
    }
  }, [game, propPieces]);

  const isLight = (fi: number, ri: number) => (fi + ri) % 2 === 0;

  useEffect(() => {
    if (!ghostMove) return;
    const piece = getPieceAt(ghostMove.from);
    if (!piece) return;

    setGhostAnim({
      from: ghostMove.from,
      to: ghostMove.to,
      phase: 'out',
      piece,
    });

    if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);

    ghostTimeoutRef.current = setTimeout(() => {
      setGhostAnim(prev => prev ? { ...prev, phase: 'pause' } : null);

      ghostTimeoutRef.current = setTimeout(() => {
        setGhostAnim(prev => prev ? { ...prev, phase: 'in' } : null);

        ghostTimeoutRef.current = setTimeout(() => {
          setGhostAnim(null);
          onGhostComplete?.();
        }, 200);
      }, 600);
    }, 200);

    return () => {
      if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
    };
  }, [ghostMove, onGhostComplete, getPieceAt]);

  const handleSquareClick = useCallback((square: string) => {
    if (!interactive) return;

    if (clickGhost) {
      // clickGhost mode: доска сама управляет выбором + ghost
      const piece = getPieceAt(square);
      const currentSel = selectedSquare || internalSelectedSquare;

      if (!currentSel) {
        // Первый клик — выбор фигуры
        if (piece && piece.color === (turn || game.turn())) {
          setInternalSelectedSquare(square);
          onSelectionChange?.(square);
        }
        return;
      }

      if (currentSel === square) {
        // Клик на ту же клетку — отмена выбора
        setInternalSelectedSquare(null);
        onSelectionChange?.(null);
        return;
      }

      if (piece && piece.color === (turn || game.turn())) {
        // Клик на другую свою фигуру — смена выбора
        setInternalSelectedSquare(square);
        onSelectionChange?.(square);
        return;
      }

      // Клик на клетку назначения — ghost + onMove
      const fromPiece = getPieceAt(currentSel);
      if (!fromPiece) {
        setInternalSelectedSquare(null);
        return;
      }

      // Проверка валидности хода
      if (!validMoves.includes(square)) {
        setInternalSelectedSquare(null);
        return;
      }

      // Запуск ghost-анимации с локальным state
      setLocalPlayerAnimatingMove({
        from: currentSel,
        to: square,
        piece: { type: fromPiece.type.toUpperCase(), color: fromPiece.color as 'w' | 'b' },
      });
      setInternalSelectedSquare(null);

      // Отключаем auto-detect на время анимации (чтобы не дублировалась)
      skipAutoAnimRef.current = true;

      setTimeout(() => {
        if (onMove) {
          onMove(currentSel, square);
        }
        setLocalPlayerAnimatingMove(null);
        skipAutoAnimRef.current = false;
      }, 200);
      return;
    }

    // Обычный режим
    if (!onSquareClick) return;
    onSquareClick(square);
  }, [interactive, clickGhost, selectedSquare, internalSelectedSquare, getPieceAt, turn, game, validMoves, onSquareClick, onMove]);

  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (!interactive || !onMove) return;
    const piece = getPieceAt(square);
    if (!piece) return;
    // Only allow dragging pieces of the side to move
    if (piece.color !== (turn || game.turn())) return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      square,
      moved: false,
      pointerId: e.pointerId,
    };
  }, [interactive, onMove, getPieceAt, game]);

  useEffect(() => {
    if (!interactive || !onMove) return;

    const handleGlobalMove = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start || e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
        start.moved = true;
        const piece = getPieceAt(start.square);
        if (piece) {
          setDragPiece({ square: start.square, type: piece.type, color: piece.color });
          onDragPieceChange?.({ square: start.square, type: piece.type, color: piece.color });
        }
      }
      if (start.moved) {
        setDragPos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalUp = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start || e.pointerId !== start.pointerId) return;
      if (start.moved) {
        setDragPiece(null);
        onDragPieceChange?.(null);
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest('[data-square]') as HTMLElement | null;
        const targetSquare = cell?.dataset.square || null;
        if (targetSquare && targetSquare !== start.square) {
          const piece = getPieceAt(start.square);
          const isPromotion = piece?.type === 'p' && (
            (piece?.color === 'w' && targetSquare[1] === '8') || (piece?.color === 'b' && targetSquare[1] === '1')
          );
          if (isPromotion) {
            setPromotionPending({ from: start.square, to: targetSquare });
          } else {
            if (propPieces) {
              // Custom engine: just notify, no internal Chess.js update
              onMove(start.square, targetSquare);
            } else {
              // Instant visual update: apply move internally first
              const tempGame = new Chess(game.fen());
              const move = tempGame.move({ from: start.square, to: targetSquare });
              if (move) {
                setInternalFen(tempGame.fen());
                skipAutoAnimRef.current = true; // skip auto-animation for instant drag move
              }
              onMove(start.square, targetSquare);
            }
          }
        }
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
  }, [interactive, onMove, getPieceAt, game]);

  const getSquareCenter = (square: string) => {
    const file = square[0];
    const rank = square[1];
    const fi = files.indexOf(file);
    const ri = ranks.indexOf(rank);
    if (fi === -1 || ri === -1) return { x: 0, y: 0 };
    return { fi, ri };
  };

  const overlayMap = new Map(customOverlays.map(o => [o.square, o.element]));

  return (
    <div className={`relative select-none ${className}`}>
      <div
        data-board
        className="grid border-[3px] border-[#2b2b2b] rounded-sm relative"
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
            const fileIndex = FILES.indexOf(file);
            const rankIndex = DISPLAY_RANKS.indexOf(rank);
            const light = isLight(fileIndex, rankIndex);
            const sel = selectedSquare === sq || internalSelectedSquare === sq || dragPiece?.square === sq;
            const isValidMove = validMoves.includes(sq);
            const isDragSource = dragPiece?.square === sq;
            const isLastMoveFrom = lastMove && lastMove.from === sq;
            const isLastMoveTo = lastMove && lastMove.to === sq;

            const isGhostSource = ghostAnim?.from === sq && (ghostAnim.phase === 'out' || ghostAnim.phase === 'pause');
            const isGhostTarget = ghostAnim?.to === sq && (ghostAnim.phase === 'out' || ghostAnim.phase === 'pause');
            const isPlayerAnimatingSource = activePlayerAnimatingMove?.from === sq;
            const isPlayerAnimatingTarget = activePlayerAnimatingMove?.to === sq;
            const isOpponentAnimatingSource = activeOpponentAnimatingMove?.from === sq;
            const isOpponentAnimatingTarget = activeOpponentAnimatingMove?.to === sq;
            const isAutoAnimatingSource = autoAnimatingMoves.some(m => m.from === sq);
            const isAutoAnimatingTarget = autoAnimatingMoves.some(m => m.to === sq);
            const isSeqAnimatingSource = seqState?.currentAnim && seqState.currentAnim.from === sq;
            const isSeqAnimatingTarget = seqState?.currentAnim && seqState.currentAnim.to === sq;
            const hidePiece = isDragSource || isGhostSource || isGhostTarget || isPlayerAnimatingSource || isPlayerAnimatingTarget || isOpponentAnimatingSource || isOpponentAnimatingTarget || isAutoAnimatingSource || isAutoAnimatingTarget || isSeqAnimatingSource || isSeqAnimatingTarget;
            const showGhostPiece = ghostAnim?.to === sq && ghostAnim.phase === 'in';

            return (
              <div
                key={sq}
                data-square={sq}
                className="flex items-center justify-center relative select-none"
                style={{
                  width: sqSize,
                  height: sqSize,
                  cursor: interactive && pieceObj ? 'grab' : 'default',
                  touchAction: 'none',
                  backgroundColor: light ? 'var(--square-light, #f0d9b5)' : 'var(--square-dark, #b58863)',
                  opacity: 1,
                }}
                onClick={() => handleSquareClick(sq)}
                onPointerDown={(e) => handlePointerDown(e, sq)}
                onDragStart={(e) => e.preventDefault()}
              >
                {sel && (
                  <div className="absolute inset-0 bg-[rgba(184,149,106,0.35)] pointer-events-none z-10" />
                )}
                {isLastMoveFrom && (
                  <div className="absolute inset-0 bg-[rgba(201,168,76,0.55)] pointer-events-none z-[5]" />
                )}
                {isLastMoveTo && (
                  <div className="absolute inset-0 bg-[rgba(201,168,76,0.70)] pointer-events-none z-[5]" />
                )}

                {fi === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark,#b58863)]' : 'text-[var(--square-light,#f0d9b5)]'}`}>
                    {rank}
                  </span>
                )}
                {ri === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark,#b58863)]' : 'text-[var(--square-light,#f0d9b5)]'}`}>
                    {file}
                  </span>
                )}

                {isValidMove && !pieceObj && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div
                      style={{
                        width: Math.round(sqSize * 0.3),
                        height: Math.round(sqSize * 0.3),
                        backgroundColor: 'var(--square-valid, #5d9040)',
                        borderRadius: '50%',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                )}
                {isValidMove && pieceObj && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div
                      style={{
                        width: sqSize,
                        height: sqSize,
                        borderRadius: '50%',
                        border: '4px solid var(--square-valid, #5d9040)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {pieceObj && !hidePiece && (
                  <div className="relative pointer-events-none z-[30]" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                    <PieceImg type={pieceObj.type} color={pieceObj.color} theme={pieceTheme} />
                  </div>
                )}

                {showGhostPiece && ghostAnim && (
                  <div
                    className="absolute pointer-events-none z-[25]"
                    style={{
                      width: Math.round(sqSize * 0.85),
                      height: Math.round(sqSize * 0.85),
                      animation: 'ghostFadeIn 200ms ease-out',
                    }}
                  >
                    <PieceImg type={ghostAnim.piece.type} color={ghostAnim.piece.color} theme={pieceTheme} />
                  </div>
                )}

                {overlayMap.has(sq) && (
                  <div className="absolute inset-0 pointer-events-none z-[35]">
                    {overlayMap.get(sq)}
                  </div>
                )}
              </div>
            );
          })
        ))}

        {ghostAnim && (ghostAnim.phase === 'out' || ghostAnim.phase === 'in') && (
          <div
            className="absolute pointer-events-none z-[40]"
            style={{
              width: Math.round(sqSize * 0.85),
              height: Math.round(sqSize * 0.85),
              transition: 'all 200ms ease-in-out',
              ...(() => {
                const from = getSquareCenter(ghostAnim.from);
                const to = getSquareCenter(ghostAnim.to);
                const sq = sqSize;
                if (ghostAnim.phase === 'out') {
                  return {
                    left: (from.fi ?? 0) * sq + (sq - sq * 0.85) / 2,
                    top: (from.ri ?? 0) * sq + (sq - sq * 0.85) / 2,
                    opacity: 0.7,
                  };
                }
                return {
                  left: (to.fi ?? 0) * sq + (sq - sq * 0.85) / 2,
                  top: (to.ri ?? 0) * sq + (sq - sq * 0.85) / 2,
                  opacity: 0.7,
                };
              })(),
            }}
          >
            <PieceImg type={ghostAnim.piece.type} color={ghostAnim.piece.color} theme={pieceTheme} />
          </div>
        )}

        {activePlayerAnimatingMove && (
          <GhostAnimPiece
            key={activePlayerAnimatingMove.from + '-' + activePlayerAnimatingMove.to}
            from={activePlayerAnimatingMove.from}
            to={activePlayerAnimatingMove.to}
            piece={activePlayerAnimatingMove.piece}
            isReversed={isReversed}
            sqSize={sqSize}
            pieceTheme={pieceTheme}
          />
        )}

        {activeOpponentAnimatingMove && (
          <GhostAnimPiece
            key={activeOpponentAnimatingMove.from + '-' + activeOpponentAnimatingMove.to}
            from={activeOpponentAnimatingMove.from}
            to={activeOpponentAnimatingMove.to}
            piece={activeOpponentAnimatingMove.piece}
            isReversed={isReversed}
            sqSize={sqSize}
            pieceTheme={pieceTheme}
          />
        )}

        {seqState?.currentAnim && (
          <GhostAnimPiece
            key={`seq-${seqState.currentIndex}-${seqState.currentAnim.from}-${seqState.currentAnim.to}`}
            from={seqState.currentAnim.from}
            to={seqState.currentAnim.to}
            piece={seqState.currentAnim.piece}
            isReversed={isReversed}
            sqSize={sqSize}
            pieceTheme={pieceTheme}
          />
        )}

        {autoAnimatingMoves.map((m, i) => (
          <GhostAnimPiece
            key={m.from + '-' + m.to + '-auto-' + i}
            from={m.from}
            to={m.to}
            piece={m.piece}
            isReversed={isReversed}
            sqSize={sqSize}
            pieceTheme={pieceTheme}
          />
        ))}
      </div>

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
          <PieceImg type={dragPiece.type} color={dragPiece.color} theme={pieceTheme} />
        </div>
      )}

      {/* Promotion Modal */}
      {promotionPending && (
        <div className="absolute z-[60] bg-[#1a1a1a] border border-[#C9A84C] rounded-lg p-2 shadow-lg flex flex-col gap-1"
          style={{
            left: `${FILES.indexOf(promotionPending.to[0]) * sqSize}px`,
            top: promotionPending.from[1] === '2' ? 4 * sqSize : 0,
          }}
        >
          {PROMOTION_PIECES.map(({ code }) => (
            <button
              key={code}
              className="w-10 h-10 flex items-center justify-center hover:bg-[#333] rounded transition-colors"
              onClick={() => {
                if (propPieces) {
                  // Custom engine: just notify
                  setPromotionPending(null);
                  onMove?.(promotionPending.from, promotionPending.to, code);
                } else {
                  // Apply internally for instant visual
                  const tempGame = new Chess(game.fen());
                  tempGame.move({ from: promotionPending.from, to: promotionPending.to, promotion: code });
                  setInternalFen(tempGame.fen());
                  skipAutoAnimRef.current = true; // skip auto-animation for instant drag move
                  setPromotionPending(null);
                  onMove?.(promotionPending.from, promotionPending.to, code);
                }
              }}
            >
              <img
                src={`/pieces/${pieceTheme}/${promotionPending.from[1] === '2' ? 'b' : 'w'}${code.toUpperCase()}.svg`}
                alt=""
                className="w-8 h-8"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes ghostFadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  /* Ghost animations use inline transition via GhostAnimPiece component */
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}
