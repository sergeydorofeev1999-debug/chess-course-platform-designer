'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';

/* ====== Shared chess utils (copied from LessonClient) ====== */
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function parseFen(fen: string) {
  const squares: Record<string, { type: string; color: 'w' | 'b' }> = {};
  const parts = fen.split(' ');
  const placement = parts[0];
  const rows = placement.split('/');
  for (let ri = 0; ri < 8; ri++) {
    let fi = 0;
    for (const ch of rows[ri]) {
      if (ch >= '1' && ch <= '8') {
        fi += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase();
        squares[`${FILES[fi]}${RANKS[ri]}`] = { type, color };
        fi++;
      }
    }
  }
  const turn = parts[1] === 'b' ? 'b' : 'w';
  const enPassant = parts[3] !== '-' ? parts[3] : null;
  return { squares, turn, enPassant };
}

function squaresToFen(squares: Record<string, { type: string; color: 'w' | 'b' }>, turn: 'w' | 'b' = 'w') {
  const rows: string[] = [];
  for (let ri = 0; ri < 8; ri++) {
    let row = '';
    let empty = 0;
    for (let fi = 0; fi < 8; fi++) {
      const sq = `${FILES[fi]}${RANKS[ri]}`;
      const p = squares[sq];
      if (p) {
        if (empty > 0) { row += empty; empty = 0; }
        const ch = p.type;
        row += p.color === 'w' ? ch.toUpperCase() : ch;
      } else {
        empty++;
      }
    }
    if (empty > 0) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

function isValidMove(
  pieceType: string,
  from: string,
  to: string,
  squares: Record<string, any>,
  movingColor: 'w' | 'b',
  starSquares: string[] = [],
  ignoreTargetOccupant: boolean = false,
  enPassantTarget: string | null = null
) {
  if (squares[from]?.color !== movingColor) return false;
  if (!ignoreTargetOccupant && squares[to]?.color === movingColor) return false;
  if (from === to) return false;

  const ff = FILES.indexOf(from[0]);
  const tf = FILES.indexOf(to[0]);
  const fr = RANKS.indexOf(from[1]);
  const tr = RANKS.indexOf(to[1]);
  const df = tf - ff;
  const dr = tr - fr;

  switch (pieceType) {
    case 'r': {
      if (ff !== tf && fr !== tr) return false;
      if (ff === tf) {
        const min = Math.min(fr, tr);
        const max = Math.max(fr, tr);
        for (let r = min + 1; r < max; r++) {
          const sq = `${FILES[ff]}${RANKS[r]}`;
          if (squares[sq]) return false;
          if (starSquares.includes(sq)) return false;
        }
      } else {
        const min = Math.min(ff, tf);
        const max = Math.max(ff, tf);
        for (let f = min + 1; f < max; f++) {
          const sq = `${FILES[f]}${RANKS[fr]}`;
          if (squares[sq]) return false;
          if (starSquares.includes(sq)) return false;
        }
      }
      return true;
    }
    case 'b': {
      if (Math.abs(df) !== Math.abs(dr)) return false;
      const sf = df > 0 ? 1 : -1;
      const sr = dr > 0 ? 1 : -1;
      for (let step = 1; step < Math.abs(df); step++) {
        const sq = `${FILES[ff + sf * step]}${RANKS[fr + sr * step]}`;
        if (squares[sq]) return false;
        if (starSquares.includes(sq)) return false;
      }
      return true;
    }
    case 'q': {
      const isRookLike = ff === tf || fr === tr;
      const isBishopLike = Math.abs(df) === Math.abs(dr);
      if (!isRookLike && !isBishopLike) return false;
      if (isRookLike) {
        if (ff === tf) {
          const min = Math.min(fr, tr);
          const max = Math.max(fr, tr);
          for (let r = min + 1; r < max; r++) {
            const sq = `${FILES[ff]}${RANKS[r]}`;
            if (squares[sq]) return false;
            if (starSquares.includes(sq)) return false;
          }
        } else {
          const min = Math.min(ff, tf);
          const max = Math.max(ff, tf);
          for (let f = min + 1; f < max; f++) {
            const sq = `${FILES[f]}${RANKS[fr]}`;
            if (squares[sq]) return false;
            if (starSquares.includes(sq)) return false;
          }
        }
      } else {
        const sf = df > 0 ? 1 : -1;
        const sr = dr > 0 ? 1 : -1;
        for (let step = 1; step < Math.abs(df); step++) {
          const sq = `${FILES[ff + sf * step]}${RANKS[fr + sr * step]}`;
          if (squares[sq]) return false;
          if (starSquares.includes(sq)) return false;
        }
      }
      return true;
    }
    case 'k': {
      if (!(Math.abs(df) <= 1 && Math.abs(dr) <= 1)) return false;
      // Basic king validation only (distance). Safety checks are after move apply.
      return true;
    }
    case 'n': {
      return (
        (Math.abs(df) === 2 && Math.abs(dr) === 1) ||
        (Math.abs(df) === 1 && Math.abs(dr) === 2)
      );
    }
    case 'p': {
      const forwardDir = movingColor === 'w' ? -1 : 1;
      // Forward 1 — blocked by piece OR star
      if (df === 0 && dr === forwardDir) return !squares[to] && !starSquares.includes(to);
      // Forward 2 from start — blocked if star on middle or destination
      if (df === 0 && dr === 2 * forwardDir) {
        const startRank = movingColor === 'w' ? '2' : '7';
        if (from[1] !== startRank) return false;
        const middleSq = `${FILES[ff]}${RANKS[fr + forwardDir]}`;
        if (squares[middleSq] || starSquares.includes(middleSq)) return false;
        return !squares[to] && !starSquares.includes(to);
      }
      // Diagonal capture + en passant
      if (Math.abs(df) === 1 && dr === forwardDir) {
        if (squares[to] && squares[to].color !== movingColor) return true;
        if (starSquares.includes(to)) return true;
        if (enPassantTarget && to === enPassantTarget && movingColor === 'w') return true;
        if (ignoreTargetOccupant) return true;
        return false;
      }
      return false;
    }
    default:
      return false;
  }
}

function getValidSquares(
  pieceType: string,
  from: string,
  squares: Record<string, any>,
  movingColor: 'w' | 'b',
  starSquares: string[] = [],
  enPassantTarget: string | null = null
): string[] {
  if (squares[from]?.color !== movingColor) return [];
  const ff = FILES.indexOf(from[0]);
  const fr = RANKS.indexOf(from[1]);
  const valid: string[] = [];

  const tryAdd = (f: number, r: number): boolean => {
    if (f < 0 || f >= 8 || r < 0 || r >= 8) return false;
    const sq = `${FILES[f]}${RANKS[r]}`;
    const p = squares[sq];
    if (p && p.color === movingColor) return false;
    if (starSquares.includes(sq)) {
      valid.push(sq);
      return false;
    }
    valid.push(sq);
    if (p && p.color !== movingColor) return false; // enemy piece blocks further
    return true;
  };

  switch (pieceType) {
    case 'r': {
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [df, dr] of dirs) {
        let f = ff + df, r = fr + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          if (!tryAdd(f, r)) break;
          f += df; r += dr;
        }
      }
      break;
    }
    case 'b': {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [df, dr] of dirs) {
        let f = ff + df, r = fr + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          if (!tryAdd(f, r)) break;
          f += df; r += dr;
        }
      }
      break;
    }
    case 'q': {
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [df, dr] of dirs) {
        let f = ff + df, r = fr + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          if (!tryAdd(f, r)) break;
          f += df; r += dr;
        }
      }
      break;
    }
    case 'k': {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const f = ff + df, r = fr + dr;
          if (f >= 0 && f < 8 && r >= 0 && r < 8) {
            const sq = `${FILES[f]}${RANKS[r]}`;
            const p = squares[sq];
            if (!p || p.color !== movingColor) valid.push(sq);
          }
        }
      }
      break;
    }
    case 'n': {
      const jumps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      for (const [df, dr] of jumps) {
        const f = ff + df, r = fr + dr;
        if (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const sq = `${FILES[f]}${RANKS[r]}`;
          const p = squares[sq];
          if (!p || p.color !== movingColor) valid.push(sq);
        }
      }
      break;
    }
    case 'p': {
      const forwardDir = movingColor === 'w' ? -1 : 1;
      const r1 = fr + forwardDir;
      if (r1 >= 0 && r1 < 8) {
        const sq = `${FILES[ff]}${RANKS[r1]}`;
        if (!squares[sq] && !starSquares.includes(sq)) {
          valid.push(sq);
          const startRank = movingColor === 'w' ? '2' : '7';
          if (from[1] === startRank) {
            const r2 = fr + 2 * forwardDir;
            if (r2 >= 0 && r2 < 8) {
              const sq2 = `${FILES[ff]}${RANKS[r2]}`;
              if (!squares[sq2] && !starSquares.includes(sq2)) valid.push(sq2);
            }
          }
        }
      }
      for (const df of [-1, 1]) {
        const fd = ff + df;
        const rd = fr + forwardDir;
        if (fd >= 0 && fd < 8 && rd >= 0 && rd < 8) {
          const sq = `${FILES[fd]}${RANKS[rd]}`;
          const p = squares[sq];
          if ((p && p.color !== movingColor) || starSquares.includes(sq)) valid.push(sq);
          if (enPassantTarget && sq === enPassantTarget && movingColor === 'w') valid.push(sq);
        }
      }
      break;
    }
  }
  return valid;
}

