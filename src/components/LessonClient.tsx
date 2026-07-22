'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, ArrowLeft, ArrowRight, Star, RotateCcw, ChevronRight, Lightbulb, X, Trophy, Sparkles } from 'lucide-react';
import { markLessonCompleteAuth } from '@/lib/data';
import dynamic from 'next/dynamic';

const CaptureBoard = dynamic(() => import('./CaptureBoard'), { ssr: false });
const CaptureLessonWrapper = dynamic(() => import('./CaptureLessonWrapper'), { ssr: false });
const PieceValueBoard = dynamic(() => import('./PieceValueBoard'), { ssr: false });
const PawnRaceBoard = dynamic(() => import('./PawnRaceBoard'), { ssr: false });
const RookPawnBoard = dynamic(() => import('./RookPawnBoard'), { ssr: false });
const BishopPawnBoard = dynamic(() => import('./BishopPawnBoard'), { ssr: false });
const QueenPawnBoard = dynamic(() => import('./QueenPawnBoard'), { ssr: false });
const KnightPawnBoard = dynamic(() => import('./KnightPawnBoard'), { ssr: false });
const ChessFootballBoard = dynamic(() => import('./ChessFootballBoard'), { ssr: false });
const TwoRooksMateBoard = dynamic(() => import('./TwoRooksMateBoard'), { ssr: false });
const QueenMateBoard = dynamic(() => import('./QueenMateBoard'), { ssr: false });
const RookMateBoard = dynamic(() => import('./RookMateBoard'), { ssr: false });
const ForkBoard = dynamic(() => import('./ForkBoard'), { ssr: false });
const PinBoard = dynamic(() => import('./PinBoard'), { ssr: false });
const DiscoveredAttackBoard = dynamic(() => import('./DiscoveredAttackBoard'), { ssr: false });
const MixedTacticsBoard = dynamic(() => import('./MixedTacticsBoard'), { ssr: false });
const ItalianOpeningBoard = dynamic(() => import('./ItalianOpeningBoard'), { ssr: false });
const ItalianOpeningBoardBlack = dynamic(() => import('./ItalianOpeningBoardBlack'), { ssr: false });
const ScholarMateBoard = dynamic(() => import('./ScholarMateBoard'), { ssr: false });
const MateInOneBoard = dynamic(() => import('./MateInOneBoard'), { ssr: false });
const MateInTwoBoard = dynamic(() => import('./MateInTwoBoard'), { ssr: false });
const DefendMateBoard = dynamic(() => import('./DefendMateBoard'), { ssr: false });
const SquareRuleBoard = dynamic(() => import('./SquareRuleBoard'), { ssr: false });
const CoordinateTrainingBoard = dynamic(() => import('./CoordinateTrainingBoard'), { ssr: false });
const ComputerPlayBoard = dynamic(() => import('./ComputerPlayBoard'), { ssr: false });
const TacticalStormBoard = dynamic(() => import('./TacticalStormBoard'), { ssr: false });

// ═══ MASSIVE STAR — Lichess-style filled SVG star ═══
function MassiveStar({ filled }: { filled: boolean }) {
  if (!filled) return null;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration_minutes: number;
  chess_board_fen: string | null;
  video_url: string | null;
  course_id: string;
}

interface LessonNav {
  id: string;
  title: string;
  order: number;
}

interface Props {
  lesson: Lesson;
  allLessons: LessonNav[];
  courseId: string;
  isCompletedInit: boolean;
}

function parseInteractiveConfig(videoUrl: string | null | object) {
  if (!videoUrl) return null;
  if (typeof videoUrl === 'object') return videoUrl;
  if (typeof videoUrl === 'string' && videoUrl.startsWith('{')) {
    try {
      return JSON.parse(videoUrl);
    } catch {
      return null;
    }
  }
  if (typeof videoUrl === 'string' && videoUrl.startsWith('interactive_')) {
    return { type: videoUrl };
  }
  return null;
}

/* ====== ВСТРОЕННАЯ ШАХМАТНАЯ ДОСКА (без chess.js — pure JS) ====== */
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

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

function isValidMove(pieceType: string, from: string, to: string, squares: Record<string, any>, starSquares: string[] = [], enPassantTarget: string | null = null) {
  if (squares[from]?.color !== 'w') return false;
  if (squares[to]?.color === 'w') return false;
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
      const isRookLike = (ff === tf || fr === tr);
      const isBishopLike = (Math.abs(df) === Math.abs(dr));
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
      if (Math.abs(df) > 1 || Math.abs(dr) > 1) return false;
      return true;
    }
    case 'n': {
      return (Math.abs(df) === 2 && Math.abs(dr) === 1) || (Math.abs(df) === 1 && Math.abs(dr) === 2);
    }
    case 'p': {
      const forwardDir = -1;
      if (df === 0 && dr === forwardDir) return !squares[to] && !starSquares.includes(to);
      if (df === 0 && dr === 2 * forwardDir) {
        if (from[1] !== '2') return false;
        const middleSq = `${FILES[ff]}${RANKS[fr + forwardDir]}`;
        if (squares[middleSq] || starSquares.includes(middleSq)) return false;
        return !squares[to] && !starSquares.includes(to);
      }
      if (Math.abs(df) === 1 && dr === forwardDir) {
        if (starSquares.includes(to)) return true;
        if (squares[to] && squares[to].color !== 'w') return true;
        if (enPassantTarget && to === enPassantTarget) return true;
        return false;
      }
      return false;
    }
    default:
      return false;
  }
}

function isSquareAttackedBy(square: string, squares: Record<string, any>, attackerColor: 'w' | 'b') {
  for (const sq in squares) {
    const p = squares[sq];
    if (!p || p.color !== attackerColor) continue;
    if (isValidMove(p.type, sq, square, squares, [])) return true;
  }
  return false;
}

function getValidSquares(pieceType: string, from: string, squares: Record<string, any>, starSquares: string[], movedPieces?: Set<string>, enPassantTarget?: string | null): string[] {
  if (squares[from]?.color !== 'w') return [];
  const ff = FILES.indexOf(from[0]);
  const fr = RANKS.indexOf(from[1]);
  const valid: string[] = [];

  const tryAdd = (f: number, r: number): boolean => {
    if (f < 0 || f >= 8 || r < 0 || r >= 8) return false;
    const sq = `${FILES[f]}${RANKS[r]}`;
    const p = squares[sq];
    if (p && p.color === 'w') return false;
    if (starSquares.includes(sq)) {
      valid.push(sq);
      return false;
    }
    valid.push(sq);
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
            if (!p || p.color !== 'w') valid.push(sq);
          }
        }
      }
      if (from === 'e1') {
        const kingHasMoved = movedPieces?.has('e1') || movedPieces?.has('k') || false;
        const rook = squares['h1'];
        const rookHasMoved = movedPieces?.has('h1') || movedPieces?.has('rh1') || false;
        if (!kingHasMoved && !rookHasMoved && rook && rook.type === 'r' && rook.color === 'w' && !squares['f1'] && !squares['g1']) {
          valid.push('g1');
        }
      }
      if (from === 'e1') {
        const kingHasMoved = movedPieces?.has('e1') || movedPieces?.has('k') || false;
        const rook = squares['a1'];
        const rookHasMoved = movedPieces?.has('a1') || movedPieces?.has('ra1') || false;
        if (!kingHasMoved && !rookHasMoved && rook && rook.type === 'r' && rook.color === 'w' && !squares['d1'] && !squares['c1'] && !squares['b1']) {
          valid.push('c1');
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
          if (!p || p.color !== 'w') valid.push(sq);
        }
      }
      break;
    }
    case 'p': {
      const forwardDir = -1;
      const r1 = fr + forwardDir;
      if (r1 >= 0) {
        const sq = `${FILES[ff]}${RANKS[r1]}`;
        if (!squares[sq] && !starSquares.includes(sq)) {
          valid.push(sq);
          if (from[1] === '2') {
            const r2 = fr + 2 * forwardDir;
            if (r2 >= 0) {
              const sq2 = `${FILES[ff]}${RANKS[r2]}`;
              if (!squares[sq2] && !starSquares.includes(sq2)) valid.push(sq2);
            }
          }
        }
      }
      for (const df of [-1, 1]) {
        const fd = ff + df;
        const rd = fr + forwardDir;
        if (fd >= 0 && fd < 8 && rd >= 0) {
          const sq = `${FILES[fd]}${RANKS[rd]}`;
          const p = squares[sq];
          if ((p && p.color !== 'w') || starSquares.includes(sq)) valid.push(sq);
          if (enPassantTarget && sq === enPassantTarget) valid.push(sq);
        }
      }
      break;
    }
  }
  return valid;
}

