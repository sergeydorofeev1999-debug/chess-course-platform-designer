'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';

/* ================================================================
   CONSTANTS
   ================================================================ */
const FILES = ['a','b','c','d','e','f','g','h'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];

/* ================================================================
   PIECE IMAGE - cburnett SVGs
   ================================================================ */
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

/* ================================================================
   TYPES
   ================================================================ */
export interface GhostMove {
  from: string;
  to: string;
}

export interface SquareOverlay {
  square: string;
  element: React.ReactNode;
}

export interface UniversalChessBoardProps {
  fen: string;
  isReversed?: boolean;
  selectedSquare?: string | null;
  lastMove?: { from: string; to: string } | null;
  validMoves?: string[];
  ghostMove?: GhostMove | null;
  onGhostComplete?: () => void;
  onSquareClick?: (square: string) => void;
  onMove?: (from: string, to: string) => void;
  interactive?: boolean;
  customOverlays?: SquareOverlay[];
  sqSize?: number;
  className?: string;
}

/* ================================================================
   DRAG & DROP TYPES
   ================================================================ */
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

/* ================================================================
   COMPONENT
   ================================================================ */
export default function UniversalChessBoard({
  fen,
  isReversed = false,
  selectedSquare = null,
  lastMove = null,
  validMoves = [],
  ghostMove = null,
  onGhostComplete,
  onSquareClick,
  onMove,
  interactive = true,
  customOverlays = [],
  sqSize: propSqSize,
  className = '',
}: UniversalChessBoardProps) {

  const gameRef = useRef<Chess>(new Chess(fen));
  useEffect(() => {
    try {
      gameRef.current = new Chess(fen);
    } catch {
      // Invalid FEN - keep previous
    }
  }, [fen]);

  const [sqSize, setSqSize] = useState(propSqSize ?? 52);
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

  const [ghostAnim, setGhostAnim] = useState<{
    from: string;
    to: string;
    phase: 'out' | 'pause' | 'in';
    piece: { type: string; color: 'w' | 'b' };
  } | null>(null);

  const ghostTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const files = isReversed ? REVERSED_FILES : FILES;
  const ranks = isReversed ? REVERSED_DISPLAY_RANKS : DISPLAY_RANKS;

  const getPieceAt = useCallback((sq: string) => {
    try {
      const p = gameRef.current.get(sq as any);
      if (!p) return null;
      return { type: p.type.toUpperCase(), color: p.color as 'w' | 'b' };
    } catch {
      return null;
    }
  }, []);

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
    if (!interactive || !onSquareClick) return;
    onSquareClick(square);
  }, [interactive, onSquareClick]);

  const handlePointerDown = useCallback((e: React.PointerEvent, square: string) => {
    if (!interactive || !onMove) return;
    const piece = getPieceAt(square);
    if (!piece) return;
    if (e.pointerType === 'touch' && !(e as any).isPrimary) return;

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      square,
      moved: false,
      pointerId: e.pointerId,
    };
  }, [interactive, onMove, getPieceAt]);

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
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest('[data-square]') as HTMLElement | null;
        const targetSquare = cell?.dataset.square || null;
        if (targetSquare && targetSquare !== start.square) {
          onMove(start.square, targetSquare);
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
  }, [interactive, onMove, getPieceAt]);

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
            const light = isLight(fi, ri);
            const sel = selectedSquare === sq || dragPiece?.square === sq;
            const isValidMove = validMoves.includes(sq);
            const isDragSource = dragPiece?.square === sq;
            const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);

            const isGhostSource = ghostAnim?.from === sq && (ghostAnim.phase === 'out' || ghostAnim.phase === 'pause');
            const isGhostTarget = ghostAnim?.to === sq && (ghostAnim.phase === 'out' || ghostAnim.phase === 'pause');
            const hidePiece = isDragSource || isGhostSource || isGhostTarget;
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
                  backgroundColor: light ? '#f0d9b5' : '#b58863',
                  opacity: isDragSource ? 0.3 : 1,
                }}
                onClick={() => handleSquareClick(sq)}
                onPointerDown={(e) => handlePointerDown(e, sq)}
                onDragStart={(e) => e.preventDefault()}
              >
                {sel && (
                  <div className="absolute inset-[1px] rounded-[5px] bg-[rgba(100,160,60,0.45)] pointer-events-none z-10" />
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
                    <div
                      style={{
                        width: Math.round(sqSize * 0.3),
                        height: Math.round(sqSize * 0.3),
                        backgroundColor: pieceObj ? '#c41e3a' : '#5d9040',
                        borderRadius: pieceObj ? '4px' : '50%',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                )}

                {isLastMove && (
                  <div className="absolute inset-0 bg-[rgba(155,199,0,0.35)] pointer-events-none z-[5]" />
                )}

                {pieceObj && !hidePiece && (
                  <div className="relative pointer-events-none z-[15]" style={{ width: Math.round(sqSize * 0.85), height: Math.round(sqSize * 0.85) }}>
                    <PieceImg type={pieceObj.type} color={pieceObj.color} />
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
                    <PieceImg type={ghostAnim.piece.type} color={ghostAnim.piece.color} />
                  </div>
                )}

                {overlayMap.has(sq) && (
                  <div className="absolute inset-0 pointer-events-none z-[30]">
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
            <PieceImg type={ghostAnim.piece.type} color={ghostAnim.piece.color} />
          </div>
        )}
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
          <PieceImg type={dragPiece.type} color={dragPiece.color} />
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
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}