/* ====== Check if a piece attacks a square ====== */
function isSquareAttackedByBlack(square: string, squares: Record<string, any>) {
  for (const sq in squares) {
    const p = squares[sq];
    if (!p || p.color !== 'b') continue;
    if (isValidMove(p.type, sq, square, squares, 'b')) return true;
  }
  return false;
}

function isSquareAttackedBy(square: string, squares: Record<string, any>, attackerColor: 'w' | 'b', ignoreTarget: boolean = false) {
  for (const sq in squares) {
    const p = squares[sq];
    if (!p || p.color !== attackerColor) continue;
    if (isValidMove(p.type, sq, square, squares, attackerColor, [], ignoreTarget)) return true;
  }
  return false;
}

function isCheckmate(squares: Record<string, any>, side: 'w' | 'b') {
  // Find king
  let kingSq = '';
  for (const sq in squares) {
    if (squares[sq].type === 'k' && squares[sq].color === side) {
      kingSq = sq;
      break;
    }
  }
  if (!kingSq) return false;

  const attackerColor = side === 'w' ? 'b' : 'w';

  // 1. King must be in check
  if (!isSquareAttackedBy(kingSq, squares, attackerColor, true)) return false;

  // 2. King must have no legal escape squares
  const squaresWithoutKing = { ...squares };
  delete squaresWithoutKing[kingSq];
  const fi = FILES.indexOf(kingSq[0]);
  const ri = RANKS.indexOf(kingSq[1]);
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = fi + df;
      const nr = ri + dr;
      if (nf < 0 || nf >= 8 || nr < 0 || nr >= 8) continue;
      const sq = `${FILES[nf]}${RANKS[nr]}`;
      const p = squares[sq];
      if (p && p.color === side) continue; // own piece blocks
      if (!isSquareAttackedBy(sq, squaresWithoutKing, attackerColor, true)) return false; // king can escape
    }
  }

  // 3. Can any piece capture the attacker or block the attack?
  const attackers: string[] = [];
  for (const sq in squares) {
    const p = squares[sq];
    if (!p || p.color === side) continue;
    if (isValidMove(p.type, sq, kingSq, squares, p.color)) attackers.push(sq);
  }

  // If exactly 1 attacker, check capture or block
  if (attackers.length === 1) {
    const attackerSq = attackers[0];
    const attacker = squares[attackerSq];
    const af = FILES.indexOf(attackerSq[0]);
    const ar = RANKS.indexOf(attackerSq[1]);
    const kf = fi;
    const kr = ri;

    // Can any defender capture the attacker?
    for (const sq in squares) {
      const p = squares[sq];
      if (!p || p.color !== side) continue;
      if (p.type === 'k') continue;
      if (isValidMove(p.type, sq, attackerSq, squares, side)) {
        // Simulate capture and verify king is safe after capture (pinned defenders can't save)
        const sim = { ...squares };
        delete sim[sq];
        sim[attackerSq] = p;
        if (!isSquareAttackedBy(kingSq, sim, attackerColor, true)) return false;
      }
    }

    // Can any defender block (for sliding pieces only: r, b, q)?
    if (attacker.type === 'r' || attacker.type === 'b' || attacker.type === 'q') {
      const df = af === kf ? 0 : (af > kf ? -1 : 1);
      const dr = ar === kr ? 0 : (ar > kr ? -1 : 1);
      let bf = af + df;
      let br = ar + dr;
      while (bf !== kf || br !== kr) {
        const blockSq = `${FILES[bf]}${RANKS[br]}`;
        for (const sq in squares) {
          const p = squares[sq];
          if (!p || p.color !== side) continue;
          if (p.type === 'k') continue; // king cannot block an attack on itself
          if (isValidMove(p.type, sq, blockSq, squares, side)) {
            // Simulate block and verify king is safe after block (pinned defenders can't save)
            const sim = { ...squares };
            delete sim[sq];
            sim[blockSq] = p;
            if (!isSquareAttackedBy(kingSq, sim, attackerColor, true)) return false;
          }
        }
        bf += df;
        br += dr;
      }
    }
  }

  return true;
}

function findKingEscape(squares: Record<string, any>, side: 'w' | 'b'): string | null {
  let kingSq = '';
  for (const sq in squares) {
    if (squares[sq].type === 'k' && squares[sq].color === side) {
      kingSq = sq;
      break;
    }
  }
  if (!kingSq) return null;
  const fi = FILES.indexOf(kingSq[0]);
  const ri = RANKS.indexOf(kingSq[1]);
  const attackerColor = side === 'w' ? 'b' : 'w';
  // Find enemy king square
  let enemyKingSq = '';
  for (const sq in squares) {
    if (squares[sq].type === 'k' && squares[sq].color === attackerColor) {
      enemyKingSq = sq;
      break;
    }
  }
  // Temporarily remove king so attackers can "see" through its old square
  const squaresWithoutKing = { ...squares };
  delete squaresWithoutKing[kingSq];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = fi + df;
      const nr = ri + dr;
      if (nf < 0 || nf >= 8 || nr < 0 || nr >= 8) continue;
      const sq = `${FILES[nf]}${RANKS[nr]}`;
      const p = squares[sq];
      if (p && p.color === side) continue;
      if (isSquareAttackedBy(sq, squaresWithoutKing, attackerColor, true)) continue;
      // Kings cannot be adjacent
      if (enemyKingSq) {
        const ekf = FILES.indexOf(enemyKingSq[0]);
        const ekr = RANKS.indexOf(enemyKingSq[1]);
        if (Math.abs(nf - ekf) <= 1 && Math.abs(nr - ekr) <= 1) continue;
      }
      return sq;
    }
  }
  return null;
}

