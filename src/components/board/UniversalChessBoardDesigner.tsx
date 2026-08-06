'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';

const FILES = ['a','b','c','d','e','f','g','h'];
const REVERSED_FILES = ['h','g','f','e','d','c','b','a'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];
const REVERSED_DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];

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
  playerAnimatingMove?: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null;
  opponentAnimatingMove?: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null;
  interactive?: boolean;
  customOverlays?: SquareOverlay[];
  sqSize?: number;
  className?: string;
  pieceTheme?: 'cburnett' | 'alpha' | 'merida';
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
  isReversed = false,
  selectedSquare = null,
  autoValidMoves = false,
  lastMove = null,
  ghostMove = null,
  onGhostComplete,
  onSquareClick,
  onMove,
  onDragPieceChange,
  playerAnimatingMove,
  opponentAnimatingMove,
  interactive = true,
  customOverlays = [],
  sqSize: propSqSize,
  className = '',
  pieceTheme = 'cburnett',
}: UniversalChessBoardDesignerProps) {

  // Internal fen for instant drag feedback
  const [internalFen, setInternalFen] = useState<string | null>(null);

  // Sync internalFen when external fen changes (new position from parent)
  useEffect(() => {
    setInternalFen(null);
  }, [fen]);

  const displayFen = internalFen || fen;

  const game = useMemo(() => {
    try { return new Chess(displayFen); } catch { return new Chess(); }
  }, [displayFen]);

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
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  const validMoves = useMemo(() => {
    if (!autoValidMoves) return [];
    const targetSquare = selectedSquare || dragPiece?.square;
    if (!targetSquare) return [];
    try {
      return game.moves({ verbose: true, square: targetSquare as any }).map((m: any) => m.to);
    } catch {
      return [];
    }
  }, [game, selectedSquare, dragPiece, autoValidMoves]);

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
      const p = game.get(sq as any);
      if (!p) return null;
      return { type: p.type.toUpperCase(), color: p.color as 'w' | 'b' };
    } catch {
      return null;
    }
  }, [game]);

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
    // Only allow dragging pieces of the side to move
    if (piece.color !== game.turn()) return;
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
            // Instant visual update: apply move internally first
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({ from: start.square, to: targetSquare });
            if (move) {
              setInternalFen(tempGame.fen());
            }
            onMove(start.square, targetSquare);
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
            const sel = selectedSquare === sq || dragPiece?.square === sq;
            const isValidMove = validMoves.includes(sq);
            const isDragSource = dragPiece?.square === sq;
            const isLastMoveFrom = lastMove && lastMove.from === sq;
            const isLastMoveTo = lastMove && lastMove.to === sq;

            const isGhostSource = ghostAnim?.from === sq && (ghostAnim.phase === 'out' || ghostAnim.phase === 'pause');
            const isGhostTarget = ghostAnim?.to === sq && (ghostAnim.phase === 'out' || ghostAnim.phase === 'pause');
            const isPlayerAnimatingSource = playerAnimatingMove?.from === sq;
            const isOpponentAnimatingSource = opponentAnimatingMove?.from === sq;
            const hidePiece = isDragSource || isGhostSource || isGhostTarget || isPlayerAnimatingSource || isOpponentAnimatingSource;
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

        {playerAnimatingMove && (() => {
          const fromF = files.indexOf(playerAnimatingMove.from[0]);
          const fromR = ranks.indexOf(playerAnimatingMove.from[1]);
          const toF = files.indexOf(playerAnimatingMove.to[0]);
          const toR = ranks.indexOf(playerAnimatingMove.to[1]);
          if (fromF === -1 || fromR === -1 || toF === -1 || toR === -1) return null;
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
                <PieceImg type={playerAnimatingMove.piece.type} color={playerAnimatingMove.piece.color} theme={pieceTheme} />
              </div>
            </div>
          );
        })()}

        {opponentAnimatingMove && (() => {
          const fromF = files.indexOf(opponentAnimatingMove.from[0]);
          const fromR = ranks.indexOf(opponentAnimatingMove.from[1]);
          const toF = files.indexOf(opponentAnimatingMove.to[0]);
          const toR = ranks.indexOf(opponentAnimatingMove.to[1]);
          if (fromF === -1 || fromR === -1 || toF === -1 || toR === -1) return null;
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
                <PieceImg type={opponentAnimatingMove.piece.type} color={opponentAnimatingMove.piece.color} theme={pieceTheme} />
              </div>
            </div>
          );
        })()}
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
                // Apply internally for instant visual
                const tempGame = new Chess(game.fen());
                tempGame.move({ from: promotionPending.from, to: promotionPending.to, promotion: code });
                setInternalFen(tempGame.fen());
                setPromotionPending(null);
                onMove?.(promotionPending.from, promotionPending.to, code);
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
  @keyframes opponentMoveGhost {
    0% { transform: translate(0, 0); }
    100% { transform: translate(var(--ghost-dx), var(--ghost-dy)); }
  }
  @keyframes playerMoveGhost {
    0% { transform: translate(0, 0); }
    100% { transform: translate(var(--ghost-dx), var(--ghost-dy)); }
  }
  .animate-opponent-move {
    animation: opponentMoveGhost 200ms linear forwards;
    will-change: transform;
  }
  .animate-player-move {
    animation: playerMoveGhost 200ms linear forwards;
    will-change: transform;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}