function squaresToFen(squares: Record<string, any>, turn: string) {
  let rows = [];
  for (let ri = 0; ri < 8; ri++) {
    let row = '';
    let empty = 0;
    for (let fi = 0; fi < 8; fi++) {
      const sq = `${FILES[fi]}${RANKS[ri]}`;
      const p = squares[sq];
      if (p) {
        if (empty > 0) { row += empty; empty = 0; }
        const ch = p.type === p.type.toUpperCase() ? p.type : p.type.toUpperCase();
        row += p.color === 'w' ? ch.toUpperCase() : ch.toLowerCase();
      } else {
        empty++;
      }
    }
    if (empty > 0) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

// ─── SVG Chess Pieces ───────────────────────────
function PieceImg({ type, color }: { type: string; color: 'w' | 'b' }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  const src = `/pieces/cburnett/${pieceKey}.svg`;
  return (
    <div className="w-full h-full" style={{ filter: "var(--piece-shadow-inline)" }}>
      <img src={src} alt="" className="w-full h-full" draggable={false} />
    </div>
  );
}

function StarSvg({ size }: { size: number }) {
  return (
    <img
      src="/images/learn/star.png"
      alt="Star"
      className="star-animate"
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
      }}
    />
  );
}

interface InlineChessBoardProps {
  fen: string;
  stars?: string[];
  onMove?: (from: string, to: string) => boolean;
  pieceType?: string;
  pieceName?: string;
  guideArrows?: { from: string; to: string }[];
  hintArrows?: { from: string; to: string }[];
  movedPieces?: Set<string>;
  enPassantTarget?: string | null;
  hintLevel?: number;
  moves?: number;
  promotionPending?: { from: string; to: string } | null;
  onPromotion?: (piece: string) => void;
}