function hasAnyLegalMove(squares: Record<string, any>, side: 'w' | 'b'): boolean {
  const attackerColor = side === 'w' ? 'b' : 'w';
  // 1. Can king escape?
  if (findKingEscape(squares, side)) return true;

  // 2. Can any other piece move legally?
  for (const fromSq in squares) {
    const piece = squares[fromSq];
    if (!piece || piece.color !== side) continue;
    if (piece.type === 'k') continue; // king already checked above

    for (let fi = 0; fi < 8; fi++) {
      for (let ri = 0; ri < 8; ri++) {
        const toSq = `${FILES[fi]}${RANKS[ri]}`;
        if (fromSq === toSq) continue;
        if (!isValidMove(piece.type, fromSq, toSq, squares, side)) continue;
        const target = squares[toSq];
        if (target && target.color === side) continue;

        // Simulate move
        const sim = { ...squares };
        delete sim[fromSq];
        sim[toSq] = piece;

        let kingSq = '';
        for (const sq in sim) {
          if (sim[sq].type === 'k' && sim[sq].color === side) {
            kingSq = sq;
            break;
          }
        }
        if (!kingSq) continue;
        if (!isSquareAttackedBy(kingSq, sim, attackerColor, true)) return true;
      }
    }
  }
  return false;
}

/* ====== SVG Chess Pieces ====== */
function PieceImg({ type, color }: { type: string; color: 'w' | 'b' }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  const src = `/pieces/cburnett/${pieceKey}.svg`;
  return (
    <div className="w-full h-full" style={{ filter: "var(--piece-shadow-inline)" }}>
      <img src={src} alt="" className="w-full h-full" draggable={false} />
    </div>
  );
}

function isLight(fi: number, ri: number) {
  return (fi + ri) % 2 === 0;
}

function squareToCoords(square: string, sqSize: number): { x: number; y: number } {
  const ff = FILES.indexOf(square[0]);
  const fr = RANKS.indexOf(square[1]);
  return { x: ff * sqSize, y: fr * sqSize };
}

function GhostOverlay({ move, sqSize, isOpponent = false }: { move: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } }; sqSize: number; isOpponent?: boolean }) {
  const fromCoords = squareToCoords(move.from, sqSize);
  const toCoords = squareToCoords(move.to, sqSize);
  const dx = toCoords.x - fromCoords.x;
  const dy = toCoords.y - fromCoords.y;
  return (
    <div
      className={`absolute z-40 pointer-events-none ${isOpponent ? 'animate-opponent-move' : 'animate-player-move'}`}
      style={{
        width: sqSize,
        height: sqSize,
        left: fromCoords.x,
        top: fromCoords.y,
        ['--ghost-dx' as any]: `${dx}px`,
        ['--ghost-dy' as any]: `${dy}px`,
      }}
    >
      <div
        style={{
          width: Math.round(sqSize * 0.85),
          height: Math.round(sqSize * 0.85),
          margin: 'auto',
        }}
      >
        <PieceImg type={move.piece.type} color={move.piece.color} />
      </div>
    </div>
  );
}

/* ====== Inline Chess Board (white + black pieces, click & drag) ====== */
function InlineChessBoard({
  fen,
  onMove,
  whitePieceTypes,
  msg,
  setMsg,
  forbiddenSquares = [],
  hintArrows = [],
  promotionPending,
  onPromotion,
  opponentAnimatingMove,
  lastMove: externalLastMove,
}: {
  fen: string;
  onMove: (from: string, to: string) => boolean;
  whitePieceTypes?: string[];
  msg: string;
  setMsg: (s: string) => void;
  forbiddenSquares?: string[];
  hintArrows?: { from: string; to: string }[];
  promotionPending?: { from: string; to: string } | null;
  onPromotion?: (piece: string) => void;
  opponentAnimatingMove?: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null;
  lastMove?: { from: string; to: string } | null;
}) {
  const parsed = parseFen(fen);
  const [squares, setSquares] = useState(parsed.squares);
  // lastMove comes from external prop (parent CaptureBoard)
  const squaresRef = useRef(squares);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const selectedSquareRef = useRef(selectedSquare);
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    square: string;
    type: string;
    color: string;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const dragStateRef = useRef(dragState);
  const pointerStartRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justDraggedRef = useRef(false);
  const onMoveRef = useRef(onMove);
  const [sqSize, setSqSize] = useState(44);
  const sqSizeRef = useRef(sqSize);
  const pointerIdRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setSqSize(Math.min(80, Math.max(42, Math.floor((window.innerWidth - 16) / 8))));
      } else {
        const available = Math.max(0, window.innerWidth - 520);
        setSqSize(Math.min(84, Math.max(56, Math.floor(available / 8))));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    sqSizeRef.current = sqSize;
  }, [sqSize]);

  useEffect(() => {
    const p = parseFen(fen);
    setSquares(p.squares);
    squaresRef.current = p.squares;
    selectedSquareRef.current = null;
    setSelectedSquare(null);
  }, [fen]);

  useEffect(() => {
    selectedSquareRef.current = selectedSquare;
  }, [selectedSquare]);
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const validMoves = selectedSquare
    ? getValidSquares(
        squares[selectedSquare]?.type || 'p',
        selectedSquare,
        squares,
        'w',
        [],
        parsed.enPassant
      ).filter(sq => !forbiddenSquares.includes(sq))
    : dragState
    ? getValidSquares(
        squares[dragState.square]?.type || 'p',
        dragState.square,
        squares,
        'w',
        [],
        parsed.enPassant
      ).filter(sq => !forbiddenSquares.includes(sq))
    : [];

  const click = useCallback(
    (square: string) => {
      if (promotionPending) return;
      if (justDraggedRef.current) { justDraggedRef.current = false; return; }
      const sqs = squaresRef.current;
      const sel = selectedSquareRef.current;
      const piece = sqs[square];
      if (sel) {
        if (sel === square) {
          selectedSquareRef.current = null;
          setSelectedSquare(null);
          return;
        }
        if (piece && piece.color === 'w') {
          selectedSquareRef.current = square;
          setSelectedSquare(square);
          return;
        }
        if (forbiddenSquares.includes(square)) {
          selectedSquareRef.current = null;
          setSelectedSquare(null);
          return;
        }
        selectedSquareRef.current = null;
        setSelectedSquare(null);
        const movingPiece = sqs[sel];
        if (movingPiece) {
          setPlayerAnimatingMove({ from: sel, to: square, piece: movingPiece });
        }
        setTimeout(() => {
          // 1. First update parent position (triggers useEffect[fen] → setSquares)
          const accepted = onMoveRef.current?.(sel, square);
          // 2. Wait for React to flush setSquares from useEffect[fen]
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setPlayerAnimatingMove(null);
            });
          });
          if (accepted !== false) {
            setMsg('');
          }
        }, 200);
      } else {
        if (piece && piece.color === 'w') {
          selectedSquareRef.current = square;
          setSelectedSquare(square);
        }
      }
    },
    [setMsg, forbiddenSquares, promotionPending],
  );

  const handlePointerDown = (e: React.PointerEvent, sq: string) => {
    if (!containerRef.current) return;
    const piece = squares[sq];
    if (!piece || piece.color !== 'w') return;
    pointerStartRef.current = sq;
    justDraggedRef.current = false;
    pointerIdRef.current = e.pointerId;
    // Select piece immediately like LessonClient
    selectedSquareRef.current = sq;
    setSelectedSquare(sq);
    const rect = containerRef.current.getBoundingClientRect();
    const fi = FILES.indexOf(sq[0]);
    const ri = RANKS.indexOf(sq[1]);
    const size = sqSizeRef.current;
    const centerX = fi * size + size / 2;
    const centerY = ri * size + size / 2;
    const offsetX = e.clientX - rect.left - centerX;
    const offsetY = e.clientY - rect.top - centerY;
    const initState = {
      square: sq,
      type: piece.type,
      color: piece.color,
      x: centerX,
      y: centerY,
      offsetX,
      offsetY,
      startX: e.clientX,
      startY: e.clientY,
    };
    // Don't set dragState yet — wait for threshold
    dragStateRef.current = initState;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleGlobalMove = (e: PointerEvent) => {
    if (!dragStateRef.current) return;
    if (e.pointerId !== pointerIdRef.current) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    if (!justDraggedRef.current && Math.abs(dx) <= 20 && Math.abs(dy) <= 20) {
      return; // still within click threshold
    }
    if (!justDraggedRef.current) {
      // Threshold crossed — start drag
      justDraggedRef.current = true;
      setDragState(dragStateRef.current);
    }
    selectedSquareRef.current = dragStateRef.current.square;
    setSelectedSquare(dragStateRef.current.square);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Use the fixed grab offset recorded at pointerDown
    const x = e.clientX - rect.left - dragStateRef.current.offsetX;
    const y = e.clientY - rect.top - dragStateRef.current.offsetY;
    const newState = { ...dragStateRef.current, x, y };
    setDragState(newState);
    dragStateRef.current = newState;
  };

  const handleGlobalUp = (e: PointerEvent) => {
    if (!dragStateRef.current || !containerRef.current) {
      pointerStartRef.current = null;
      setDragState(null);
      dragStateRef.current = null;
      justDraggedRef.current = false;
      return;
    }
    if (e.pointerId !== pointerIdRef.current) return;
    if (!justDraggedRef.current) {
      // It was a click, not a drag — process it through the click handler
      click(dragStateRef.current.square);
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = sqSizeRef.current;
      const fi = Math.floor(x / size);
      const ri = Math.floor(y / size);
      if (fi >= 0 && fi < 8 && ri >= 0 && ri < 8) {
        const targetSquare = `${FILES[fi]}${RANKS[ri]}`;
        const start = dragStateRef.current.square;
        if (start && targetSquare !== start) {
          selectedSquareRef.current = null;
          setSelectedSquare(null);
          setDragState(null);
          dragStateRef.current = null;
          const accepted = onMoveRef.current?.(start, targetSquare);
          if (!accepted) {
            // Rollback local squares if move was rejected
            const p = parseFen(fen);
            setSquares(p.squares);
            squaresRef.current = p.squares;
          }
        }
      }
    }
    pointerStartRef.current = null;
    setDragState(null);
    dragStateRef.current = null;
    justDraggedRef.current = false;
  };

  const handleGlobalCancel = () => {
    pointerStartRef.current = null;
    setDragState(null);
    dragStateRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalCancel);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalCancel);
    };
  }, []);

  const preventDrag = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        className="grid border-[5px] border-[#1a1612] rounded relative select-none board-fade-in"
        style={{
          gridTemplateColumns: `repeat(8, ${sqSize}px)`,
          gridTemplateRows: `repeat(8, ${sqSize}px)`,
          touchAction: 'none',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        ref={containerRef}
      >
        {RANKS.map((rank, ri) =>
          FILES.map((file, fi) => {
            const sq = `${file}${rank}`;
            const pieceObj = squares[sq];
            const light = isLight(fi, ri);
            const sel = selectedSquare === sq;
            const isSource = dragState?.square === sq;
            const isValid = validMoves.includes(sq);
            const hover = hoveredSquare === sq;
            return (
              <div
                key={sq}
                data-square={sq}
                className={`flex items-center justify-center relative select-none ${isSource && !(externalLastMove && (sq === externalLastMove.from || sq === externalLastMove.to)) ? 'opacity-50' : ''}`}
                style={{
                  width: sqSize,
                  height: sqSize,
                  cursor: pieceObj && pieceObj.color === 'w' ? 'grab' : 'default',
                  touchAction: 'none',
                  backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)',
                }}
                onPointerDown={(e) => handlePointerDown(e, sq)}
                onClick={() => click(sq)}
                onDragStart={preventDrag}
                onMouseEnter={() => setHoveredSquare(sq)}
                onMouseLeave={() => setHoveredSquare(null)}
              >
                {sel && (
                  <div className="absolute inset-0 bg-[rgba(184,149,106,0.35)] pointer-events-none z-10" />
                )}
                    {externalLastMove && sq === externalLastMove.from && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.55)] pointer-events-none z-[5]" />
                    )}
                    {externalLastMove && sq === externalLastMove.to && (
                      <div className="absolute inset-0 bg-[rgba(201,168,76,0.70)] pointer-events-none z-[5]" />
                    )}

                {hover && !sel && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: light ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.15)',
                      zIndex: 5,
                    }}
                  />
                )}
                {fi === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold ${
                      light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {ri === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
                      light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'
                    }`}
                  >
                    {file}
                  </span>
                )}
                {isValid && !squares[sq] && (
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
                {isValid && squares[sq] && squares[sq].color === 'b' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
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
                {pieceObj && !isSource && !(playerAnimatingMove && sq === playerAnimatingMove.from) && !(opponentAnimatingMove && (sq === opponentAnimatingMove.to || sq === opponentAnimatingMove.from)) && (
                  <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize*0.85), height: Math.round(sqSize*0.85) }}>
                    <PieceImg type={pieceObj.type} color={pieceObj.color} />
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* Floating dragged piece */}
        {dragState && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              width: sqSize,
              height: sqSize,
              left: dragState.x - sqSize / 2,
              top: dragState.y - sqSize / 2,
            }}
          >
            <PieceImg type={dragState.type} color={dragState.color as 'w' | 'b'} />
          </div>
        )}
        {playerAnimatingMove && (
          <GhostOverlay move={playerAnimatingMove} sqSize={sqSize} />
        )}
        {opponentAnimatingMove && (
          <GhostOverlay move={opponentAnimatingMove} sqSize={sqSize} isOpponent />
        )}
        {/* Hint arrows SVG - always rendered, high visibility */}
        <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: 8 * sqSize, height: 8 * sqSize, display: hintArrows.length > 0 ? 'block' : 'none' }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
          {hintArrows.map((arrow, i) => {
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
              const headBase   = strokeW * 3;
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
        {promotionPending && onPromotion && (
          <div className="absolute z-50 pointer-events-auto" style={{
            left: `${(FILES.indexOf(promotionPending.to[0])) * sqSize}px`,
            top: 0,
            width: sqSize,
            height: 4 * sqSize,
            backgroundColor: '#2C241B',
            borderRadius: '0px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '2px 0',
          }}>
            {[
              { code: 'q', name: 'Ферзь' },
              { code: 'n', name: 'Конь' },
              { code: 'r', name: 'Ладья' },
              { code: 'b', name: 'Слон' },
            ].map((p) => (
              <button
                key={p.code}
                onClick={() => onPromotion(p.code)}
                className="w-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                style={{ height: sqSize }}
              >
                <img
                  src={`/pieces/cburnett/w${p.code.toUpperCase()}.svg`}
                  alt={p.name}
                  draggable={false}
                  style={{ width: '78%', height: '78%', objectFit: 'contain' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      {msg && <div className="text-red-500 text-sm mt-1">{msg}</div>}
    </div>
  );
}

/* ====== CaptureBoard main component ====== */
interface CaptureLevel {
  initialFen: string;
  stars?: string[];
  targets?: string[];
  instructions: string;
  hint: string;
  maxMoves: number;
  requireAll?: boolean;
  requireCheck?: boolean;
  requireMate?: boolean;
  requireStalemate?: boolean;
  requireSafeKing?: boolean;
  autoCaptures?: { blackFrom: string; captureSquare: string }[];
  forbiddenSquares?: string[];
  blackAutoCapture?: boolean; // default true; set false to disable universal black auto-capture
  autoMove?: { from: string; to: string; delayMs: number } | { from: string; to: string; delayMs: number }[];
  triggerAutoMove?: { from: string; to: string; delayMs?: number }[];
  allowedPieces?: string[];
  checkOnMove?: number;
}

interface Props {
  lessonId: string;
  levels: CaptureLevel[];
  successMessage: string;
  onAllComplete?: () => void;
  onLevelComplete?: (level: number, earned: number) => void;
  currentLessonId?: string;
  embedded?: boolean;
  onFail?: () => void;
  externalCurrentLevel?: number;
  onExternalLevelChange?: (level: number) => void;
  externalLevelStars?: Record<number, number>;
  onExternalStarsChange?: (stars: Record<number, number>) => void;
  hintArrows?: { from: string; to: string }[];
  onAnyMove?: () => void;
  onPositionChange?: (fen: string) => void;
}

export default function CaptureBoard({
  lessonId,
  levels,
  successMessage,
  onAllComplete,
  onLevelComplete,
  embedded,
  onFail,
  externalCurrentLevel,
  onExternalLevelChange,
  externalLevelStars,
  onExternalStarsChange,
  hintArrows = [],
  onAnyMove,
  onPositionChange,
}: Props) {
  const router = useRouter();
  const savedKey = `lesson_capture_${lessonId}`;

  const [currentLevelInternal, setCurrentLevelInternal] = useState(0);
  const [collected, setCollected] = useState<string[]>([]);
  const [levelStarsInternal, setLevelStarsInternal] = useState<Record<number, number>>({});
  const [position, setPosition] = useState(() => {
    return levels[0]?.initialFen || '';
  });
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState('');
  const [moves, setMoves] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{from: string, to: string} | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const successTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearSuccessTimers = useCallback(() => {
    successTimersRef.current.forEach(clearTimeout);
    successTimersRef.current = [];
  }, []);

  // Use external state when embedded, internal otherwise
  const currentLevel = embedded && externalCurrentLevel !== undefined ? externalCurrentLevel : currentLevelInternal;
  const levelStars = embedded && externalLevelStars ? externalLevelStars : levelStarsInternal;

  // Cleanup pending success timers on unmount to prevent race after remount
  useEffect(() => {
    return () => {
      clearSuccessTimers();
    };
  }, [clearSuccessTimers]);

  // Sync position when currentLevel changes
  useEffect(() => {
    const lvl = levels[currentLevel];
    if (lvl) {
      setPosition(lvl.initialFen);
      setCollected([]);
      setMoves(0);
      setAllDone(false);
      setGameOver(false);
      setFailed(false);
      setMsg('');
      setPromotionPending(null);
      setLastMove(null);
    }
  }, [currentLevel, levels]);

  // Normalize setCurrentLevel to accept either value or callback
  const setCurrentLevel = useCallback((updater: any) => {
    if (typeof updater === 'function') {
      if (embedded && onExternalLevelChange) {
        const next = updater(currentLevel);
        onExternalLevelChange(next);
      } else {
        setCurrentLevelInternal(updater);
      }
    } else {
      if (embedded && onExternalLevelChange) {
        onExternalLevelChange(updater);
      } else {
        setCurrentLevelInternal(updater);
      }
    }
  }, [embedded, onExternalLevelChange, currentLevel]);

  // Normalize setLevelStars to accept either value or callback
  const setLevelStars = useCallback((updater: any) => {
    if (typeof updater === 'function') {
      if (embedded && onExternalStarsChange) {
        const next = updater(levelStars);
        onExternalStarsChange(next);
      } else {
        setLevelStarsInternal(updater);
      }
    } else {
      if (embedded && onExternalStarsChange) {
        onExternalStarsChange(updater);
      } else {
        setLevelStarsInternal(updater);
      }
    }
  }, [embedded, onExternalStarsChange, levelStars]);

  const positionRef = useRef(position);
  const movesRef = useRef(moves);
  const nextTriggerIdxRef = useRef(0);

  const level = levels[currentLevel];
  const stars = level.stars || level.targets || [];
  const totalLevels = levels.length;

  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  // Load progress — only restore saved level when NOT controlled externally
  useEffect(() => {
    try {
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.levelStars) setLevelStars(data.levelStars);
        if (typeof data.currentLevel === 'number' && !(embedded && externalCurrentLevel !== undefined)) {
          setCurrentLevel(data.currentLevel);
        }
      }
    } catch {}
  }, [savedKey, embedded, externalCurrentLevel]);

  // Reset on level change
  useEffect(() => {
    clearSuccessTimers();
    const lvl = levels[currentLevel];
    setPosition(lvl.initialFen);
    setCollected([]);
    setMoves(0);
    setAllDone(false);
    setGameOver(false);
    setFailed(false);
    setMsg('');
    movesRef.current = 0;
    nextTriggerIdxRef.current = 0;
    positionRef.current = lvl.initialFen;
  }, [currentLevel, levels]);

  // Auto black move (e.g. pawn g7→g5) after delay on level start
  useEffect(() => {
    const lvl = levels[currentLevel];
    if (!lvl.autoMove) return;
    const moves: { from: string; to: string; delayMs: number }[] = Array.isArray(lvl.autoMove) ? lvl.autoMove : [lvl.autoMove];
    const timers: ReturnType<typeof setTimeout>[] = [];

    moves.forEach((move, idx) => {
      const { from, to, delayMs } = move;
      const timer = setTimeout(() => {
        if (gameOver) return;
        const parsed = parseFen(positionRef.current);
        const piece = parsed.squares[from];
        if (!piece) return;
        const newSquares = { ...parsed.squares };
        delete newSquares[from];
        newSquares[to] = piece;
        // If pawn moved two squares, set en passant target
        let nextEnPassant: string | null = null;
        if (piece.type === 'p' && from[1] === '7' && to[1] === '5') {
          nextEnPassant = `${from[0]}6`;
        }
        let newFen = squaresToFen(newSquares, 'w');
        if (nextEnPassant) {
          const fenParts = newFen.split(' ');
          fenParts[3] = nextEnPassant;
          newFen = fenParts.join(' ');
        }
        positionRef.current = newFen;
        setPosition(newFen);
        onPositionChange?.(newFen); // Notify parent about en passant field update
      }, delayMs);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [currentLevel, levels, gameOver]);

  const handleMove = useCallback(
    (from: string, to: string) => {
      if (gameOver) return false;
      clearSuccessTimers();
      const parsed = parseFen(positionRef.current);
      if (parsed.squares[from]?.color !== 'w') return false;
      const fromType = parsed.squares[from]?.type || 'p';

      // Level-specific allowedPieces constraint
      if (level.allowedPieces && level.allowedPieces.length > 0) {
        if (!level.allowedPieces.includes(fromType)) {
          setMsg(`Используйте только ${getAllowedPieceName(level.allowedPieces[0])}!`);
          return false;
        }
      }

      // Only reject obviously illegal moves (wrong piece mechanics, self-capture)
      if (!isValidMove(fromType, from, to, parsed.squares, 'w', [], false, parsed.enPassant)) return false;

      // Pawn promotion — show picker
      if (fromType === 'p' && to[1] === '8') {
        setPromotionPending({ from, to });
        return false;
      }

      const movedPiece = parsed.squares[from];

      // Apply move immediately (visual first, like Lichess)
      const newSquares = { ...parsed.squares };
      delete newSquares[from];
      newSquares[to] = movedPiece;
      // En passant capture: remove the passed pawn
      if (fromType === 'p' && parsed.enPassant && to === parsed.enPassant) {
        const capturedFile = to[0];
        const capturedRank = from[1];
        const capturedSq = `${capturedFile}${capturedRank}`;
        delete newSquares[capturedSq];
      }
      // Track en passant after pawn double-step
      let nextEnPassant: string | null = null;
      if (fromType === 'p' && from[1] === '2' && to[1] === '4') {
        nextEnPassant = `${from[0]}3`;
      }
      let newFen = squaresToFen(newSquares, 'w');
      if (nextEnPassant) {
        const fenParts = newFen.split(' ');
        fenParts[3] = nextEnPassant;
        newFen = fenParts.join(' ');
      }
      positionRef.current = newFen;
      setPosition(newFen);
      setMoves((c) => c + 1);
      setMsg('');
      setLastMove({ from, to });
      onAnyMove?.();
      onPositionChange?.(newFen);

      // Trigger auto moves after white makes a target move (e.g. en passant capture)
      if (level.triggerAutoMove && level.triggerAutoMove.length > 0) {
        const idx = nextTriggerIdxRef.current;
        if (idx < level.triggerAutoMove.length) {
          const trigger = level.triggerAutoMove[idx];
          const delayMs = (trigger as any).delayMs || 0;
          setTimeout(() => {
            // Check if white moved the expected piece for this trigger
            const parsedAfter = parseFen(positionRef.current);
            const piece = parsedAfter.squares[trigger.from];
            if (piece) {
              const newSquares2 = { ...parsedAfter.squares };
              delete newSquares2[trigger.from];
              newSquares2[trigger.to] = piece;
              let nextEp: string | null = null;
              if (piece.type === 'p' && trigger.from[1] === '7' && trigger.to[1] === '5') {
                nextEp = `${trigger.from[0]}6`;
              }
              let newFen2 = squaresToFen(newSquares2, 'w');
              if (nextEp) {
                const fp = newFen2.split(' ');
                fp[3] = nextEp;
                newFen2 = fp.join(' ');
              }
              positionRef.current = newFen2;
              setPosition(newFen2);
              onPositionChange?.(newFen2); // Notify parent about trigger auto-move update
            }
            nextTriggerIdxRef.current = idx + 1;
          }, delayMs);
        }
      }

      // Guard: if requireSafeKing and king is in check after move → immediate fail
      if (level.requireSafeKing) {
        let whiteKingSq = '';
        for (const sq in newSquares) {
          if (newSquares[sq].type === 'k' && newSquares[sq].color === 'w') {
            whiteKingSq = sq;
            break;
          }
        }
        if (whiteKingSq && isSquareAttackedBy(whiteKingSq, newSquares, 'b')) {
          setFailed(true);
          setGameOver(true);
          return false;
        }
      }

      // Auto-capture: specified black pieces eat white pieces that land on certain squares
      if (level.autoCaptures && level.autoCaptures.length > 0) {
        for (const ac of level.autoCaptures) {
          const victim = newSquares[ac.captureSquare];
          if (victim && victim.color === 'w') {
            if (victim.type === 'k') {
              // King cannot be auto-captured; just fail
              setFailed(true);
              setGameOver(true);
              return false;
            }
            const attackerPiece = newSquares[ac.blackFrom];
            // Pause then animate black capture (apply position first, like PawnRaceBoard)
            setTimeout(() => {
              // Apply move immediately — remove victim, move attacker
              const animSquares = { ...newSquares };
              delete animSquares[ac.captureSquare];
              animSquares[ac.captureSquare] = attackerPiece;
              delete animSquares[ac.blackFrom];
              const animFen = squaresToFen(animSquares, 'w');
              positionRef.current = animFen;
              setPosition(animFen);
              // Then ghost animate
              setOpponentAnimatingMove({
                from: ac.blackFrom,
                to: ac.captureSquare,
                piece: { type: attackerPiece?.type || '', color: attackerPiece?.color || 'b' },
              });
              setTimeout(() => {
                setLastMove({ from: ac.blackFrom, to: ac.captureSquare }); // Highlight FIRST
                setFailed(true);
                setGameOver(true);
                setOpponentAnimatingMove(null);
              }, 220);
            }, 800);
            return false;
          }
        }
      }

      // Universal auto-capture: collect all undefended white pieces under attack,
      // pick the most valuable one, then capture it.
      // Skip if level has explicit autoCaptures config (e.g. Lesson 10 ex4 escape check)
      // Skip if level is requireCheck (king reaction takes priority)
      if ((!level.autoCaptures || level.autoCaptures.length === 0) && (!level.requireCheck || level.checkOnMove) && level.blackAutoCapture !== false && !level.requireMate) {
        // For requireMate levels: skip auto-capture if black king is in check — king must react first
        let skipAutoCapture = false;
        if (level.requireMate) {
          let bkSq = '';
          for (const sq in newSquares) {
            if (newSquares[sq].type === 'k' && newSquares[sq].color === 'b') { bkSq = sq; break; }
          }
          if (bkSq) {
            for (const sq in newSquares) {
              const p = newSquares[sq];
              if (p && p.color === 'w' && isValidMove(p.type, sq, bkSq, newSquares, 'w', [], true)) {
                skipAutoCapture = true; break;
              }
            }
          }
        }

        if (!skipAutoCapture) {
      function isDefended(squares: Record<string, { type: string; color: 'w' | 'b' }>, targetSq: string) {
        const testSquares = { ...squares };
        if (testSquares[targetSq]) {
          testSquares[targetSq] = { ...testSquares[targetSq], color: 'b' };
        }
        for (const sq in squares) {
          const p = squares[sq];
          if (p.color !== 'w') continue;
          if (sq === targetSq) continue;
          if (isValidMove(p.type, sq, targetSq, testSquares, 'w')) return true;
        }
        return false;
      }

      const pieceValues: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };
      const candidates: { wsq: string; wp: { type: string; color: string }; bsq: string; bp: { type: string; color: string } }[] = [];

      for (const wsq in newSquares) {
        const wp = newSquares[wsq];
        if (wp.color !== 'w') continue;
        if (wp.type === 'k') continue; // King cannot be captured
        if (isDefended(newSquares, wsq)) continue;
        for (const bsq in newSquares) {
          const bp = newSquares[bsq];
          if (bp.color !== 'b') continue;
          if (isValidMove(bp.type, bsq, wsq, newSquares, 'b')) {
            candidates.push({ wsq, wp, bsq, bp });
            break; // one black attacker is enough per white piece
          }
        }
      }

      if (candidates.length > 0) {
        // Sort by value descending (highest value first)
        candidates.sort((a, b) => (pieceValues[b.wp.type] || 0) - (pieceValues[a.wp.type] || 0));
        const { wsq, wp, bsq, bp } = candidates[0];
        const attackerPiece = newSquares[bsq];

        // Pause then animate black capture (apply position first, like PawnRaceBoard)
        setTimeout(() => {
          // Apply move immediately — remove victim, move attacker
          const animSquares = { ...newSquares };
          delete animSquares[bsq];
          animSquares[wsq] = attackerPiece;
          const animFen = squaresToFen(animSquares, 'w');
          positionRef.current = animFen;
          setPosition(animFen);
          // Then ghost animate
          setOpponentAnimatingMove({
            from: bsq,
            to: wsq,
            piece: { type: attackerPiece.type, color: attackerPiece.color },
          });

          setTimeout(() => {
            setLastMove({ from: bsq, to: wsq }); // Highlight FIRST (during ghost)
            setGameOver(true);
            setFailed(true);
            setMsg(`💀 ${bp.type === 'r' ? 'Ладья' : bp.type === 'b' ? 'Слон' : bp.type === 'q' ? 'Ферзь' : bp.type === 'n' ? 'Конь' : bp.type === 'p' ? 'Пешка' : 'Фигура'} съела ${wp.type === 'r' ? 'ладью' : wp.type === 'b' ? 'слона' : wp.type === 'q' ? 'ферзя' : wp.type === 'n' ? 'коня' : wp.type === 'p' ? 'пешку' : wp.type === 'k' ? 'короля' : 'фигуру'}!`);
            setOpponentAnimatingMove(null);
          }, 220); // Ghost animation duration
        }, 800); // Pause before black move

        return true;
      }
      } // end if (!skipAutoCapture)
      } // end if (!level.autoCaptures || level.autoCaptures.length === 0) && !level.requireCheck

      if (level.requireCheck) {
        const checkMoveNum = level.checkOnMove || 1;
        const currentMoveNum = movesRef.current + 1;

        let blackKingSq = '';
        for (const sq in newSquares) {
          if (newSquares[sq].type === 'k' && newSquares[sq].color === 'b') {
            blackKingSq = sq;
            break;
          }
        }
        let isCheck = false;
        if (blackKingSq) {
          for (const sq in newSquares) {
            const p = newSquares[sq];
            if (p.color !== 'w') continue;
            if (isValidMove(p.type, sq, blackKingSq, newSquares, 'w')) {
              isCheck = true;
              break;
            }
          }
        }

        if (currentMoveNum === checkMoveNum) {
          // This is the required move — must give check
          if (!isCheck) {
            setFailed(true);
            setGameOver(true);
            return false;
          }
          // Success path for requireCheck
          const max = level.maxMoves || stars.length + 1;
          const m = movesRef.current + 1;
          let earned = 3;
          if (m <= max) earned = 3;
          else if (m <= max + 1) earned = 2;
          else earned = 1;
          setLevelStars((prevStars: Record<number, number>) => {
            const prev = prevStars[currentLevel] || 0;
            const nextStars = { ...prevStars, [currentLevel]: Math.max(prev, earned) };
            localStorage.setItem(savedKey, JSON.stringify({ levelStars: nextStars, currentLevel }));
            return nextStars;
          });
          onLevelComplete?.(currentLevel, earned);
          const t = setTimeout(() => {
            if (currentLevel + 1 < totalLevels) {
              setCurrentLevel(currentLevel + 1);
              setMsg('');
            } else {
              setAllDone(true);
              setMsg(`🎉 ${successMessage}`);
              onAllComplete?.();
            }
          }, 600);
          successTimersRef.current.push(t);
          return true;
        } else {
          // Not the required move yet
          if (isCheck) {
            setFailed(true);
            setGameOver(true);
            return false;
          }
          return true;
        }
      }

      if (level.requireMate) {
        if (!isCheckmate(newSquares, 'b')) {
          // Not checkmate — check if it's at least a check (show king escape then fail)
          let blackKingSq = '';
          for (const sq in newSquares) {
            if (newSquares[sq].type === 'k' && newSquares[sq].color === 'b') {
              blackKingSq = sq;
              break;
            }
          }
          let isCheck = false;
          if (blackKingSq && isSquareAttackedBy(blackKingSq, newSquares, 'w', true)) {
            isCheck = true;
          }
          if (isCheck) {
            // Find the attacker(s) of the black king
            const attackers: string[] = [];
            for (const sq in newSquares) {
              const p = newSquares[sq];
              if (!p || p.color !== 'w') continue;
              if (isValidMove(p.type, sq, blackKingSq, newSquares, 'w', [], true)) attackers.push(sq);
            }
            // If a black piece can capture the attacker — capture it!
            if (attackers.length === 1) {
              const attackerSq = attackers[0];
              let defenderSq = '';
              for (const sq in newSquares) {
                const p = newSquares[sq];
                if (!p || p.color !== 'b') continue;
                if (p.type === 'k') {
                  // King can capture only if destination is not attacked
                  if (isSquareAttackedBy(attackerSq, newSquares, 'w', true)) continue;
                }
                if (isValidMove(p.type, sq, attackerSq, newSquares, 'b')) {
                  defenderSq = sq;
                  break;
                }
              }
              if (defenderSq) {
                const defender = { ...newSquares[defenderSq] };
                delete newSquares[defenderSq];
                newSquares[attackerSq] = defender;
                const captureFen = squaresToFen(newSquares, 'w');
                positionRef.current = captureFen;
                setPosition(captureFen);
                setFailed(true);
                setGameOver(true);
                return false;
              }
            }
            // Can't capture — try king escape
            const escapeSq = findKingEscape(newSquares, 'b');
            if (escapeSq) {
              newSquares[escapeSq] = newSquares[blackKingSq];
              delete newSquares[blackKingSq];
              const escapeFen = squaresToFen(newSquares, 'w');
              positionRef.current = escapeFen;
              setPosition(escapeFen);
            }
          }
          setFailed(true);
          setGameOver(true);
          return false;
        }
        // Success path for requireMate
        const max = level.maxMoves || stars.length + 1;
        const m = movesRef.current + 1;
        let earned = 3;
        if (m <= max) earned = 3;
        else if (m <= max + 1) earned = 2;
        else earned = 1;
        setLevelStars((prevStars: Record<number, number>) => {
          const prev = prevStars[currentLevel] || 0;
          const nextStars = { ...prevStars, [currentLevel]: Math.max(prev, earned) };
          localStorage.setItem(savedKey, JSON.stringify({ levelStars: nextStars, currentLevel }));
          return nextStars;
        });
        onLevelComplete?.(currentLevel, earned);
        const t2 = setTimeout(() => {
          if (currentLevel + 1 < totalLevels) {
            setCurrentLevel(currentLevel + 1);
            setMsg('');
          } else {
            setAllDone(true);
            setMsg(`🎉 ${successMessage}`);
            onAllComplete?.();
          }
        }, 600);
        successTimersRef.current.push(t2);
        return true;
      }

      if (level.requireStalemate) {
        let blackKingSq = '';
        for (const sq in newSquares) {
          if (newSquares[sq].type === 'k' && newSquares[sq].color === 'b') {
            blackKingSq = sq;
            break;
          }
        }
        let isCheck = false;
        if (blackKingSq && isSquareAttackedBy(blackKingSq, newSquares, 'w', true)) {
          isCheck = true;
        }
        if (isCheck) {
          setFailed(true);
          setGameOver(true);
          setMsg('Ещё раз. Провалено.');
          return false;
        }
        if (hasAnyLegalMove(newSquares, 'b')) {
          setFailed(true);
          setGameOver(true);
          setMsg('Ещё раз. Провалено.');
          return false;
        }
        // Stalemate! Success
        const max = level.maxMoves || stars.length + 1;
        const m = movesRef.current + 1;
        let earned = 3;
        if (m <= max) earned = 3;
        else if (m <= max + 1) earned = 2;
        else earned = 1;
        setLevelStars((prevStars: Record<number, number>) => {
          const prev = prevStars[currentLevel] || 0;
          const nextStars = { ...prevStars, [currentLevel]: Math.max(prev, earned) };
          localStorage.setItem(savedKey, JSON.stringify({ levelStars: nextStars, currentLevel }));
          return nextStars;
        });
        onLevelComplete?.(currentLevel, earned);
        const t3 = setTimeout(() => {
          if (currentLevel + 1 < totalLevels) {
            setCurrentLevel(currentLevel + 1);
            setMsg('');
          } else {
            setAllDone(true);
            setMsg(`🎉 ${successMessage}`);
            onAllComplete?.();
          }
        }, 600);
        successTimersRef.current.push(t3);
        return true;
      }

      // Collect star if target square
      if (stars.includes(to) && !collected.includes(to)) {
        setCollected((prev) => {
          const next = [...prev, to];
          const allTargets = level.requireAll === true
            ? stars.every((s: string) => next.includes(s))
            : true; // any target completes
          if (allTargets) {
            const max = level.maxMoves || stars.length + 1;
            const m = movesRef.current + 1;
            let earned = 3;
            if (m <= max) earned = 3;
            else if (m <= max + 1) earned = 2;
            else earned = 1;
            setLevelStars((prevStars: Record<number, number>) => {
              const prev = prevStars[currentLevel] || 0;
              const nextStars = { ...prevStars, [currentLevel]: Math.max(prev, earned) };
              localStorage.setItem(savedKey, JSON.stringify({ levelStars: nextStars, currentLevel }));
              return nextStars;
            });
            onLevelComplete?.(currentLevel, earned);
            const t4 = setTimeout(() => {
              if (currentLevel + 1 < totalLevels) {
                setCurrentLevel(currentLevel + 1);
                setMsg('');
              } else {
                setAllDone(true);
                setMsg(`🎉 ${successMessage}`);
                onAllComplete?.();
              }
            }, 600);
            successTimersRef.current.push(t4);
          }
          return next;
        });
      }

      return true;
    },
    [stars, collected, currentLevel, totalLevels, onAllComplete, gameOver, level.maxMoves, successMessage, setFailed, setGameOver]
  );

  const collectedCount = stars.filter((s: string) => collected.includes(s)).length;
  const remainingBlack = Object.values(parseFen(position).squares).filter((p) => p.color === 'b').length;

  const resetLevel = () => {
    clearSuccessTimers();
    const lvl = levels[currentLevel];
    setPosition(lvl.initialFen);
    setCollected([]);
    setMoves(0);
    setAllDone(false);
    setGameOver(false);
    setFailed(false);
    setPromotionPending(null);
    setMsg('');
  };

  const handlePromotion = useCallback(
    (piece: string) => {
      if (!promotionPending) return;
      const { from, to } = promotionPending;
      const parsed = parseFen(positionRef.current);
      const newSquares = { ...parsed.squares };
      delete newSquares[from];
      newSquares[to] = { type: piece, color: 'w' };
      let newFen = squaresToFen(newSquares, 'w');
      positionRef.current = newFen;
      setPosition(newFen);
      setPromotionPending(null);
      setMoves((c) => c + 1);
      setMsg('');
      onAnyMove?.();

      // Continue with the rest of handleMove logic (auto-moves, checks, etc.)
      // For simplicity, trigger handleMove again from the new position
      // But since we already moved, just check win conditions
      const stars = level.stars || level.targets || [];
      const lvl = levels[currentLevel];
      const collectedCount = stars.filter((s: string) => collected.includes(s)).length;

      if (stars.includes(to)) {
        if (level.requireAll) {
          if (stars.every((s: string) => [...collected, to].includes(s))) {
            const earned = 1;
            if (onLevelComplete) onLevelComplete(currentLevel, earned);
            const nextLevel = currentLevel + 1;
            if (nextLevel <= totalLevels) {
              setTimeout(() => {
                setCurrentLevelInternal(nextLevel);
                setPosition(lvl ? lvl.initialFen : positionRef.current);
                setCollected([]);
                setMoves(0);
                setAllDone(false);
                setGameOver(false);
                setFailed(false);
                setPromotionPending(null);
                setMsg('');
              }, 600);
            }
            if (nextLevel > totalLevels) {
              setAllDone(true);
              setGameOver(true);
              if (onAllComplete) setTimeout(onAllComplete, 800);
            }
          }
        } else {
          const earned = 1;
          if (onLevelComplete) onLevelComplete(currentLevel, earned);
          const nextLevel = currentLevel + 1;
          if (nextLevel <= totalLevels) {
            setTimeout(() => {
              setCurrentLevelInternal(nextLevel);
              setPosition(lvl ? lvl.initialFen : positionRef.current);
              setCollected([]);
              setMoves(0);
              setAllDone(false);
              setGameOver(false);
              setFailed(false);
              setPromotionPending(null);
              setMsg('');
            }, 600);
          }
          if (nextLevel > totalLevels) {
            setAllDone(true);
            setGameOver(true);
            if (onAllComplete) setTimeout(onAllComplete, 800);
          }
        }
      }
    },
    [promotionPending, currentLevel, levels, totalLevels, collected, onLevelComplete, onAllComplete, onAnyMove]
  );

  return (
    <div className="w-full">
      {embedded ? (
        /* Minimal mode: only the board + fail callback */
        <div className="flex flex-col items-center gap-3">
          <InlineChessBoard key={currentLevel} fen={position} onMove={handleMove} msg={msg} setMsg={setMsg} forbiddenSquares={level.forbiddenSquares || []} hintArrows={hintArrows} promotionPending={promotionPending} onPromotion={handlePromotion} opponentAnimatingMove={opponentAnimatingMove} lastMove={lastMove} />
          {failed && onFail && (
            <div className="w-full">
              <div className="bg-[#c62828] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
                <p className="text-white font-bold text-lg">Задание провалено!</p>
                <button
                  onClick={resetLevel}
                  className="bg-white text-[#c62828] font-bold text-base px-6 py-2 rounded shadow hover:bg-gray-100 transition"
                >
                  ЕЩЁ РАЗ
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full mode: original UI */
        <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN: Stars + Figure menu + reset */}
      <div className="w-full lg:w-[140px] flex-shrink-0 space-y-2">
        <div className="hidden lg:flex flex-col rounded overflow-hidden border border-gray-200">
          {levels.map((_l: any, i: number) => {
            const earned = levelStars[i];
            const isCurrent = i === currentLevel;
            const isDone = earned != null;
            const isFuture = false;
            return (
              <button
                key={i}
                onClick={() => {
                  if (isFuture) return;
                  if (i !== currentLevel) {
                    setCurrentLevel(i);
                  }
                }}
                disabled={isFuture}
                className={`flex items-center justify-center px-2 py-1.5 transition ${
                  isCurrent
                    ? 'bg-[#5A4A3A] text-white'
                    : isDone
                    ? 'bg-[#C9A84C] text-white'
                    : 'bg-gray-200 text-gray-500'
                } ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <svg
                      key={s}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={earned != null && s <= earned ? '#FFFFFF' : 'none'}
                      stroke={earned != null && s <= earned ? 'none' : '#9CA3AF'}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-xs font-medium">{i + 1}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={resetLevel}
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition w-full justify-center"
        >
          <RotateCcw size={14} /> Заново
        </button>

      </div>

      {/* CENTER COLUMN: Chess board + stats */}
      <div className="flex-1 flex flex-col items-center gap-3">
        <InlineChessBoard key={currentLevel} fen={position} onMove={handleMove} msg={msg} setMsg={setMsg} forbiddenSquares={level.forbiddenSquares || []} opponentAnimatingMove={opponentAnimatingMove} lastMove={lastMove} />

        {/* Red fail banner */}
        {failed && (
          <div className="w-full">
            <div className="bg-[#c62828] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">Задание провалено!</p>
              <button
                onClick={resetLevel}
                className="bg-white text-[#c62828] font-bold text-base px-6 py-2 rounded shadow hover:bg-gray-100 transition"
              >
                ЕЩЁ РАЗ
              </button>
            </div>
          </div>
        )}

        {/* Mobile level stars bar */}
        <div className="flex lg:hidden gap-1 justify-center w-full overflow-x-auto">
          {levels.map((_l: any, i: number) => {
            const earned = levelStars[i];
            const isCurrent = i === currentLevel;
            const isDone = earned != null;
            const isFuture = false;
            return (
              <button
                key={i}
                onClick={() => {
                  if (isFuture) return;
                  if (i !== currentLevel) {
                    setCurrentLevel(i);
                    setAllDone(false);
                    setGameOver(false);
                  }
                }}
                disabled={isFuture}
                className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-xs transition ${
                  isCurrent ? 'bg-[#5A4A3A] text-white' : isDone ? 'bg-[#C9A84C] text-white' : 'bg-gray-200 text-gray-500'
                } ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <svg
                      key={s}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill={isFuture ? 'none' : s <= (earned || 0) ? '#FFFFFF' : 'none'}
                      stroke={isFuture ? '#9CA3AF' : s <= (earned || 0) ? 'none' : '#9CA3AF'}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions под звёздами */}
        <div className="text-[#2b2b2b] text-[15px] font-medium mb-2 text-center leading-snug w-full" style={{ whiteSpace: 'pre-line' }}>
          {level.instructions}
        </div>

        {allDone && (
          <div className="mt-2 text-emerald-700 font-bold text-lg">{successMessage}</div>
        )}
      </div>
    </div>
      )}
    </div>
  );
}

function getAllowedPieceName(piece: string): string {
  const names: Record<string, string> = {
    r: 'ладью',
    n: 'коня',
    b: 'слона',
    q: 'ферзя',
    k: 'короля',
    p: 'пешку',
  };
  return names[piece] || piece;
}