function InlineChessBoard({
  fen,
  stars = [],
  onMove,
  pieceType = 'r',
  pieceName = 'Ладья',
  guideArrows = [],
  hintArrows = [],
  movedPieces: externalMovedPieces,
  enPassantTarget,
  hintLevel = 0,
  moves = 0,
  promotionPending,
  onPromotion,
}: InlineChessBoardProps) {
  const pieceErrHint =
    pieceType === 'b' ? 'Слон ходит по диагонали!' :
    pieceType === 'q' ? 'Ферзь ходит по прямой и по диагонали!' :
    pieceType === 'k' ? 'Король ходит на одну клетку в любом направлении!' :
    pieceType === 'n' ? 'Конь ходит буквой «Г»!' :
    pieceType === 'p' ? 'Пешка ходит вперёд и бьёт по диагонали!' :
    'Ладья ходит только прямо!';
  const [msg, setMsg] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [dragPiece, setDragPiece] = useState<{ square: string; type: string; color: string } | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number; square: string; moved: boolean; pointerId: number } | null>(null);
  const processLockRef = useRef(false);
  const [sqSize, setSqSize] = useState(44);

  const [internalMovedPieces, setInternalMovedPieces] = useState<Set<string>>(new Set());
  const movedPieces = externalMovedPieces ?? internalMovedPieces;
  const setMovedPieces = externalMovedPieces ? undefined : setInternalMovedPieces;

  const fenRef = useRef(fen);
  useEffect(() => {
    if (fenRef.current !== fen) {
      fenRef.current = fen;
      setSelectedSquare(null);
      selectedSquareRef.current = null;
      setDragPiece(null);
      setDragPos({ x: 0, y: 0 });
      setHoveredSquare(null);
      setMsg('');
      pointerStartRef.current = null;
      if (!externalMovedPieces) {
        setInternalMovedPieces(new Set());
      }
    }
  }, [fen, externalMovedPieces]);

  const squaresRef = useRef<Record<string, any>>({});
  const clickRef = useRef<(square: string) => void>(() => {});
  const onMoveRef = useRef<((from: string, to: string) => boolean) | undefined>(undefined);
  const selectedSquareRef = useRef<string | null>(null);
  const starsRef = useRef<string[]>([]);

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setSqSize(Math.min(80, Math.max(42, Math.floor((window.innerWidth - 16) / 8))));
      } else {
        // Desktop 3-col layout: sidebar 180px + panel 300px + gaps ≈ 520px
        const available = Math.max(0, window.innerWidth - 520);
        setSqSize(Math.min(84, Math.max(56, Math.floor(available / 8))));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const parsed = parseFen(fen);
  const squares = parsed.squares;
  const isLight = (f: number, r: number) => (f + r) % 2 === 0;

  const getSquareFromPoint = (clientX: number, clientY: number): string | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const cell = el.closest('[data-square]') as HTMLElement | null;
    return cell?.dataset.square || null;
  };

  const click = useCallback(
    (square: string) => {
      const sqs = squaresRef.current;
      const sel = selectedSquareRef.current;
      const piece = sqs[square];
      if (sel) {
        if (sel === square) {
          selectedSquareRef.current = null;
          setSelectedSquare(null);
          return;
        }
        const accepted = onMoveRef.current?.(sel, square);
        if (accepted !== false) {
          selectedSquareRef.current = null;
          setSelectedSquare(null);
          setMsg('');
          const movedPiece = sqs[sel];
          if (movedPiece && setMovedPieces) {
            setMovedPieces((prev) => {
              const next = new Set(prev);
              next.add(sel);
              if (movedPiece.type === 'k') next.add('k');
              if (movedPiece.type === 'r') {
                if (sel === 'a1') next.add('ra1');
                if (sel === 'h1') next.add('rh1');
              }
              return next;
            });
          }
        } else {
          selectedSquareRef.current = null;
          setSelectedSquare(null);
        }
      } else {
        if (piece && piece.color === 'w') {
          selectedSquareRef.current = square;
          setSelectedSquare(square);
        }
      }
    },
    [],
  );

  useEffect(() => {
    squaresRef.current = squares;
  }, [squares]);
  useEffect(() => {
    starsRef.current = stars;
  }, [stars]);
  useEffect(() => {
    clickRef.current = click;
  }, [click]);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, square: string) => {
      if (processLockRef.current) return;
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      e.preventDefault();
      pointerStartRef.current = { x: e.clientX, y: e.clientY, square, moved: false, pointerId: e.pointerId };
      setMsg('');
      const piece = squaresRef.current[square];
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    },
    [],
  );

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
        start.moved = true;
        const piece = squaresRef.current[start.square];
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
        const targetSquare = getSquareFromPoint(e.clientX, e.clientY);
        if (targetSquare && targetSquare !== start.square) {
          const accepted = onMoveRef.current?.(start.square, targetSquare);
          if (accepted !== false) {
            const movedPiece = squaresRef.current[start.square];
            if (movedPiece && setMovedPieces) {
              setMovedPieces((prev) => {
                const next = new Set(prev);
                next.add(start.square);
                if (movedPiece.type === 'k') next.add('k');
                if (movedPiece.type === 'r') {
                  if (start.square === 'a1') next.add('ra1');
                  if (start.square === 'h1') next.add('rh1');
                }
                return next;
              });
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
  }, []);

  const preventDrag = (e: React.DragEvent) => e.preventDefault();

  // Hint visualization squares
  const hintPieceSquare = useMemo(() => {
    if (hintLevel < 1) return null;
    // Find the first white piece that should move (piece matching pieceType or any white piece)
    for (const sq of Object.keys(squares)) {
      const p = squares[sq];
      if (p && p.color === 'w' && (p.type === pieceType || !pieceType)) return sq;
    }
    return null;
  }, [hintLevel, squares, pieceType]);

  const hintValidSquares = useMemo(() => {
    if (hintLevel < 2 || !hintPieceSquare) return [];
    return getValidSquares(
      squares[hintPieceSquare]?.type || pieceType,
      hintPieceSquare,
      squares,
      stars,
      movedPieces
    );
  }, [hintLevel, hintPieceSquare, squares, pieceType, stars, movedPieces]);

  const hintTargetSquare = useMemo(() => {
    if (hintLevel < 3) return null;
    // Return first star as the target
    return stars[0] || null;
  }, [hintLevel, stars]);

  const validMoves = selectedSquare
    ? getValidSquares(squares[selectedSquare]?.type || pieceType, selectedSquare, squares, stars, movedPieces)
    : dragPiece
      ? getValidSquares(squares[dragPiece.square]?.type || pieceType, dragPiece.square, squares, stars, movedPieces)
      : [];

  return (
    <div className="flex flex-col items-center gap-2 select-none" style={{ touchAction: 'none' }}>
      <div className="grid border-[5px] border-[#1a1612] rounded relative select-none board-fade-in" style={{ gridTemplateColumns: `repeat(8, ${sqSize}px)`, gridTemplateRows: `repeat(8, ${sqSize}px)`, touchAction: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        {RANKS.map((rank, ri) =>
          FILES.map((file, fi) => {
            const sq = `${file}${rank}`;
            const pieceObj = squares[sq];
            const light = isLight(fi, ri);
            const sel = selectedSquare === sq;
            const isSource = dragPiece?.square === sq;
            const hasStar = stars.includes(sq);
            const isValidMove = validMoves.includes(sq);
            const hover = hoveredSquare === sq;
            return (
              <div
                key={sq}
                data-square={sq}
                className={`flex items-center justify-center relative select-none`}
                style={{ width: sqSize, height: sqSize, cursor: pieceObj && pieceObj.color === 'w' ? 'grab' : 'default', touchAction: 'none', backgroundColor: light ? 'var(--square-light)' : 'var(--square-dark)' }}
                onPointerDown={(e) => handlePointerDown(e, sq)}
                onDragStart={preventDrag}
                onMouseEnter={() => setHoveredSquare(sq)}
                onMouseLeave={() => setHoveredSquare(null)}
              >
                {sel && !hasStar && (
                  <div className="absolute inset-0 bg-[rgba(184,149,106,0.35)] pointer-events-none z-10" />
                )}
                {hover && !sel && (
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(184,149,106,0.35)', zIndex: 5 }} />
                )}
                {hintPieceSquare === sq && hintLevel >= 1 && !sel && (
                  <div className="absolute inset-[2px] rounded-[4px] hint-piece-emphasis pointer-events-none z-[9]" />
                )}
                {hintValidSquares.includes(sq) && hintLevel >= 2 && !sel && !isValidMove && (
                  <div className="absolute inset-0 hint-valid-square pointer-events-none z-[8]" />
                )}
                {hintTargetSquare === sq && hintLevel >= 3 && (
                  <div className="absolute inset-0 hint-target-square pointer-events-none z-[11]" />
                )}
                {fi === 0 && <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>{rank}</span>}
                {ri === 7 && <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[var(--square-dark)]' : 'text-[var(--square-light)]'}`}>{file}</span>}
                {isValidMove && !hasStar && !(pieceObj && pieceObj.color === 'b') && (
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
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ zIndex: 25, opacity: hasStar ? 1 : 0, visibility: hasStar ? 'visible' : 'hidden' }}
                >
                  <div className={hasStar ? 'star-twinkle' : ''}>
                    <StarSvg size={Math.round(sqSize * 0.65)} />
                  </div>
                </div>
                {isValidMove && (pieceObj?.color === 'b' || hasStar) && (
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
                {pieceObj && !isSource && (
                  <div className="relative pointer-events-none z-30" style={{ width: Math.round(sqSize*0.85), height: Math.round(sqSize*0.85) }}>
                    <PieceImg type={pieceObj.type} color={pieceObj.color as 'w' | 'b'} />
                  </div>
                )}
              </div>
            );
          })
        )}
        {((guideArrows.length > 0 && moves === 0) || hintArrows.length > 0) && !selectedSquare && !dragPiece && (
          <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
            {(hintArrows.length > 0 ? hintArrows : guideArrows).map((arrow, i) => {
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
        )}
        {promotionPending && onPromotion && (
        <div className="absolute z-50 pointer-events-auto promotion-panel" style={{
          left: `${(FILES.indexOf(promotionPending.to[0])) * sqSize}px`,
          top: promotionPending.from[1] === '2' && squares[promotionPending.from]?.color === 'b' ? 4 * sqSize : 0,
          width: sqSize,
          height: 4 * sqSize,
          backgroundColor: squares[promotionPending.from]?.color === 'b' ? '#F5F0E8' : '#2C241B',
          borderRadius: '0px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {PROMOTION_PIECES.map(({ code }) => {
            const pawnColor = squares[promotionPending.from]?.color || 'w';
            const isBlackPawn = pawnColor === 'b';
            return (
            <button
              key={code}
              onClick={() => onPromotion?.(code)}
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
            >
              <img
                src={`/pieces/cburnett/${isBlackPawn ? 'b' : 'w'}${code.toUpperCase()}.svg`}
                alt={code}
                draggable={false}
                style={{ width: '78%', height: '78%', objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
              />
            </button>
            );
          })}
        </div>
      )}
    </div>
    {dragPiece && (
        <div className="fixed pointer-events-none z-50" style={{ left: dragPos.x - Math.round(sqSize/2), top: dragPos.y - Math.round(sqSize/2), width: Math.round(sqSize*0.85), height: Math.round(sqSize*0.85) }}>
          <PieceImg type={dragPiece.type} color={dragPiece.color as 'w' | 'b'} />
        </div>
      )}
      {msg && <p className="text-red-500 text-xs">{msg}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-level interactive star board (like Lichess learn)
// ═══════════════════════════════════════════════════════════════════════════════
function MultiLevelStarBoard({
  config,
  onComplete,
  onAllComplete,
  onLevelComplete,
  nextLessonUrl,
  allLessons,
  courseId,
  currentLessonId,
  lessonTitle,
  lessonContent,
  prevLesson,
  nextLesson,
}: {
  config: any;
  onComplete?: () => void;
  onAllComplete?: () => void;
  onLevelComplete?: (levelIndex: number, stars: number) => void;
  nextLessonUrl?: string;
  allLessons?: any[];
  courseId?: string;
  currentLessonId?: string;
  lessonTitle?: string;
  lessonContent?: string | null;
  prevLesson?: any;
  nextLesson?: any;
}) {
  const router = useRouter();
  const pieceCodeRaw = config.pieceCode || 'wR';
  const pieceType = pieceCodeRaw.slice(-1).toLowerCase();
  const pieceName = config.pieceName || 'Ладья';
  const pieceDesc = config.pieceDescription || 'Движется по прямой';

  const [levels] = useState(() => config.levels || [
    { initialFen: config.initialFen, stars: config.stars, instructions: config.instructions, hint: config.hint }
  ]);

  const savedKey = `lesson_progress_${currentLessonId || ''}`;
  const savedProgress = useMemo(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(savedKey) || '{}');
    } catch { return {}; }
  }, [savedKey]);
  const savedCurrentLevel = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    const v = localStorage.getItem(`${savedKey}_level`);
    return v ? parseInt(v, 10) : 0;
  }, [savedKey]);

  const [currentLevel, setCurrentLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      const hashMatch = window.location.hash.match(/level=(\d+)/);
      if (hashMatch) {
        const l = parseInt(hashMatch[1], 10);
        if (l >= 0 && l < levels.length) return l;
      }
    }
    return 0;
  });

  // Sync currentLevel with URL hash
  const currentLevelRef = useRef(currentLevel);
  useEffect(() => { currentLevelRef.current = currentLevel; }, [currentLevel]);
  useEffect(() => {
    const handleHashChange = () => {
      const hashMatch = window.location.hash.match(/level=(\d+)/);
      if (hashMatch) {
        const l = parseInt(hashMatch[1], 10);
        if (l >= 0 && l < levels.length && l !== currentLevelRef.current) {
          setCurrentLevel(l);
        }
      }
    };
    // Initial check on mount
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [levels.length]);

  const [position, setPosition] = useState(levels[currentLevel || 0].initialFen);
  const positionRef = useRef(position);
  useEffect(() => { positionRef.current = position; }, [position]);

  /* ── Синхронизация URL hash с текущим уровнем ── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newHash = `level=${currentLevel}`;
      if (window.location.hash !== `#${newHash}`) {
        window.history.replaceState(null, '', `#${newHash}`);
      }
    }
  }, [currentLevel]);
  const [collected, setCollected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState('');
  const [allDone, setAllDone] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'success' | 'fail'>('intro');
  const [showHint, setShowHint] = useState(false);
  const [hintArrows, setHintArrows] = useState<{from: string; to: string}[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  useEffect(() => {
    const checkStarted = () => {
      if (typeof window !== 'undefined' && currentLessonId) {
        const started = localStorage.getItem(`lesson_started_${currentLessonId}`);
        if (started === 'true') {
          setPhase('playing');
          setShowIntro(false);
        }
      }
    };
    checkStarted();
    const timer = setTimeout(checkStarted, 500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined' && currentLessonId) {
      const started = localStorage.getItem(`lesson_started_${currentLessonId}`);
      if (started === 'true') setShowIntro(false);
    }
  }, [currentLessonId]);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{from: string, to: string} | null>(null);
  const [levelStars, setLevelStars] = useState<Record<number, number>>(() => savedProgress);
  const movesRef = useRef(moves);
  useEffect(() => { movesRef.current = moves; }, [moves]);

  const [movedPieces, setMovedPieces] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMovedPieces(new Set());
  }, [currentLevel]);

  const level = levels[currentLevel];
  const stars = useMemo(() => level.stars?.map((s: any) => typeof s === 'string' ? s : s?.square).filter(Boolean) || [], [level.stars]);
  const visibleStars = useMemo(() => stars.filter((s: string) => !collected.includes(s)), [stars, collected]);
  const totalLevels = levels.length;

  const guideArrows = useMemo(() => {
    if (currentLevel !== 0) return [];
    if (level.guideArrows != null) return level.guideArrows;

    // ── Special case: Lesson 3 Exercise 1 (queen d2 → d5 → g8) ──
    if (pieceType === 'q' && currentLevel === 0) {
      const parsed = parseFen(level.initialFen);
      const hasQueenOnD2 = parsed.squares['d2']?.type === 'q' && parsed.squares['d2']?.color === 'w';
      const hasStarD5 = stars.includes('d5');
      const hasStarG8 = stars.includes('g8');
      if (hasQueenOnD2 && hasStarD5 && hasStarG8) {
        return [{from: 'd2', to: 'd5'}, {from: 'd5', to: 'g8'}];
      }
    }

    return [];
  }, [level, pieceType, stars, currentLevel]);

  const computeHintArrow = useCallback(() => {
    const parsed = parseFen(positionRef.current);

    // ── Special case: promoted pawn (now queen) ──
    let effectivePieceType = pieceType;
    if (pieceType === 'p') {
      const hasPawn = Object.values(parsed.squares).some((p: any) => p?.color === 'w' && p?.type === 'p');
      if (!hasPawn) {
        effectivePieceType = 'q';
      }
    }

    // ── Special case: Lesson 3 Exercise 1 (queen d2 → d5 → g8) ──
    if (pieceType === 'q' && currentLevel === 0) {
      const hasStarD5 = stars.includes('d5');
      const hasStarG8 = stars.includes('g8');
      const queenSq = Object.keys(parsed.squares).find(
        (sq) => parsed.squares[sq]?.type === 'q' && parsed.squares[sq]?.color === 'w'
      );
      if (queenSq === 'd2' && hasStarD5 && hasStarG8) {
        return [{from: 'd2', to: 'd5'}, {from: 'd5', to: 'g8'}];
      }
      if (queenSq === 'd5' && hasStarG8) {
        return [{from: 'd5', to: 'g8'}];
      }
    }

    // Собираем ВСЕ стартовые позиции белых фигур нужного типа
    const allFroms: string[] = [];
    for (const sq of Object.keys(parsed.squares)) {
      const p = parsed.squares[sq];
      if (p.color === 'w' && p.type === effectivePieceType) { allFroms.push(sq); }
    }
    // Fallback: любая белая фигура
    if (allFroms.length === 0) {
      for (const sq of Object.keys(parsed.squares)) {
        if (parsed.squares[sq].color === 'w') { allFroms.push(sq); break; }
      }
    }
    if (allFroms.length === 0 || visibleStars.length === 0) return [];

    // ── Special case: pawn — show first step toward promotion ──
    if (pieceType === 'p') {
      const pawnSq = allFroms[0];
      if (pawnSq) {
        const file = pawnSq[0];
        const rank = parseInt(pawnSq[1]);
        let firstStep: string | null = null;
        if (rank === 7) firstStep = `${file}8`;
        else if (rank === 6) firstStep = `${file}7`;
        else if (rank === 5) firstStep = `${file}6`;
        else if (rank === 4) firstStep = `${file}5`;
        else if (rank === 3) firstStep = `${file}4`;
        else if (rank === 2) firstStep = `${file}4`;
        else if (rank === 1) firstStep = `${file}2`;
        if (firstStep) {
          return [{ from: pawnSq, to: firstStep }];
        }
      }
    }

    /* ── BFS shortest path from → to (chess-legal, returns path array or null) ── */
    const pathCache = new Map<string, string[] | null>();
    const getPath = (start: string, target: string, blockedStars: string[]) => {
      const cacheKey = `${start}|${target}|${blockedStars.slice().sort().join(',')}`;
      const cached = pathCache.get(cacheKey);
      if (cached !== undefined) return cached;
      const passableBlocked = blockedStars.filter((s: string) => s !== target);
      // Удаляем ВСЕ белые фигуры того же типа (для multi-piece TSP другие фигуры того типа
      // должны считаться "отошедшими" и не блокировать диагонали)
      const virtualSquares = {...parsed.squares};
      for (const sq of Object.keys(virtualSquares)) {
        if (virtualSquares[sq]?.color === 'w' && virtualSquares[sq]?.type === effectivePieceType) {
          delete virtualSquares[sq];
        }
      }
      virtualSquares[start] = {type: effectivePieceType, color: 'w'};
      const q: string[] = [];
      const prev = new Map<string, string | null>();
      q.push(start);
      prev.set(start, null);
      while (q.length > 0) {
        const cur = q.shift()!;
        if (cur === target) break;
        // Временно размещаем фигуру на cur, чтобы isValidMove принял ход отсюда
        virtualSquares[cur] = {type: effectivePieceType, color: 'w'};
        for (let f = 0; f < 8; f++) {
          for (let r = 0; r < 8; r++) {
            const dest = `${FILES[f]}${RANKS[r]}`;
            if (dest === cur || prev.has(dest)) continue;
            if (!isValidMove(effectivePieceType, cur, dest, virtualSquares, passableBlocked, parsed.enPassant)) continue;
            prev.set(dest, cur);
            q.push(dest);
          }
        }
        delete virtualSquares[cur];
      }
      if (!prev.has(target)) {
        pathCache.set(cacheKey, null);
        return null;
      }
      const path: string[] = [];
      let node: string | null = target;
      while (node !== null) {
        path.unshift(node);
        node = prev.get(node) ?? null;
      }
      pathCache.set(cacheKey, path);
      return path;
    };

    // ── TSP для одной стартовой позиции и набора звёзд (subset) ──
    // Held-Karp DP с динамическим blockedStars: блокируем только НЕпосещённые звёзды.
    // Статический dist matrix давал неверные пути, т.к. звёзды "исчезают" по ходу маршрута.
    const solveTSP = (from: string, starsSubset: string[]) => {
      if (starsSubset.length === 0) return { total: 0, firstStep: null };
      const m = starsSubset.length;
      const INF = Infinity;
      const dp: number[][] = Array(1 << m).fill(null).map(() => Array(m).fill(INF));
      const firstStep: (string | null)[][] = Array(1 << m).fill(null).map(() => Array(m).fill(null));

      // Блокируем все visibleStars, кроме:
      //   - целевой звезды (targetIdx)
      //   - уже посещённых (бит в mask установлен)
      const buildBlocked = (targetIdx: number, mask: number) => {
        const blocked: string[] = [];
        for (const s of visibleStars) {
          const idxInSubset = starsSubset.indexOf(s);
          if (idxInSubset === targetIdx) continue; // цель проходима
          if (idxInSubset !== -1 && (mask & (1 << idxInSubset))) continue; // посещённые проходимы
          blocked.push(s);
        }
        return blocked;
      };

      // База: from -> каждая звезда
      for (let i = 0; i < m; i++) {
        const blocked = buildBlocked(i, 1 << i);
        const p = getPath(from, starsSubset[i], blocked);
        if (p) {
          dp[1 << i][i] = p.length - 1;
          firstStep[1 << i][i] = p.length >= 2 ? p[1] : starsSubset[i];
        }
      }

      // Переходы
      for (let mask = 1; mask < (1 << m); mask++) {
        for (let last = 0; last < m; last++) {
          if (!(mask & (1 << last))) continue;
          if (dp[mask][last] === INF) continue;
          for (let nxt = 0; nxt < m; nxt++) {
            if (mask & (1 << nxt)) continue;
            const blocked = buildBlocked(nxt, mask);
            const p = getPath(starsSubset[last], starsSubset[nxt], blocked);
            if (!p) continue;
            const newMask = mask | (1 << nxt);
            const cost = dp[mask][last] + (p.length - 1);
            if (cost < dp[newMask][nxt]) {
              dp[newMask][nxt] = cost;
              firstStep[newMask][nxt] = firstStep[mask][last];
            }
          }
        }
      }

      let bestTotal = INF;
      let bestFirstStep: string | null = null;
      const fullMask = (1 << m) - 1;
      for (let i = 0; i < m; i++) {
        if (dp[fullMask][i] < bestTotal) {
          bestTotal = dp[fullMask][i];
          bestFirstStep = firstStep[fullMask][i];
        }
      }

      return { total: bestTotal === INF ? null : bestTotal, firstStep: bestFirstStep };
    };

    // ── Single-piece: старая логика (обратная совместимость) ──
    if (allFroms.length === 1) {
      const from = allFroms[0];
      const { total, firstStep } = solveTSP(from, visibleStars);
      if (firstStep && total !== null) {
        const sameFile = from[0] === firstStep[0];
        const sameRank = from[1] === firstStep[1];
        if (effectivePieceType === 'r' && (sameFile || sameRank)) {
          return [{ from, to: firstStep }];
        }
        if (effectivePieceType !== 'r') {
          return [{ from, to: firstStep }];
        }
      }
    } else {
      // ── Multi-piece: перебираем все разбиения звёзд между фигурами ──
      // Кодируем разбиение битовой маской: для каждой звезды i, бит i указывает какой фигуре она отдана
      // (для 2+ фигур используем base-(allFroms.length) partition, но оптимально: генерируем маски)
      // Упрощаем: для N фигур генерируем все назначения (N^stars). Для 2 фигур и 7 звёзд = 128 вариантов
      const nPieces = allFroms.length;
      const nStars = visibleStars.length;
      let globalBestTotal = Infinity;
      let globalBestFirstStep: string | null = null;
      let globalBestFrom: string | null = null;

      const generatePartitions = (idx: number, assignment: number[]) => {
        if (idx === nStars) {
          // assignment[i] = индекс фигуры, которой отдана звезда i
          const pieceStars: string[][] = Array(nPieces).fill(null).map(() => []);
          for (let i = 0; i < nStars; i++) {
            pieceStars[assignment[i]].push(visibleStars[i]);
          }
          let totalSum = 0;
          let anyNull = false;
          for (let p = 0; p < nPieces; p++) {
            const result = solveTSP(allFroms[p], pieceStars[p]);
            if (result.total === null) { anyNull = true; break; }
            totalSum += result.total;
          }
          if (anyNull) return;
          if (totalSum < globalBestTotal) {
            globalBestTotal = totalSum;
            // Выбираем первый ход первой фигуры, у которой есть звёзды
            for (let p = 0; p < nPieces; p++) {
              if (pieceStars[p].length > 0) {
                const result = solveTSP(allFroms[p], pieceStars[p]);
                globalBestFirstStep = result.firstStep;
                globalBestFrom = allFroms[p];
                break;
              }
            }
          }
          return;
        }
        for (let p = 0; p < nPieces; p++) {
          assignment.push(p);
          generatePartitions(idx + 1, assignment);
          assignment.pop();
        }
      };

      generatePartitions(0, []);

      if (globalBestFirstStep && globalBestFrom) {
        const sameFile = globalBestFrom[0] === globalBestFirstStep[0];
        const sameRank = globalBestFrom[1] === globalBestFirstStep[1];
        if (effectivePieceType === 'r' && (sameFile || sameRank)) {
          return [{ from: globalBestFrom, to: globalBestFirstStep }];
        }
        if (effectivePieceType !== 'r') {
          return [{ from: globalBestFrom, to: globalBestFirstStep }];
        }
      }
    }

    // Fallback: для каждой стартовой фигуры ищем ближайшую звезду по правилам хода
    let fallbackFrom: string | null = null;
    let fallbackTo: string | null = null;
    let fallbackDist = Infinity;
    for (const startSq of allFroms) {
      for (const star of visibleStars) {
        if (!isValidMove(effectivePieceType, startSq, star, parsed.squares, visibleStars, parsed.enPassant)) continue;
        const sFile = FILES.indexOf(startSq[0]);
        const sRank = RANKS.indexOf(startSq[1]);
        const tFile = FILES.indexOf(star[0]);
        const tRank = RANKS.indexOf(star[1]);
        const md = Math.abs(sFile - tFile) + Math.abs(sRank - tRank);
        if (md < fallbackDist) {
          fallbackDist = md;
          fallbackFrom = startSq;
          fallbackTo = star;
        }
      }
    }
    if (fallbackFrom && fallbackTo) {
      return [{ from: fallbackFrom, to: fallbackTo }];
    }
    return [];
  }, [position, pieceType, visibleStars]);

  /* ── Сохраняем прогресс в базу при завершении последнего уровня ── */
  useEffect(() => {
    if (phase === 'success' && currentLevel + 1 >= totalLevels && !allDone) {
      setAllDone(true);
      onAllComplete?.();
    }
  }, [phase, currentLevel, totalLevels, allDone, onAllComplete]);

  const reset = useCallback(() => {
    setPosition(level.initialFen);
    setCollected([]);
    setMoves(0);
    setMsg('');
    setFailed(false);
    setGameOver(false);
    setPhase('playing');
    setShowIntro(false);
    setShowHint(false);
    setHintArrows([]);
    setHintLevel(0);
  }, [level]);

  useEffect(() => {
    setPosition(levels[currentLevel].initialFen);
    setCollected([]);
    setMoves(0);
    setMsg('');
    setHintArrows([]);
    setShowHint(false);
    setHintLevel(0);
  }, [currentLevel, levels]);

  const handleMove = useCallback(
    (from: string, to: string) => {
      setHintArrows([]);
      setShowHint(false);
      if (phase !== 'playing') return false;
      const parsed = parseFen(positionRef.current);
      if (parsed.squares[from]?.color !== 'w') return false;
      const fromType = parsed.squares[from]?.type || pieceType;
      
      if (level.allowedPieces && level.allowedPieces.length > 0) {
        const effectiveAllowed = (currentLessonId === '13')
          ? [...new Set([...level.allowedPieces, 'p'])] 
          : level.allowedPieces;
        if (!effectiveAllowed.includes(fromType)) {
          setMsg(`Используйте только ${getAllowedPieceName(effectiveAllowed[0])}!`);
          return false;
        }
      }
      
      if (fromType === 'k' && from === 'e1' && to === 'g1') {
        const rook = parsed.squares['h1'];
        if (rook && rook.type === 'r' && rook.color === 'w') {
          if (!parsed.squares['f1'] && !parsed.squares['g1']) {
            const castlingSquares = { ...parsed.squares };
            delete castlingSquares['e1'];
            castlingSquares['g1'] = { type: 'k', color: 'w' };
            delete castlingSquares['h1'];
            castlingSquares['f1'] = { type: 'r', color: 'w' };
            const castlingFen = squaresToFen(castlingSquares, 'w');
            positionRef.current = castlingFen;
            setPosition(castlingFen);
            setMoves((c) => c + 1);
            setMsg('🏰 Рокировка!');
            if (stars.includes('g1') && !collected.includes('g1')) {
              setCollected((prev) => [...prev, 'g1']);
            }
            setTimeout(() => {
              setLevelStars((prev) => ({ ...prev, [currentLevel]: 3 }));
              onLevelComplete?.(currentLevel, 3);
              setPhase('success');
            }, 800);
            return true;
          }
        }
      }

      if (fromType === 'k' && from === 'e1' && to === 'c1') {
        const rook = parsed.squares['a1'];
        if (rook && rook.type === 'r' && rook.color === 'w') {
          if (!parsed.squares['d1'] && !parsed.squares['c1'] && !parsed.squares['b1']) {
            const castlingSquares = { ...parsed.squares };
            delete castlingSquares['e1'];
            castlingSquares['c1'] = { type: 'k', color: 'w' };
            delete castlingSquares['a1'];
            castlingSquares['d1'] = { type: 'r', color: 'w' };
            const castlingFen = squaresToFen(castlingSquares, 'w');
            positionRef.current = castlingFen;
            setPosition(castlingFen);
            setMoves((c) => c + 1);
            setMsg('🏰 Рокировка!');
            setTimeout(() => {
              setLevelStars((prev) => ({ ...prev, [currentLevel]: 3 }));
              onLevelComplete?.(currentLevel, 3);
              setPhase('success');
            }, 800);
            return true;
          }
        }
      }

      if (!isValidMove(fromType, from, to, parsed.squares, visibleStars, parsed.enPassant)) return false;

      if (fromType === 'p' && to[1] === '8') {
        setPromotionPending({ from, to });
        return false;
      }

      const newSquares = { ...parsed.squares };
      const movedPiece = parsed.squares[from];
      const movedType = movedPiece?.type || pieceType;
      delete newSquares[from];
      newSquares[to] = { type: movedType, color: 'w' };
      if (movedType === 'p' && parsed.enPassant && to === parsed.enPassant) {
        const capturedFile = to[0];
        const capturedRank = from[1];
        const capturedSq = `${capturedFile}${capturedRank}`;
        delete newSquares[capturedSq];
      }
      let nextEnPassant: string | null = null;
      if (movedType === 'p' && from[1] === '2' && to[1] === '4') {
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

      setMovedPieces((prev) => {
        const next = new Set(prev);
        next.add(from);
        if (movedType === 'k') next.add('k');
        if (movedType === 'r') {
          if (from === 'a1') next.add('ra1');
          if (from === 'h1') next.add('rh1');
        }
        return next;
      });

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
          setPhase('fail');
          return false;
        }
      }

      if (level.requireCheck) {
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
            if (isValidMove(p.type, sq, blackKingSq, newSquares, [])) {
              isCheck = true;
              break;
            }
          }
        }
        if (!isCheck) {
          setFailed(true);
          setGameOver(true);
          setPhase('fail');
          return false;
        }
        const max = level.maxMoves || stars.length + 1;
        const m = movesRef.current + 1;
        let earned = 3;
        if (m <= max) earned = 3;
        else if (m <= max + 1) earned = 2;
        else earned = 1;
        setLevelStars((prev) => ({ ...prev, [currentLevel]: earned }));
        onLevelComplete?.(currentLevel, earned);
        setPhase('success');
        return true;
      }

      if (stars.length === 0) {
        if (currentLessonId === '13') {
          if (fromType === 'k' && (to === 'g1' || to === 'c1')) {
            let earned = 3;
            const max = level.maxMoves || 1;
            const m = movesRef.current + 1;
            if (m <= max) earned = 3;
            else if (m <= max + 1) earned = 2;
            else earned = 1;
            setLevelStars((prev) => ({ ...prev, [currentLevel]: earned }));
            onLevelComplete?.(currentLevel, earned);
            setPhase('success');
            return true;
          } else if (fromType === 'k') {
            setFailed(true);
            setGameOver(true);
            setPhase('fail');
            return false;
          }
          return true;
        }

        const max = level.maxMoves || 1;
        const m = movesRef.current + 1;
        let earned = 3;
        if (m <= max) earned = 3;
        else if (m <= max + 1) earned = 2;
        else earned = 1;
        setLevelStars((prev) => ({ ...prev, [currentLevel]: earned }));
        onLevelComplete?.(currentLevel, earned);
        setPhase('success');
        return true;
      }

      if (stars.includes(to) && !collected.includes(to)) {
        setCollected((prev) => {
          const next = [...prev, to];
          const allCollected = stars.every((s: string) => next.includes(s));
          if (allCollected) {
            const max = level.maxMoves || stars.length + 1;
            const m = movesRef.current + 1;
            let earned = 3;
            if (m <= max) earned = 3;
            else if (m <= max + 1) earned = 2;
            else earned = 1;
            setLevelStars((prev) => ({ ...prev, [currentLevel]: earned }));
            onLevelComplete?.(currentLevel, earned);
            setPhase('success');
          } else {
            setMsg(`⭐ ${next.length} / ${stars.length} звёзд`);
          }
          return next;
        });
      }
      return true;
    },
    [stars, collected, currentLevel, totalLevels, onAllComplete, phase]
  );

  const handlePromotion = useCallback(
    (piece: string) => {
      if (!promotionPending) return;
      const { from, to } = promotionPending;
      const parsed = parseFen(positionRef.current);
      const newSquares = { ...parsed.squares };
      delete newSquares[from];
      newSquares[to] = { type: piece, color: 'w' };
      const newFen = squaresToFen(newSquares, 'w');
      positionRef.current = newFen;
      setPosition(newFen);
      setMoves((c) => c + 1);
      setMsg('');
      setPromotionPending(null);

      // Check collect star
      if (stars.includes(to) && !collected.includes(to)) {
        setCollected((prev) => {
          const next = [...prev, to];
          const allCollected = stars.every((s: string) => next.includes(s));
          if (allCollected) {
            const max = level.maxMoves || stars.length + 1;
            const m = movesRef.current + 1;
            let earned = 3;
            if (m <= max) earned = 3;
            else if (m <= max + 1) earned = 2;
            else earned = 1;
            setLevelStars((prev) => ({ ...prev, [currentLevel]: earned }));
            onLevelComplete?.(currentLevel, earned);
            setPhase('success');
          } else {
            setMsg(`⭐ ${next.length} / ${stars.length} звёзд`);
          }
          return next;
        });
      }
    },
    [promotionPending, stars, collected, currentLevel, onLevelComplete]
  );

  const collectedCount = stars.filter((s: string) => collected.includes(s)).length;
  const allCollected = stars.every((s: string) => collected.includes(s));

  // ═══ LEVEL PILLS — under board, Lichess-style ═══
  const LevelPills = () => (
    <div className="w-full flex items-stretch gap-[1px]">
      {levels.map((_l: any, i: number) => {
        const earned = levelStars[i];
        const starCount = typeof earned === 'number' ? earned : (earned ? 1 : 0);
        const isCurrent = i === currentLevel;
        const isDone = earned != null;
        const isFuture = !isCurrent && !isDone && i > currentLevel;
        return (
          <button
            key={i}
            onClick={() => {
              if (isCurrent) return;
              setCurrentLevel(i);
              setAllDone(false);
              setPhase('playing');
            }}
            disabled={isCurrent}
            className={`flex-1 flex flex-col items-center justify-center gap-[2px] rounded-md transition-all duration-200 h-9 ${
              isCurrent
                ? 'bg-[#2C241B] shadow-md'
                : isDone
                  ? 'bg-[#C9A84C]'
                  : 'bg-[#F0EBE4] border border-[#D4C5B5]'
            } ${isCurrent ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
            title={isDone ? `Упражнение ${i + 1} — пройдено` : `Упражнение ${i + 1}`}
          >
            {isDone && starCount > 0 ? (
              starCount === 3 ? (
                <>
                  <div className="flex">
                    <MassiveStar filled={true} />
                  </div>
                  <div className="flex gap-[1px]">
                    <MassiveStar filled={true} />
                    <MassiveStar filled={true} />
                  </div>
                </>
              ) : (
                <div className="flex gap-[2px] justify-center w-full">
                  {Array.from({ length: starCount }, (_, s) => (
                    <MassiveStar key={s} filled={true} />
                  ))}
                </div>
              )
            ) : (
              <span className={`text-sm font-bold leading-none ${
                isCurrent ? 'text-white' : 'text-[#9CA3AF]'
              }`}>{i + 1}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ═══ EXERCISE NAVIGATION DOTS — compact horizontal bar (DEPRECATED, kept for reference) ═══
  const ExerciseDots = () => (
    <div className="flex items-center justify-center gap-1">
      {levels.map((_l: any, i: number) => {
        const earned = levelStars[i];
        const starCount = typeof earned === 'number' ? earned : (earned ? 1 : 0);
        const isCurrent = i === currentLevel;
        const isDone = earned != null;
        const isFuture = !isCurrent && !isDone && i > currentLevel;
        return (
          <div key={i} className="flex flex-col items-center gap-1 w-[52px] lg:w-auto">
            <button
              onClick={() => {
                if (isCurrent) return;
                setCurrentLevel(i);
                setAllDone(false);
                setPhase('playing');
              }}
              disabled={isCurrent}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-6 h-6 bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : isDone
                    ? 'w-5 h-5 bg-[#E8E0D6] border border-[#C9C0B6] text-[var(--text-tertiary)] opacity-50'
                    : 'w-5 h-5 bg-[var(--bg-secondary)] text-[var(--text-muted)] opacity-50'
              } ${isCurrent ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
              title={isDone ? `Упражнение ${i + 1} — пройдено` : `Упражнение ${i + 1}`}
            >
              <span className={`font-bold ${isCurrent ? 'text-[11px]' : isDone ? 'text-[10px]' : 'text-[9px]'}`}>
                {i + 1}
              </span>
              {isCurrent && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
              )}
            </button>
            {/* Mobile: 3 mini-stars */}
            <div className="flex gap-[1px] lg:hidden">
              {[0, 1, 2].map(s => (
                <span key={s} className={`text-[10px] ${s < starCount ? 'text-[#D4A843]' : 'text-[#E8E0D6]'}`}>★</span>
              ))}
            </div>
            {/* Desktop: 1 star = rating color */}
            <span className="hidden lg:block text-[10px]">
              {starCount >= 3 && <span className="text-[#D4A843]">★</span>}
              {starCount === 2 && <span className="text-[#B0B0B0]">★</span>}
              {starCount === 1 && <span className="text-[#B8956A]">★</span>}
              {starCount === 0 && <span className="text-[#E8E0D6]">★</span>}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ═══ INTRO OVERLAY ═══
  const IntroOverlay = () => (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-sm">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-[320px] text-center space-y-4 mx-4">
        <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto">
          <img src={`/pieces/cburnett/${pieceCodeRaw}.svg`} className="w-8 h-8" draggable={false} alt="" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-[var(--text-primary)]">{pieceName}</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{pieceDesc}</p>
        </div>
        <button
          onClick={() => setPhase('playing')}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            boxShadow: '0 4px 12px rgba(46,107,122,0.3)',
          }}
        >
          Начать
        </button>
      </div>
    </div>
  );

  // ═══ SUCCESS OVERLAY — compact, contextual, premium ═══
  const SuccessOverlay = () => {
    const earned = levelStars[currentLevel] || 3;
    const isLast = currentLevel + 1 >= totalLevels;
    
    // Auto-advance after brief delay
    useEffect(() => {
      const timer = setTimeout(() => {
        if (!isLast) {
          setCurrentLevel((l) => l + 1);
          setPhase('playing');
          setMsg('');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }, [isLast]);
    
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
        {/* Quick toast — not covering board */}
        <div className="bg-[var(--bg-primary)]/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-[#d4c4b0]/30 text-center pointer-events-auto success-bounce">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={14}
                className={s <= earned ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-[#e5dfd8]'}
                strokeWidth={2.5}
              />
            ))}
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {isLast ? 'Урок завершён' : 'Отлично!'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ═══ FAIL OVERLAY — quiet, contextual ═══
  const FailOverlay = () => (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8 pointer-events-none">
      <div className="bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-[#d4c4b0]/40 text-center pointer-events-auto shake mx-4">
        <div className="flex items-center justify-center gap-2">
          <RotateCcw size={14} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {level.hint || 'Подумайте ещё раз о правилах движения фигуры'}
          </span>
        </div>
        <button
          onClick={reset}
          className="mt-3 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <RotateCcw size={14} />
            <span>Заново</span>
          </div>
        </button>
      </div>
    </div>
  );

  // ═══ HINT TOAST — warm paper, no black ═══
  const HintToast = () => (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[var(--bg-primary)] border border-[#d4c4b0]/50 text-[var(--text-primary)] px-4 py-2.5 rounded-xl shadow-lg text-sm max-w-[280px] text-center hint-slide-up">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-[#c9a84c] flex-shrink-0" />
        <span className="text-xs">{level.hint || 'Попробуйте найти кратчайший путь к звёздам'}</span>
      </div>
      <button
        onClick={() => setShowHint(false)}
        className="absolute -top-2 -right-2 w-5 h-5 bg-[#d4c4b0] rounded-full flex items-center justify-center text-white text-xs hover:bg-[#b8a898]"
      >
        <X size={10} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1200px] mx-auto gap-6 py-6 items-start justify-center">
      {/* LEFT SIDEBAR — Desktop only, 180px */}
      <div className="hidden lg:flex w-[180px] flex-shrink-0 flex-col gap-4">
        {/* ЗАДАНИЕ label + title */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Задание</p>
          <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]">
            <span>{currentLevel + 1} из {totalLevels}</span>
            <span className="text-[var(--text-tertiary)]">—</span>
            <img src={`/pieces/cburnett/${pieceCodeRaw}.svg`} className="w-[18px] h-[18px] inline-block" draggable={false} alt="" />
            <span>{pieceName}</span>
          </div>
        </div>
        <LevelPills />
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setHintLevel(0);
              if (hintArrows.length === 0) {
                if (hintLoading) return;
                setHintLoading(true);
                window.setTimeout(() => {
                  const arrows = computeHintArrow();
                  setHintArrows(arrows);
                  setShowHint(arrows.length > 0);
                  setHintLoading(false);
                }, 0);
              } else {
                setHintArrows([]);
                setShowHint(false);
              }
            }}
            disabled={hintLoading}
            className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all duration-200 ${showHint ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'} ${hintLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Lightbulb size={14} /> {hintLoading ? 'Думаю...' : 'Подсказка'}
          </button>
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] text-xs font-medium transition-all duration-200"
          >
            <RotateCcw size={14} /> Заново
          </button>
        </div>

      </div>

      {/* CENTER — Board */}
      <div className="flex-1 flex flex-col items-center justify-center w-full lg:min-w-0">
        <div className="lg:hidden w-full flex flex-col gap-2 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 flex-shrink-0">
              <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
            </div>
            <div className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
              <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-3">
                {phase === 'intro' && (lessonTitle || lessonContent || pieceDesc)}
                {phase === 'playing' && (level.instructions || 'Выполните задание')}
                {phase === 'success' && 'Отлично! Задание выполнено!'}
                {phase === 'fail' && 'Подумай ещё раз...'}
              </p>
            </div>
          </div>
        </div>

        {/* BOARD */}
        <div className="flex justify-center w-full">
          <div className="relative inline-block rounded-sm">
            <InlineChessBoard
              fen={position}
              stars={visibleStars}
              onMove={handleMove}
              pieceType={pieceType}
              pieceName={pieceName}
              guideArrows={guideArrows}
              hintArrows={hintArrows}
              movedPieces={movedPieces}
              hintLevel={hintLevel}
              moves={moves}
              promotionPending={promotionPending}
              onPromotion={handlePromotion}
            />
            {phase === 'intro' && <IntroOverlay />}
            {phase === 'success' && <SuccessOverlay />}
            {phase === 'fail' && <FailOverlay />}
          </div>
        </div>

        {/* Level Pills — under board, mobile + desktop */}
        <div className="mt-3 w-full px-0 self-stretch">
          <LevelPills />
        </div>

        {/* Mobile bottom toolbar — скрыт на intro */}
        {phase !== 'intro' && (
          <div className="lg:hidden w-full flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Задание {currentLevel + 1} из {totalLevels}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                style={{ width: `${((currentLevel + 1) / totalLevels) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              {(phase === 'playing' || phase === 'fail') && (
                <>
                  <button
                    onClick={() => {
                      setHintLevel(0);
                      if (hintArrows.length === 0) {
                        if (hintLoading) return;
                        setHintLoading(true);
                        window.setTimeout(() => {
                          const arrows = computeHintArrow();
                          setHintArrows(arrows);
                          setShowHint(arrows.length > 0);
                          setHintLoading(false);
                        }, 0);
                      } else {
                        setHintArrows([]);
                        setShowHint(false);
                      }
                    }}
                    disabled={hintLoading}
                    className={`flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-all ${showHint ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)]'} ${hintLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <Lightbulb size={14} /> {hintLoading ? 'Думаю...' : 'Подсказка'}
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] text-xs font-medium transition-all"
                  >
                    <RotateCcw size={14} /> Заново
                  </button>
                </>
              )}
              {phase === 'success' && (
                <button
                  onClick={() => setCurrentLevel(l => l + 1)}
                  className="flex-1 h-10 flex items-center justify-center gap-1 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  Далее <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Lesson Panel — 300px */}
      <div className="hidden lg:flex w-[300px] flex-shrink-0 flex-col gap-4">
        {/* Title */}
        {lessonTitle && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Урок</p>
            <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug">{lessonTitle}</h2>
          </div>
        )}
        {/* Description */}
        {lessonContent && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{lessonContent}</p>
        )}
        {/* Divider */}
        <div className="w-full h-px bg-[var(--surface-border)]" />

        {/* ЗАДАНИЕ + Progress */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Задание</p>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <span>{currentLevel + 1} из {totalLevels}</span>
            <span className="text-[var(--text-tertiary)]">—</span>
            <img src={`/pieces/cburnett/${pieceCodeRaw}.svg`} className="w-4 h-4 inline-block" draggable={false} alt="" />
            <span>{pieceName}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${((currentLevel + 1) / totalLevels) * 100}%` }}
            />
          </div>
        </div>

        {/* Star progress */}
        {stars.length > 0 && phase === 'playing' && (
          <div className="flex items-center gap-1">
            {Array.from({ length: stars.length }, (_, i) => (
              <Star
                key={i}
                size={14}
                className={i < collectedCount ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-[#e5dfd8]'}
                strokeWidth={2}
              />
            ))}
          </div>
        )}

        {/* Next button */}
        {allDone && nextLessonUrl && (
          <a
            href={nextLessonUrl}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:translate-x-0.5"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            <span>Следующий урок</span>
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        )}
      </div>
    </div>
  );
}
export default function LessonClient({ lesson, allLessons, courseId, isCompletedInit }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [isCompleted, setIsCompleted] = useState(isCompletedInit);
  const [isCompletionSaving, setIsCompletionSaving] = useState(false);
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    if (!isCompleted && typeof window !== 'undefined') {
      localStorage.setItem(`lesson_started_${lesson.id}`, 'true');
    }
  }, [lesson.id, isCompleted]);

  const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

  const interactiveConfig = parseInteractiveConfig(lesson.video_url);

  const handleLevelComplete = (levelIndex: number, stars: number) => {
    const key = `lesson_progress_${lesson.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const prev = existing[levelIndex] || 0;
    existing[levelIndex] = Math.max(prev, stars);
    localStorage.setItem(key, JSON.stringify(existing));
  };

  const handleInteractiveComplete = async () => {
    if (isCompleted || isCompletionSaving) return;

    setIsCompletionSaving(true);
    setCompletionError('');
    try {
      await markLessonCompleteAuth(lesson.id);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
      setCompletionError('Не удалось сохранить прогресс. Проверьте подключение и попробуйте ещё раз.');
    } finally {
      setIsCompletionSaving(false);
    }
  };

  return (
    <div className="w-full px-3 py-4">
    {/* Quiet nav */}
    <div className="flex items-center justify-between mb-3">
      <Link
        href={`/courses/${courseId}`}
        className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] inline-flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={12} /> К курсу
      </Link>
      <span className="text-[10px] text-[var(--text-tertiary)]">
        Урок {lessonIndex + 1} из {allLessons.length}
      </span>
    </div>

    {interactiveConfig ? (
        <div className="mb-8">
          {(() => {
            const type = interactiveConfig.type;
            if (type === 'interactive_capture') {
              return (
                <CaptureLessonWrapper
                  lesson={lesson}
                  allLessons={allLessons}
                  courseId={courseId}
                  levels={interactiveConfig.levels || []}
                  onAllComplete={handleInteractiveComplete}
                  onLevelComplete={handleLevelComplete}
                />
              );
            }
            if (type === 'interactive_piece_value') {
              return (
                <PieceValueBoard
                  onComplete={handleInteractiveComplete}
                  onLevelComplete={handleLevelComplete}
                />
              );
            }
            if (type === 'interactive_mate_in_two') {
              return <MateInTwoBoard onComplete={handleInteractiveComplete} />;
            }
            if (type === 'interactive_pawn_race') {
              return <PawnRaceBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_rook_pawn') {
              return <RookPawnBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_bishop_pawn') {
              return <BishopPawnBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_queen_pawn') {
              return <QueenPawnBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_knight_pawn') {
              return <KnightPawnBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_chess_football') {
              return <ChessFootballBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_two_rooks_mate') {
              return <TwoRooksMateBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_queen_mate') {
              return <QueenMateBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_rook_mate') {
              return <RookMateBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_fork') {
              return <ForkBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_pin') {
              return <PinBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_discovered_attack') {
              return <DiscoveredAttackBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_mixed_tactics') {
              return <MixedTacticsBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_italian_opening') {
              return <ItalianOpeningBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_italian_opening_black') {
              return <ItalianOpeningBoardBlack onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_scholar_mate') {
              return <ScholarMateBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_mate_in_one') {
              return <MateInOneBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_defend_mate') {
              return <DefendMateBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_square_rule') {
              return <SquareRuleBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_coordinate_training') {
              return <CoordinateTrainingBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_computer_play') {
              return <ComputerPlayBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            if (type === 'interactive_tactical_storm') {
              return <TacticalStormBoard onComplete={handleInteractiveComplete} lessonId={lesson.id} />;
            }
            console.warn('Unknown interactive type:', type);
            return (
            <MultiLevelStarBoard
              config={interactiveConfig}
              onAllComplete={handleInteractiveComplete}
              onLevelComplete={handleLevelComplete}
              nextLessonUrl={nextLesson ? `/lessons/${nextLesson.id}?course=${courseId}` : undefined}
              allLessons={allLessons}
              courseId={courseId}
              currentLessonId={lesson.id}
              lessonTitle={lesson.title}
              lessonContent={lesson.content}
              prevLesson={prevLesson}
              nextLesson={nextLesson}
            />
            );
          })()}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center mb-6">
          <div className="text-center text-white">
            <div className="text-5xl mb-2">▶️</div>
            <p className="text-sm text-slate-300">Видео будет здесь</p>
          </div>
        </div>
      )}

      {lesson.content && !interactiveConfig && (
        <div className="prose max-w-none mb-8">
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{lesson.content}</p>
        </div>
      )}

      {lesson.chess_board_fen && !interactiveConfig && (
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Позиция на доске</h3>
          <div className="w-full max-w-[480px] mx-auto aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
            <p className="text-slate-400 text-sm text-center px-4">♟️ Шахматная доска скоро будет здесь</p>
          </div>
        </div>
      )}

      {isCompletionSaving && (
        <div className="mb-4 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">
          Сохраняем прогресс...
        </div>
      )}

      {completionError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center justify-between">
          <span>{completionError}</span>
          <button
            type="button"
            onClick={() => {
              setCompletionError('');
              handleInteractiveComplete();
            }}
            className="text-xs font-medium text-red-700 underline hover:no-underline"
          >
            Попробовать снова
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 w-full py-3 px-2 border-t border-[var(--surface-border)] mt-2">
        {prevLesson ? (
          <a
            href={`/lessons/${prevLesson.id}?course=${courseId}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-1.5 text-[14px] font-medium text-[var(--text-secondary)] border border-[rgba(92,64,51,0.12)] rounded-lg hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] active:scale-[0.98] transition-all whitespace-nowrap"
            title={prevLesson?.title}
          >
            <ArrowLeft size={16} /> Предыдущий урок
          </a>
        ) : <div className="flex-1" />}
        {nextLesson ? (
          <a
            href={`/lessons/${nextLesson.id}?course=${courseId}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-1.5 text-[14px] font-medium text-[var(--text-secondary)] border border-[rgba(92,64,51,0.12)] rounded-lg hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] active:scale-[0.98] transition-all whitespace-nowrap"
            title={nextLesson?.title}
          >
            Следующий урок <ArrowRight size={16} />
          </a>
        ) : <div className="flex-1" />}
      </div>
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

// cache-bust: 1783912353
