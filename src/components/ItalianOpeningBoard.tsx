'use client';

import AvatarBubble from './AvatarBubble';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['8','7','6','5','4','3','2','1'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

const START_FEN_1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_2 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_3 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_4 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_5 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_FEN_6 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const HINTS: Record<number, { from: string; to: string; phase: number }[]> = {
  1: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'g1', to: 'f3', phase: 1 },
    { from: 'f1', to: 'c4', phase: 2 },
    { from: 'd2', to: 'd3', phase: 3 },
    { from: 'b1', to: 'c3', phase: 4 },
    { from: 'c1', to: 'g5', phase: 5 },
    { from: 'e1', to: 'g1', phase: 6 },
  ],
  2: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'g1', to: 'f3', phase: 1 },
    { from: 'f1', to: 'c4', phase: 2 },
  ],
  3: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'g1', to: 'f3', phase: 1 },
    { from: 'f1', to: 'c4', phase: 2 },
    { from: 'd2', to: 'd3', phase: 3 },
    { from: 'b1', to: 'c3', phase: 4 },
    { from: 'c1', to: 'g5', phase: 5 },
    { from: 'c3', to: 'd5', phase: 6 },
    { from: 'd5', to: 'f6', phase: 7 },
    { from: 'g5', to: 'h6', phase: 8 },
    { from: 'h2', to: 'h3', phase: 9 },
    { from: 'g2', to: 'f3', phase: 10 },
    { from: 'h1', to: 'g1', phase: 11 },
    { from: 'h6', to: 'g7', phase: 12 },
    { from: 'g7', to: 'f6', phase: 13 },
    { from: 'f6', to: 'd8', phase: 14 },
  ],
  4: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'g1', to: 'f3', phase: 1 },
    { from: 'f1', to: 'c4', phase: 2 },
    { from: 'd2', to: 'd3', phase: 3 },
    { from: 'b1', to: 'c3', phase: 4 },
    { from: 'c1', to: 'g5', phase: 5 },
    { from: 'c3', to: 'd5', phase: 6 },
    { from: 'd5', to: 'f6', phase: 7 },
    { from: 'g5', to: 'h6', phase: 8 },
    { from: 'h2', to: 'h3', phase: 9 },
    { from: 'g2', to: 'f3', phase: 10 },
    { from: 'h1', to: 'g1', phase: 11 },
    { from: 'h6', to: 'g7', phase: 12 },
    { from: 'g7', to: 'f6', phase: 13 },
    { from: 'f6', to: 'd8', phase: 14 },
  ],
  5: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'g1', to: 'f3', phase: 1 },
    { from: 'f1', to: 'c4', phase: 2 },
    { from: 'd2', to: 'd3', phase: 3 },
    { from: 'b1', to: 'c3', phase: 4 },
    { from: 'h2', to: 'h3', phase: 5 },
    { from: 'g2', to: 'g4', phase: 6 },
    { from: 'g4', to: 'g5', phase: 7 },
    { from: 'c4', to: 'g5', phase: 8 },
    { from: 'd1', to: 'd2', phase: 9 },
    { from: 'e1', to: 'c1', phase: 10 },
    { from: 'c1', to: 'f6', phase: 11 },
    { from: 'd2', to: 'h6', phase: 12 },
    { from: 'd1', to: 'g1', phase: 13 },
    { from: 'h1', to: 'g1', phase: 13 },
    { from: 'd1', to: 'g1', phase: 14 },
    { from: 'h1', to: 'g1', phase: 14 },
    { from: 'g1', to: 'g4', phase: 15 },
    { from: 'h3', to: 'g4', phase: 16 },
  ],
  6: [
    { from: 'e2', to: 'e4', phase: 0 },
    { from: 'g1', to: 'f3', phase: 1 },
    { from: 'f1', to: 'c4', phase: 2 },
    { from: 'd2', to: 'd3', phase: 3 },
    { from: 'b1', to: 'c3', phase: 4 },
    { from: 'h2', to: 'h3', phase: 5 },
    { from: 'g2', to: 'g4', phase: 6 },
    { from: 'g4', to: 'g5', phase: 7 },
    { from: 'c4', to: 'g5', phase: 8 },
    { from: 'd1', to: 'd2', phase: 9 },
    { from: 'e1', to: 'c1', phase: 10 },
    { from: 'c1', to: 'f6', phase: 11 },
    { from: 'd2', to: 'h6', phase: 12 },
    { from: 'd1', to: 'g1', phase: 13 },
    { from: 'h1', to: 'g1', phase: 13 },
    { from: 'd1', to: 'g1', phase: 14 },
    { from: 'h1', to: 'g1', phase: 14 },
    { from: 'g1', to: 'g4', phase: 15 },
    { from: 'h3', to: 'g4', phase: 16 },
  ],
};

function getFreePlayHintArrow(game: Chess, exercise: number): { from: string; to: string; phase: number }[] {
  const pieceAt = (square: string, type: string) => {
    const piece = game.get(square as any);
    return piece?.color === 'w' && piece.type === type;
  };
  const legalMoves = game.moves({ verbose: true });
  const remainingMoves = exercise === 6
    ? [
        { from: 'd2', to: 'd3', complete: !pieceAt('d2', 'p') },
        { from: 'b1', to: 'c3', complete: !pieceAt('b1', 'n') },
      ]
    : [
        { from: 'd2', to: 'd3', complete: !pieceAt('d2', 'p') },
        { from: 'b1', to: 'c3', complete: !pieceAt('b1', 'n') },
        { from: 'c1', to: 'g5', complete: !pieceAt('c1', 'b') },
        { from: 'e1', to: 'g1', complete: !pieceAt('e1', 'k') },
      ];

  const nextMove = remainingMoves.find(move =>
    !move.complete && legalMoves.some(legal => legal.from === move.from && legal.to === move.to)
  );
  return nextMove ? [{ from: nextMove.from, to: nextMove.to, phase: 0 }] : [];
}

// Find a black capture that leaves the black piece safe (no white recapture)
function findSafeBlackCapture(currentGame: Chess): { from: string; to: string } | null {
  const blackMoves = currentGame.moves({ verbose: true });
  const captures = blackMoves.filter((m: any) => m.captured);
  for (const capture of captures) {
    const testGame = new Chess(currentGame.fen());
    testGame.move({ from: capture.from, to: capture.to });
    const whiteMoves = testGame.moves({ verbose: true });
    const whiteRecaptures = whiteMoves.filter((m: any) => m.captured && m.to === capture.to);
    if (whiteRecaptures.length === 0) {
      return { from: capture.from, to: capture.to };
    }
  }
  return null;
}

function handleFailWithBlackCapture(
  g: Chess,
  setGameFn: (g: Chess) => void,
  setIsFailFn: (v: boolean) => void,
  setMessageFn: (msg: string) => void,
  setSelectedSquareFn: (sq: string | null) => void,
  setLastMoveFn: (m: { from: string; to: string } | null) => void,
  mountedRef: React.RefObject<boolean>
) {
  const cap = findSafeBlackCapture(g);
  if (cap) {
    setTimeout(() => {
      if (!mountedRef.current) return;
      g.move({ from: cap.from, to: cap.to });
      setLastMoveFn({ from: cap.from, to: cap.to });
      setGameFn(new Chess(g.fen()));
      setTimeout(() => {
        if (mountedRef.current) { setIsFailFn(true); setMessageFn('Провалено'); }
      }, 1000);
    }, 1000);
  } else {
    setTimeout(() => {
      if (mountedRef.current) { setIsFailFn(true); setMessageFn('Провалено'); }
    }, 1000);
  }
  setSelectedSquareFn(null);
}

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

export default function ItalianOpeningBoard({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [playerAnimatingMoves, setPlayerAnimatingMoves] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } }[] | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [opponentAnimatingMoves, setOpponentAnimatingMoves] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } }[] | null>(null);
  const [message, setMessage] = useState('');
  const [isFail, setIsFail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [whiteMoves, setWhiteMoves] = useState(0);
  const [sqSize, setSqSize] = useState(52);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [hintVisible, setHintVisible] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const mountedRef = useRef(true);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);

  const storageKey = lessonId ? `italian_progress_${lessonId}` : 'italian_progress';

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { isFailRef.current = isFail; }, [isFail]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setExerciseStars(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!game) setGame(new Chess(START_FEN_1));
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
    const fen = exercise === 1 ? START_FEN_1 : exercise === 2 ? START_FEN_2 : exercise === 3 ? START_FEN_3 : exercise === 4 ? START_FEN_4 : exercise === 5 ? START_FEN_5 : START_FEN_6;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
    setHintVisible(false);
  setLastMove(null);
  }, [exercise]);

  const saveStars = useCallback((ex: 1 | 2 | 3 | 4 | 5 | 6, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6) => {
    setExercise(num);
    const fen = num === 1 ? START_FEN_1 : num === 2 ? START_FEN_2 : num === 3 ? START_FEN_3 : num === 4 ? START_FEN_4 : num === 5 ? START_FEN_5 : START_FEN_6;
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMessage('');
    setIsFail(false);
    setIsComplete(false);
    setWhiteMoves(0);
    setHintVisible(false);
  setLastMove(null);
  }, []);

  useEffect(() => {
    if (isComplete) {
      if (exercise < 6) {
        const timer = setTimeout(() => switchExercise((exercise + 1) as 1 | 2 | 3 | 4 | 5 | 6), 2000);
        return () => clearTimeout(timer);
      } else if (exercise === 6 && (exerciseStars[6] || 0) >= 3) {
        const timer = setTimeout(() => onComplete?.(), 2000);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, exercise, exerciseStars, onComplete]);

  const handleHint = useCallback(() => {
    if (isComplete || isFail) return;
    if (game?.turn() !== 'w') return;
    setHintVisible(prev => !prev);
  }, [isComplete, isFail, game]);

  const processWhiteMove = useCallback(async (from: string, to: string, promotionPiece?: string, skipAnimation = false) => {
    if (!game) return;
    setHintVisible(false);
    const g = game;
    if (g.turn() !== 'w') return;

    try {
      const piece = g.get(from as any);
      const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
      if (isPromotion && !promotionPiece) {
        setPromotionPending({ from, to });
        return;
      }
      const move = g.move({ from, to, promotion: promotionPiece });
      if (!move) return;
      setLastMove({ from, to });

      if (!skipAnimation) {
        const isCastle = move.piece === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
        if (isCastle) {
          const isShort = to === 'g1';
          const rookFrom = isShort ? 'h1' : 'a1';
          const rookTo = isShort ? 'f1' : 'd1';
          setPlayerAnimatingMoves([
            { from, to, piece: { type: 'K', color: 'w' } },
            { from: rookFrom, to: rookTo, piece: { type: 'R', color: 'w' } },
          ]);
          await new Promise(resolve => setTimeout(resolve, 200));
          setPlayerAnimatingMoves(null);
        } else {
          setPlayerAnimatingMove({
            from,
            to,
            piece: { type: move.piece.toUpperCase(), color: 'w' },
          });
          await new Promise(resolve => setTimeout(resolve, 200));
          setPlayerAnimatingMove(null);
        }
      }

      const nextWhiteMoves = whiteMoves + 1;

      if (exercise === 1) {
        // Сценарий: 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.d3 Nf6 5.Nc3 O-O 6.Bg5 d6 7.O-O
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e7' as any);
              setLastMove({ from: 'e7', to: 'e5' });
              setOpponentAnimatingMove({
                from: 'e7',
                to: 'e5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e7', to: 'e5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'g1' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('b8' as any);
              setLastMove({ from: 'b8', to: 'c6' });
              setOpponentAnimatingMove({
                from: 'b8',
                to: 'c6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'c5' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'c5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 3) {
          if (from === 'd2' && to === 'd3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 4) {
          if (from === 'b1' && to === 'c3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e8' as any);
              const rookPiece = g.get('h8' as any);
              setLastMove({ from: 'e8', to: 'g8' });
              setOpponentAnimatingMoves([
                { from: 'e8', to: 'g8', piece: { type: blackPiece?.type?.toUpperCase() || 'K', color: 'b' } },
                { from: 'h8', to: 'f8', piece: { type: rookPiece?.type?.toUpperCase() || 'R', color: 'b' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setOpponentAnimatingMoves(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 5) {
          if (from === 'c1' && to === 'g5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'd6' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'd6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'd6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 6) {
          if (move.piece === 'k' && (to === 'g1' || to === 'h1')) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Итальянская партия завершена. Белые захватили центр пешкой, вывели коней и слонов и сделали рокировку!');
            saveStars(1, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
      } else if (exercise === 2) {
        // Exercise 2: Italian Opening free-play — 4 moves in any order: d3, Bg5, Nc3, O-O
        // Black responses: Nf6 after white move 4, O-O after move 5, d6 after move 6
        function isPieceOnSquare(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          return p.type === piece && p.color === color;
        }
        function countCompletedMoves(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquare(pos, 'd3', 'p', 'w')) count++;          // d3
          if (isPieceOnSquare(pos, 'g5', 'b', 'w')) count++;          // Bg5
          if (isPieceOnSquare(pos, 'c3', 'n', 'w')) count++;          // Nc3
          if (!isPieceOnSquare(pos, 'e1', 'k', 'w')) count++;        // O-O
          return count;
        }
        function isAllowedMove(from: string, to: string, piece: string): boolean {
          if (from === 'd2' && to === 'd3' && piece === 'p') return true;   // d3
          if (from === 'c1' && to === 'g5' && piece === 'b') return true; // Bg5
          if (from === 'b1' && to === 'c3' && piece === 'n') return true; // Nc3
          if (piece === 'k' && (to === 'g1' || to === 'c1' || to === 'h1')) return true; // O-O
          return false;
        }

        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e7' as any);
              setLastMove({ from: 'e7', to: 'e5' });
              setOpponentAnimatingMove({
                from: 'e7',
                to: 'e5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e7', to: 'e5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            setMessage('Отлично! Пешка захватила центр.');
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'g1' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('b8' as any);
              setLastMove({ from: 'b8', to: 'c6' });
              setOpponentAnimatingMove({
                from: 'b8',
                to: 'c6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            setMessage('Отлично! Конь вышел ближе к центру и напал на пешку e5.');
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'c5' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'c5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            setMessage('Отлично! Слон вышел ближе к центру.');
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Free play moves 3-6: must play d3, Bg5, Nc3, O-O in any order
        if (whiteMoves >= 3 && whiteMoves <= 6) {
          if (!isAllowedMove(from, to, move.piece)) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          const expectedCount = whiteMoves - 2;
          const actualCount = countCompletedMoves(g);
          if (actualCount !== expectedCount) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setWhiteMoves(nextWhiteMoves);
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (whiteMoves === 3) {
              const nf6 = g.moves({ verbose: true }).find((m: any) => m.color === 'b' && m.piece === 'n' && m.to === 'f6');
              if (nf6) {
                const bp = g.get(nf6.from as any);
                setLastMove({ from: nf6.from, to: nf6.to });
                setOpponentAnimatingMove({
                  from: nf6.from,
                  to: nf6.to,
                  piece: { type: bp?.type?.toUpperCase() || 'N', color: 'b' },
                });
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  g.move({ from: nf6.from, to: nf6.to });
                  setGame(new Chess(g.fen()));
                  setHintVisible(false);
                  setOpponentAnimatingMove(null);
                }, 200);
              }
            } else if (whiteMoves === 4) {
              const castle = g.moves({ verbose: true }).find((m: any) => m.color === 'b' && m.piece === 'k' && (m.to === 'g8' || m.to === 'c8'));
              if (castle) {
                const bp = g.get(castle.from as any);
                const isShort = castle.to === 'g8';
                const rookFrom = isShort ? 'h8' : 'a8';
                const rookTo = isShort ? 'f8' : 'd8';
                const rp = g.get(rookFrom as any);
                setLastMove({ from: castle.from, to: castle.to });
                setOpponentAnimatingMoves([
                  { from: castle.from, to: castle.to, piece: { type: bp?.type?.toUpperCase() || 'K', color: 'b' } },
                  { from: rookFrom, to: rookTo, piece: { type: rp?.type?.toUpperCase() || 'R', color: 'b' } },
                ]);
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  g.move({ from: castle.from, to: castle.to });
                  setGame(new Chess(g.fen()));
                  setOpponentAnimatingMoves(null);
                }, 200);
              }
            } else if (whiteMoves === 5) {
              const d6 = g.moves({ verbose: true }).find((m: any) => m.color === 'b' && m.piece === 'p' && m.to === 'd6');
              if (d6) {
                const bp = g.get(d6.from as any);
                setLastMove({ from: d6.from, to: d6.to });
                setOpponentAnimatingMove({
                  from: d6.from,
                  to: d6.to,
                  piece: { type: bp?.type?.toUpperCase() || 'P', color: 'b' },
                });
                setTimeout(() => {
                  if (!mountedRef.current) return;
                  g.move({ from: d6.from, to: d6.to });
                  setGame(new Chess(g.fen()));
                  setHintVisible(false);
                  setOpponentAnimatingMove(null);
                }, 200);
              }
            }
          }, 800);
          if (whiteMoves === 6) {
            setIsComplete(true);
            setMessage('Отлично! Все фигуры развиты и король в безопасности.');
            saveStars(2, 3);
          } else {
            setMessage('Отлично! Продолжайте развивать фигуры.');
          }
          return;
        }
      } else if (exercise === 3) {
        // Exercise 3: Dyrakol — student plays ALL white moves with hints before each
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e7' as any);
              setLastMove({ from: 'e7', to: 'e5' });
              setOpponentAnimatingMove({
                from: 'e7',
                to: 'e5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e7', to: 'e5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Конь выходит на f3 — защищает пешку e4 и готовит развитие. Сделайте Nf3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'g1' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('b8' as any);
              setLastMove({ from: 'b8', to: 'c6' });
              setOpponentAnimatingMove({
                from: 'b8',
                to: 'c6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Конь на f3 развит. Теперь разведите слона на c4 — классическая итальянская партия. Сделайте Bc4!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'c5' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'c5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Слон на c4 разведён. d3 — тихая итальянская, готовим позицию для дырокола. Сделайте d3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 3) {
          if (from === 'd2' && to === 'd3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Пешка d3 защищена. Конь c3 развивает фигуры и готовится к центру. Сделайте Nc3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 4) {
          if (from === 'b1' && to === 'c3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'd6' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'd6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'd6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Конь на c3 развит. Слон g5 связывает коня f6 — начало дырокола! Сделайте Bg5!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 5) {
          if (from === 'c1' && to === 'g5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e8' as any);
              const rookPiece = g.get('h8' as any);
              setLastMove({ from: 'e8', to: 'g8' });
              setOpponentAnimatingMoves([
                { from: 'e8', to: 'g8', piece: { type: blackPiece?.type?.toUpperCase() || 'K', color: 'b' } },
                { from: 'h8', to: 'f8', piece: { type: rookPiece?.type?.toUpperCase() || 'R', color: 'b' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setOpponentAnimatingMoves(null);
              }, 200);
              setMessage('Чёрные рокировались! Это ключевой момент — мы НЕ рокировали и можем атаковать. Конь d5!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 6) {
          if (from === 'c3' && to === 'd5' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c8' as any);
              setLastMove({ from: 'c8', to: 'g4' });
              setOpponentAnimatingMove({
                from: 'c8',
                to: 'g4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c8', to: 'g4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Конь забирает коня на f6 — размен! Делайте Nxf6!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 7) {
          if (from === 'd5' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g7' as any);
              setLastMove({ from: 'g7', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g7',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g7', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Пешка f открыта — это дырокол! Слон h6 атакует ладью. Делайте Bh6!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 8) {
          if (from === 'g5' && to === 'h6' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'e8' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'e8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'e8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('h3 гоним слона g4. Делайте h3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 9) {
          if (from === 'h2' && to === 'h3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g4' as any);
              setLastMove({ from: 'g4', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g4',
                to: 'f3',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g4', to: 'f3' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Пешка g берёт слона — линия f открыта! Делайте gxf3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 10) {
          if (from === 'g2' && to === 'f3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c6' as any);
              setLastMove({ from: 'c6', to: 'd4' });
              setOpponentAnimatingMove({
                from: 'c6',
                to: 'd4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c6', to: 'd4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Ладья g1 защищает пешку f3. Делайте Rg1!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 11) {
          if (from === 'h1' && to === 'g1' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'h8' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'h8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'h8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Слон g7 — шах! Делайте Bg7+!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 12) {
          if (from === 'h6' && to === 'g7' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('h8' as any);
              setLastMove({ from: 'h8', to: 'g8' });
              setOpponentAnimatingMove({
                from: 'h8',
                to: 'g8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Слон забирает пешку f6 с шахом! Делайте Bxf6+!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 13) {
          if (from === 'g7' && to === 'f6' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f8' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Слон забирает ферзя на d8! Дырокол выполнен! Делайте Bxd8!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 14) {
          if (from === 'f6' && to === 'd8' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Дырокол выполнен! Мы разменяли коня на f6, разрушили рокировку и забрали ферзя. Когда рокировка разрушена, чёрного короля легче атаковать!');
            saveStars(3, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
      } else if (exercise === 4) {
        // Exercise 4: Dyrakol — student plays ALL white moves with feedback AFTER each move
        // Moves 1-3: strict order (e4, Nf3, Bc4)
        // Moves 4-6: free order (d3, Nc3, Bg5)
        // Moves 7-15: strict order
        function isPieceOnSquareEx4(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          return p.type === piece && p.color === color;
        }
        function countFreeMovesDone(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquareEx4(pos, 'd3', 'p', 'w')) count++;
          if (isPieceOnSquareEx4(pos, 'c3', 'n', 'w')) count++;
          if (isPieceOnSquareEx4(pos, 'g5', 'b', 'w')) count++;
          return count;
        }
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e7' as any);
              setLastMove({ from: 'e7', to: 'e5' });
              setOpponentAnimatingMove({
                from: 'e7',
                to: 'e5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e7', to: 'e5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Пешка захватила центр.');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 1) {
          if (from === 'g1' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('b8' as any);
              setLastMove({ from: 'b8', to: 'c6' });
              setOpponentAnimatingMove({
                from: 'b8',
                to: 'c6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Конь вышел ближе к центру и напал на пешку e5.');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        if (whiteMoves === 2) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'c5' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'c5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Слон вышел ближе к центру.');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Free play moves 3-5 (whiteMoves 3,4,5): d3, Nc3, Bg5 in any order
        if (whiteMoves >= 3 && whiteMoves <= 5) {
          const isAllowed = (
            (from === 'd2' && to === 'd3' && move.piece === 'p') ||
            (from === 'b1' && to === 'c3' && move.piece === 'n') ||
            (from === 'c1' && to === 'g5' && move.piece === 'b')
          );
          if (!isAllowed) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          const expectedCount = whiteMoves - 2;
          const actualCount = countFreeMovesDone(g);
          if (actualCount !== expectedCount) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setWhiteMoves(nextWhiteMoves);
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (whiteMoves === 3) {
              const blackPieceNf6 = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f6',
                piece: { type: blackPieceNf6?.type?.toUpperCase() || 'N', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else if (whiteMoves === 4) {
              const blackPieceD6 = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'd6' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'd6',
                piece: { type: blackPieceD6?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'd6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else if (whiteMoves === 5) {
              const blackPiece = g.get('e8' as any);
              const rookPiece = g.get('h8' as any);
              setLastMove({ from: 'e8', to: 'g8' });
              setOpponentAnimatingMoves([
                { from: 'e8', to: 'g8', piece: { type: blackPiece?.type?.toUpperCase() || 'K', color: 'b' } },
                { from: 'h8', to: 'f8', piece: { type: rookPiece?.type?.toUpperCase() || 'R', color: 'b' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setOpponentAnimatingMoves(null);
              }, 200);
            }
          }, 800);
          if (whiteMoves === 5) {
            setMessage('Отлично! Чёрные рокировались — дырокол начинается! Конь d5!');
          } else {
            setMessage('Отлично! Продолжайте развивать фигуры.');
          }
          return;
        }
        // Move 6: Nd5
        if (whiteMoves === 6) {
          if (from === 'c3' && to === 'd5' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c8' as any);
              setLastMove({ from: 'c8', to: 'g4' });
              setOpponentAnimatingMove({
                from: 'c8',
                to: 'g4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c8', to: 'g4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Конь идёт на d5 — атака! Nxf6!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 7: Nxf6
        if (whiteMoves === 7) {
          if (from === 'd5' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g7' as any);
              setLastMove({ from: 'g7', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g7',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g7', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Разменяли коня на f6, открыли пешку. Слон h6!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 8: Bh6
        if (whiteMoves === 8) {
          if (from === 'g5' && to === 'h6' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'e8' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'e8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'e8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Слон h6 атакует ладью, готовим дырокол. h3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 9: h3
        if (whiteMoves === 9) {
          if (from === 'h2' && to === 'h3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g4' as any);
              setLastMove({ from: 'g4', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g4',
                to: 'f3',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g4', to: 'f3' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! h3 гоним слона g4. gxf3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 10: gxf3
        if (whiteMoves === 10) {
          if (from === 'g2' && to === 'f3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c6' as any);
              setLastMove({ from: 'c6', to: 'd4' });
              setOpponentAnimatingMove({
                from: 'c6',
                to: 'd4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c6', to: 'd4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Пешка g берёт слона, открывая линию f. Ладья g1!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 11: Rg1
        if (whiteMoves === 11) {
          if (from === 'h1' && to === 'g1' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'h8' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'h8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'h8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Ладья защищает пешку f3. Bg7+!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 12: Bg7+
        if (whiteMoves === 12) {
          if (from === 'h6' && to === 'g7' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('h8' as any);
              setLastMove({ from: 'h8', to: 'g8' });
              setOpponentAnimatingMove({
                from: 'h8',
                to: 'g8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Шах слоном g7! Bxf6+!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 13: Bxf6+
        if (whiteMoves === 13) {
          if (from === 'g7' && to === 'f6' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f8' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Шах слоном f6, король уходит на f8. Bxd8!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 14: Bxd8
        if (whiteMoves === 14) {
          if (from === 'f6' && to === 'd8' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Дырокол выполнен! Разрушили рокировку и забрали ферзя!');
            saveStars(4, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
      } else if (exercise === 5) {
        // Exercise 5: Pawn Storm (Пешечный штурм) — full sequence from starting position
        // Moves 0-2: strict order (e4, Nf3, Bc4) with hints BEFORE each move
        // Moves 3-4: free order (d3, Nc3) in any order
        // Moves 5+: strict order (h3, g4, g5, Bxg5, Qd2, O-O-O, Bxf6, Qh6, Rdg1, Rxg1, Rxg4, hxg4)
        function isPieceOnSquareEx5(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          return p.type === piece && p.color === color;
        }
        function countFreeMovesEx5(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquareEx5(pos, 'd3', 'p', 'w')) count++;
          if (isPieceOnSquareEx5(pos, 'c3', 'n', 'w')) count++;
          return count;
        }
        // Move 0: e4
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e7' as any);
              setLastMove({ from: 'e7', to: 'e5' });
              setOpponentAnimatingMove({
                from: 'e7',
                to: 'e5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e7', to: 'e5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Конь выходит на f3 — защищает пешку e4 и готовит развитие. Сделайте Nf3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 1: Nf3
        if (whiteMoves === 1) {
          if (from === 'g1' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('b8' as any);
              setLastMove({ from: 'b8', to: 'c6' });
              setOpponentAnimatingMove({
                from: 'b8',
                to: 'c6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Отлично! Вы развели слона на c4 — классическая итальянская партия. Сделайте Bc4!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 2: Bc4
        if (whiteMoves === 2) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'c5' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'c5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('d3 — тихая итальянская, готовим позицию. Сделайте d3!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Free play: moves 3-4 (d3 and Nc3 in any order)
        if (whiteMoves >= 3 && whiteMoves <= 4) {
          const isAllowed = (
            (from === 'd2' && to === 'd3' && move.piece === 'p') ||
            (from === 'b1' && to === 'c3' && move.piece === 'n')
          );
          if (!isAllowed) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          const expectedCount = whiteMoves - 2;
          const actualCount = countFreeMovesEx5(g);
          if (actualCount !== expectedCount) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setWhiteMoves(nextWhiteMoves);
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (whiteMoves === 3) {
              const bpH6 = g.get('h7' as any);
              setLastMove({ from: 'h7', to: 'h6' });
              setOpponentAnimatingMove({
                from: 'h7',
                to: 'h6',
                piece: { type: bpH6?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h7', to: 'h6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else {
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }
            setMessage('h3 — не даём слону чёрных выйти на g4. Сделайте h3!');
          }, 800);
          return;
        }
        // Move 5: h3
        if (whiteMoves === 5) {
          if (from === 'h2' && to === 'h3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e8' as any);
              const rookPiece = g.get('h8' as any);
              setLastMove({ from: 'e8', to: 'g8' });
              setOpponentAnimatingMoves([
                { from: 'e8', to: 'g8', piece: { type: blackPiece?.type?.toUpperCase() || 'K', color: 'b' } },
                { from: 'h8', to: 'f8', piece: { type: rookPiece?.type?.toUpperCase() || 'R', color: 'b' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setOpponentAnimatingMoves(null);
              }, 200);
              setMessage('g4 — начинаем пешечный штурм на королевском фланге! Сделайте g4!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 6: g4
        if (whiteMoves === 6) {
          if (from === 'g2' && to === 'g4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'd6' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'd6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'd6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('g5 — давим пешками! Сделайте g5!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 7: g5
        if (whiteMoves === 7) {
          if (from === 'g4' && to === 'g5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('h6' as any);
              setLastMove({ from: 'h6', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'h6',
                to: 'g5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h6', to: 'g5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Белый слон забирает пешку на g5. Сделайте Bxg5!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 8: Bxg5 (from c1 to g5)
        if (whiteMoves === 8) {
          if (from === 'c1' && to === 'g5' && move.piece === 'b' && move.captured === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c8' as any);
              setLastMove({ from: 'c8', to: 'e6' });
              setOpponentAnimatingMove({
                from: 'c8',
                to: 'e6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c8', to: 'e6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Ферзь d2 — готовим атаку. Сделайте Qd2!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 9: Qd2
        if (whiteMoves === 9) {
          if (from === 'd1' && to === 'd2' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'e8' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'e8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'e8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('O-O-O — длинная рокировка, уводим короля и подключаем ладью. Сделайте O-O-O!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 10: O-O-O
        if (whiteMoves === 10) {
          if (move.piece === 'k' && (to === 'c1' || to === 'b1')) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d8' as any);
              setLastMove({ from: 'd8', to: 'd7' });
              setOpponentAnimatingMove({
                from: 'd8',
                to: 'd7',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd8', to: 'd7' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Слон забирает коня на f6. Сделайте Bxf6!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 11: Bxf6
        if (whiteMoves === 11) {
          if (from === 'g5' && to === 'f6' && move.piece === 'b' && move.captured === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g7' as any);
              setLastMove({ from: 'g7', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g7',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g7', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Ферзь h6 — атакуем! Сделайте Qh6!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 12: Qh6
        if (whiteMoves === 12) {
          if (from === 'd2' && to === 'h6' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c5' as any);
              setLastMove({ from: 'c5', to: 'f2' });
              setOpponentAnimatingMove({
                from: 'c5',
                to: 'f2',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c5', to: 'f2' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Ладья d1 защищает первую линию. Сделайте Rdg1!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 13: either rook may move to g1
        if (whiteMoves === 13) {
          if ((from === 'd1' || from === 'h1') && to === 'g1' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f2' as any);
              setLastMove({ from: 'f2', to: 'g1' });
              setOpponentAnimatingMove({
                from: 'f2',
                to: 'g1',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f2', to: 'g1' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Ладья забирает слона. Сделайте Rxg1!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 14: either rook captures the bishop on g1
        if (whiteMoves === 14) {
          if ((from === 'd1' || from === 'h1') && to === 'g1' && move.piece === 'r' && move.captured === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e6' as any);
              setLastMove({ from: 'e6', to: 'g4' });
              setOpponentAnimatingMove({
                from: 'e6',
                to: 'g4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e6', to: 'g4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('Ладья бьёт слона. Сделайте Rxg4!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 15: Rxg4
        if (whiteMoves === 15) {
          if (from === 'g1' && to === 'g4' && move.piece === 'r' && move.captured === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'g4' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'g4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'g4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
              setMessage('h x g4 — забираем ферзя! Сделайте hxg4!');
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 16: hxg4
        if (whiteMoves === 16) {
          if (from === 'h3' && to === 'g4' && move.piece === 'p' && move.captured === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Пешечный штурм успешен! Белые взяли ферзя и получили решающее преимущество!');
            saveStars(5, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
      } else if (exercise === 6) {
        // Exercise 6: Пешечный штурм — ученик повторяет сам (как exercise 5)
        // Moves 0-2: strict order (e4, Nf3, Bc4) — hints AFTER each move
        // Moves 3-4: free order (d3, Nc3) in any order
        // Moves 5+: strict order (h3, g4, g5, Bxg5, Qd2, O-O-O, Bxf6, Qh6, Rdg1, Rxg1, Rxg4, hxg4)
        function isPieceOnSquareEx6(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          return p.type === piece && p.color === color;
        }
        function countFreeMovesEx6(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquareEx6(pos, 'd3', 'p', 'w')) count++;
          if (isPieceOnSquareEx6(pos, 'c3', 'n', 'w')) count++;
          return count;
        }
        // Move 0: e4
        if (whiteMoves === 0) {
          if (from === 'e2' && to === 'e4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка захватила центр, открыла дорогу слону и ферзю.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e7' as any);
              setLastMove({ from: 'e7', to: 'e5' });
              setOpponentAnimatingMove({
                from: 'e7',
                to: 'e5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e7', to: 'e5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 1: Nf3
        if (whiteMoves === 1) {
          if (from === 'g1' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Конь вышел ближе к центру и напал на пешку e5.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('b8' as any);
              setLastMove({ from: 'b8', to: 'c6' });
              setOpponentAnimatingMove({
                from: 'b8',
                to: 'c6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b8', to: 'c6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 2: Bc4
        if (whiteMoves === 2) {
          if (from === 'f1' && to === 'c4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Слон вышел ближе к центру и готов атаковать f7.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'c5' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'c5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'c5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Free play: moves 3-4 (d3 and Nc3 in any order)
        if (whiteMoves >= 3 && whiteMoves <= 4) {
          const isAllowed = (
            (from === 'd2' && to === 'd3' && move.piece === 'p') ||
            (from === 'b1' && to === 'c3' && move.piece === 'n')
          );
          if (!isAllowed) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          const expectedCount = whiteMoves - 2;
          const actualCount = countFreeMovesEx6(g);
          if (actualCount !== expectedCount) {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setWhiteMoves(nextWhiteMoves);
          setMessage('Отлично! Правильное развитие фигур в центре.');
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (whiteMoves === 3) {
              const bpH6 = g.get('h7' as any);
              setLastMove({ from: 'h7', to: 'h6' });
              setOpponentAnimatingMove({
                from: 'h7',
                to: 'h6',
                piece: { type: bpH6?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h7', to: 'h6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else {
              const blackPiece = g.get('g8' as any);
              setLastMove({ from: 'g8', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g8',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g8', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }
          }, 800);
          return;
        }
        // Move 5: h3
        if (whiteMoves === 5) {
          if (from === 'h2' && to === 'h3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка h3 не даёт слону чёрных выйти на g4.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e8' as any);
              const rookPiece = g.get('h8' as any);
              setLastMove({ from: 'e8', to: 'g8' });
              setOpponentAnimatingMoves([
                { from: 'e8', to: 'g8', piece: { type: blackPiece?.type?.toUpperCase() || 'K', color: 'b' } },
                { from: 'h8', to: 'f8', piece: { type: rookPiece?.type?.toUpperCase() || 'R', color: 'b' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e8', to: 'g8' });
                setGame(new Chess(g.fen()));
                setOpponentAnimatingMoves(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 6: g4
        if (whiteMoves === 6) {
          if (from === 'g2' && to === 'g4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка g4 начинает штурм на королевском фланге.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'd6' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'd6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'd6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 7: g5
        if (whiteMoves === 7) {
          if (from === 'g4' && to === 'g5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Пешка g5 давит на позицию чёрных.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('h6' as any);
              setLastMove({ from: 'h6', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'h6',
                to: 'g5',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h6', to: 'g5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 8: Bxg5
        if (whiteMoves === 8) {
          if (from === 'c1' && to === 'g5' && move.piece === 'b' && move.captured === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Слон забрал пешку, открывая линию для атаки.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c8' as any);
              setLastMove({ from: 'c8', to: 'e6' });
              setOpponentAnimatingMove({
                from: 'c8',
                to: 'e6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c8', to: 'e6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 9: Qd2
        if (whiteMoves === 9) {
          if (from === 'd1' && to === 'd2' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Ферзь d2 готовит атаку на королевском фланге.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f8' as any);
              setLastMove({ from: 'f8', to: 'e8' });
              setOpponentAnimatingMove({
                from: 'f8',
                to: 'e8',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f8', to: 'e8' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 10: O-O-O
        if (whiteMoves === 10) {
          if (move.piece === 'k' && (to === 'c1' || to === 'b1')) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Длинная рокировка уводит короля в безопасность и подключает ладью.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d8' as any);
              setLastMove({ from: 'd8', to: 'd7' });
              setOpponentAnimatingMove({
                from: 'd8',
                to: 'd7',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd8', to: 'd7' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 11: Bxf6
        if (whiteMoves === 11) {
          if (from === 'g5' && to === 'f6' && move.piece === 'b' && move.captured === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Слон уничтожил коня, ослабляя защиту короля.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('g7' as any);
              setLastMove({ from: 'g7', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'g7',
                to: 'f6',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'g7', to: 'f6' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 12: Qh6
        if (whiteMoves === 12) {
          if (from === 'd2' && to === 'h6' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Ферзь h6 — смертельная угроза матом!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('c5' as any);
              setLastMove({ from: 'c5', to: 'f2' });
              setOpponentAnimatingMove({
                from: 'c5',
                to: 'f2',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c5', to: 'f2' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 13: either rook may move to g1
        if (whiteMoves === 13) {
          if ((from === 'd1' || from === 'h1') && to === 'g1' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Ладья d1 перешла на g1 для решающего удара.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('f2' as any);
              setLastMove({ from: 'f2', to: 'g1' });
              setOpponentAnimatingMove({
                from: 'f2',
                to: 'g1',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'f2', to: 'g1' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 14: either rook captures the bishop on g1
        if (whiteMoves === 14) {
          if ((from === 'd1' || from === 'h1') && to === 'g1' && move.piece === 'r' && move.captured === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Ладья забирает слона, продолжая штурм.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('e6' as any);
              setLastMove({ from: 'e6', to: 'g4' });
              setOpponentAnimatingMove({
                from: 'e6',
                to: 'g4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'e6', to: 'g4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 15: Rxg4
        if (whiteMoves === 15) {
          if (from === 'g1' && to === 'g4' && move.piece === 'r' && move.captured === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setWhiteMoves(nextWhiteMoves);
            setMessage('Отлично! Ладья уничтожила слона, открывая путь пешке.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const blackPiece = g.get('d7' as any);
              setLastMove({ from: 'd7', to: 'g4' });
              setOpponentAnimatingMove({
                from: 'd7',
                to: 'g4',
                piece: { type: blackPiece?.type?.toUpperCase() || 'P', color: 'b' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'd7', to: 'g4' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }, 800);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
        // Move 16: hxg4
        if (whiteMoves === 16) {
          if (from === 'h3' && to === 'g4' && move.piece === 'p' && move.captured === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Пешечный штурм завершён — ферзь взят и белые получили решающее преимущество!');
            saveStars(6, 3);
            return;
          } else {
            handleFailWithBlackCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, mountedRef);
            return;
          }
        }
      }
    } catch {
      // Invalid move
    }
  }, [game, whiteMoves, onComplete, saveStars, exercise]);

const handleSquareClick = useCallback((square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'w') return;

    const piece = g.get(square as any);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
        return;
      }
      processWhiteMove(selectedSquare, square);
    } else {
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processWhiteMove]);



  // ──── PROMOTION ────
  const handlePromotion = useCallback((pieceCode: string) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    processWhiteMove(from, to, pieceCode);
  }, [promotionPending, processWhiteMove]);

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

  const turnText = game ? (game.turn() === 'w' ? 'Ваш ход (белые)' : 'Ход чёрных...') : '';

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN */}
      <div className="hidden lg:flex w-full lg:w-[300px] flex-shrink-0 flex-col gap-2">
        {/* Desktop: Avatar + speech bubble */}
        <div className="hidden lg:flex items-start gap-2">
          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <AvatarBubble className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2.5 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              {exercise === 1 && whiteMoves === 0 ? 'Сыграйте e2-e4 — захватите центр пешкой.' :
               exercise === 1 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 1 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 1 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 1 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 1 && whiteMoves === 5 ? 'Сыграйте слоном с c1 на g5 — свяжите коня f6.' :
               exercise === 1 && whiteMoves === 6 ? 'Сделайте рокировку — уберите короля в безопасность.' :
               exercise === 2 && whiteMoves < 7 ? 'Захватите центр пешками, развейте коней и слонов и сделайте рокировку.' :
               exercise === 2 ? 'Отлично! Итальянская партия разыграна!' :
               exercise === 3 && whiteMoves === 0 ? 'Используйте дырокол, чтобы разрушить защиту короля соперника.' :
               exercise === 3 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 3 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 3 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 3 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 3 && whiteMoves === 5 ? 'Сыграйте слоном с c1 на g5 — свяжите коня f6.' :
               exercise === 3 && whiteMoves === 6 ? 'Конь d5 нападает на чёрного коня f6.' :
               exercise === 3 && whiteMoves === 7 ? 'Конь забирает чёрного коня на f6.' :
               exercise === 3 && whiteMoves === 8 ? 'Слон h6 нападает на ладью.' :
               exercise === 3 && whiteMoves === 9 ? 'Пешка h2-h3 нападает на чёрного слона.' :
               exercise === 3 && whiteMoves === 10 ? 'Пешка с g2 забирает чёрного слона на f3 и открывает линию g.' :
               exercise === 3 && whiteMoves === 11 ? 'Ладья g1 — шах чёрному королю.' :
               exercise === 3 && whiteMoves === 12 ? 'Слон g7 — шах!' :
               exercise === 3 && whiteMoves === 13 ? 'Слон забирает чёрную пешку на f6.' :
               exercise === 3 && whiteMoves === 14 ? 'Слон забирает ферзя на d8! Дырокол выполнен!' :
               exercise === 3 ? 'Дырокол выполнен!' :
               exercise === 4 && isComplete ? 'Дырокол выполнен!' :
               exercise === 4 ? 'Используйте дырокол, чтобы разрушить рокировку соперника.' :
               exercise === 5 && whiteMoves === 0 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' :
               exercise === 5 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 5 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 5 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 5 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 5 && whiteMoves === 5 ? 'Пешка h3 — не даём слону чёрных выйти на g4.' :
               exercise === 5 && whiteMoves === 6 ? 'Пешка g4 — начинаем пешечный штурм!' :
               exercise === 5 && whiteMoves === 7 ? 'Пешка g5 — продолжаем штурм!' :
               exercise === 5 && whiteMoves === 8 ? 'Слон забирает чёрную пешку на g5.' :
               exercise === 5 && whiteMoves === 9 ? 'Сыграйте ферзём на d2 — подготовьте длинную рокировку.' :
               exercise === 5 && whiteMoves === 10 ? 'O-O-O — длинная рокировка!' :
               exercise === 5 && whiteMoves === 11 ? 'Слон забирает коня на f6 — разрушаем защиту короля!' :
               exercise === 5 && whiteMoves === 12 ? 'Ферзь h6 — продолжаем атаку!' :
               exercise === 5 && whiteMoves === 13 ? 'Ладья g1 — шах!' :
               exercise === 5 && whiteMoves === 14 ? 'Ладья забирает чёрного слона на g1 — шах!' :
               exercise === 5 && whiteMoves === 15 ? 'Ладья забирает чёрного слона на g4!' :
               exercise === 5 && whiteMoves === 16 ? 'Пешка забирает ферзя на g4! Пешечный штурм выполнен!' :
               exercise === 5 ? 'Пешечный штурм выполнен!' :
               exercise === 6 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' : ''}
            </p>
          </AvatarBubble>
        </div>

        <div className="hidden lg:grid grid-cols-6 gap-1 rounded p-1 border border-[rgba(92,64,51,0.08)]">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const earnedStars = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earnedStars > 0;
            return (
              <button
                key={num}
                onClick={() => switchExercise(num as any)}
                className={`relative flex items-center justify-center px-1 py-2 rounded-lg transition cursor-pointer hover:brightness-110 ${
                  isCurrent
                    ? 'bg-[#2C241B] border-2 border-[#2C241B] text-white shadow-md'
                    : isDone
                    ? 'bg-white border-2 border-[#C9A84C] text-[#2C241B]'
                    : 'bg-white border-2 border-[#E8E0D5] text-[#8B7355] hover:border-[#C9A84C] hover:bg-[#F9F8F6]'
                }`}
              >
                <span className="text-sm font-bold">{num}</span>
                {isDone && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C9A84C] rounded-full flex items-center justify-center">
                    <StarPng filled={true} size={10} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={reset}
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-secondary)] border border-[rgba(92,64,51,0.12)] rounded hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)] transition w-full justify-center"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Mobile: Avatar + speech bubble */}
        <div className="flex lg:hidden items-start gap-2 w-full max-w-sm">
          <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
            <img src="/coach-avatar.png" alt="Тренер" className="w-full h-full object-contain" draggable={false} />
          </div>
          <AvatarBubble className="flex-1 bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[rgba(92,64,51,0.06)]">
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              {exercise === 1 && whiteMoves === 0 ? 'Сыграйте e2-e4 — захватите центр пешкой.' :
               exercise === 1 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 1 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 1 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 1 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 1 && whiteMoves === 5 ? 'Сыграйте слоном с c1 на g5 — свяжите коня f6.' :
               exercise === 1 && whiteMoves === 6 ? 'Сделайте рокировку — уберите короля в безопасность.' :
               exercise === 2 && whiteMoves < 7 ? 'Захватите центр пешками, развейте коней и слонов и сделайте рокировку.' :
               exercise === 2 ? 'Отлично! Итальянская партия разыграна!' :
               exercise === 3 && whiteMoves === 0 ? 'Используйте дырокол, чтобы разрушить защиту короля соперника.' :
               exercise === 3 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 3 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 3 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 3 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 3 && whiteMoves === 5 ? 'Сыграйте слоном с c1 на g5 — свяжите коня f6.' :
               exercise === 3 && whiteMoves === 6 ? 'Конь d5 нападает на чёрного коня f6.' :
               exercise === 3 && whiteMoves === 7 ? 'Конь забирает чёрного коня на f6.' :
               exercise === 3 && whiteMoves === 8 ? 'Слон h6 нападает на ладью.' :
               exercise === 3 && whiteMoves === 9 ? 'Пешка h2-h3 нападает на чёрного слона.' :
               exercise === 3 && whiteMoves === 10 ? 'Пешка с g2 забирает чёрного слона на f3 и открывает линию g.' :
               exercise === 3 && whiteMoves === 11 ? 'Ладья g1 — шах чёрному королю.' :
               exercise === 3 && whiteMoves === 12 ? 'Слон g7 — шах!' :
               exercise === 3 && whiteMoves === 13 ? 'Слон забирает чёрную пешку на f6.' :
               exercise === 3 && whiteMoves === 14 ? 'Слон забирает ферзя на d8! Дырокол выполнен!' :
               exercise === 3 ? 'Дырокол выполнен!' :
               exercise === 4 && isComplete ? 'Дырокол выполнен!' :
               exercise === 4 ? 'Используйте дырокол, чтобы разрушить рокировку соперника.' :
               exercise === 5 && whiteMoves === 0 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' :
               exercise === 5 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 5 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 5 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 5 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 5 && whiteMoves === 5 ? 'Пешка h3 — не даём слону чёрных выйти на g4.' :
               exercise === 5 && whiteMoves === 6 ? 'Пешка g4 — начинаем пешечный штурм!' :
               exercise === 5 && whiteMoves === 7 ? 'Пешка g5 — продолжаем штурм!' :
               exercise === 5 && whiteMoves === 8 ? 'Слон забирает чёрную пешку на g5.' :
               exercise === 5 && whiteMoves === 9 ? 'Сыграйте ферзём на d2 — подготовьте длинную рокировку.' :
               exercise === 5 && whiteMoves === 10 ? 'O-O-O — длинная рокировка!' :
               exercise === 5 && whiteMoves === 11 ? 'Слон забирает коня на f6 — разрушаем защиту короля!' :
               exercise === 5 && whiteMoves === 12 ? 'Ферзь h6 — продолжаем атаку!' :
               exercise === 5 && whiteMoves === 13 ? 'Ладья g1 — шах!' :
               exercise === 5 && whiteMoves === 14 ? 'Ладья забирает чёрного слона на g1 — шах!' :
               exercise === 5 && whiteMoves === 15 ? 'Ладья забирает чёрного слона на g4!' :
               exercise === 5 && whiteMoves === 16 ? 'Пешка забирает ферзя на g4! Пешечный штурм выполнен!' :
               exercise === 5 ? 'Пешечный штурм выполнен!' :
               exercise === 6 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' : ''}
            </p>
          </AvatarBubble>
        </div>

        {/* Desktop: simple text */}
        <div className="hidden lg:block text-center font-bold text-[#2C241B] text-lg mb-2 w-full">
          {exercise === 1 && whiteMoves === 0 ? 'Сыграйте e2-e4 — захватите центр пешкой.' :
           exercise === 1 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
           exercise === 1 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
           exercise === 1 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
           exercise === 1 && whiteMoves === 4 ? 'Сыграйте Bc1-g5 — свяжите коня f6.' :
           exercise === 1 && whiteMoves === 5 ? 'Сыграйте слоном с c1 на g5 — свяжите коня f6.' :
           exercise === 1 && whiteMoves === 6 ? 'Сделайте рокировку — уберите короля в безопасность.' :
           exercise === 2 && whiteMoves < 7 ? 'Захватите центр пешками, развейте коней и слонов и сделайте рокировку.' :
           exercise === 2 ? 'Отлично! Итальянская партия разыграна!' :
           exercise === 3 && whiteMoves === 0 ? 'Используйте дырокол, чтобы разрушить защиту короля соперника.' :
               exercise === 3 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 3 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 3 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 3 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 3 && whiteMoves === 5 ? 'Сыграйте слоном с c1 на g5 — свяжите коня f6.' :
               exercise === 3 && whiteMoves === 6 ? 'Конь d5 нападает на чёрного коня f6.' :
               exercise === 3 && whiteMoves === 7 ? 'Конь забирает чёрного коня на f6.' :
               exercise === 3 && whiteMoves === 8 ? 'Слон h6 нападает на ладью.' :
               exercise === 3 && whiteMoves === 9 ? 'Пешка h2-h3 нападает на чёрного слона.' :
               exercise === 3 && whiteMoves === 10 ? 'Пешка с g2 забирает чёрного слона на f3 и открывает линию g.' :
               exercise === 3 && whiteMoves === 11 ? 'Ладья g1 — шах чёрному королю.' :
               exercise === 3 && whiteMoves === 12 ? 'Слон g7 — шах!' :
               exercise === 3 && whiteMoves === 13 ? 'Слон забирает чёрную пешку на f6.' :
               exercise === 3 && whiteMoves === 14 ? 'Слон забирает ферзя на d8! Дырокол выполнен!' :
               exercise === 3 ? 'Дырокол выполнен!' :
           exercise === 4 && isComplete ? 'Дырокол выполнен!' :
           exercise === 4 ? 'Используйте дырокол, чтобы разрушить рокировку соперника.' :
           exercise === 5 && whiteMoves === 0 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' :
               exercise === 5 && whiteMoves === 1 ? 'Конь выходит на f3 — ближе к центру и нападает на чёрную пешку e5.' :
               exercise === 5 && whiteMoves === 2 ? 'Сыграйте слоном с f1 на c4 — так начинается итальянская партия.' :
               exercise === 5 && whiteMoves === 3 ? 'Сыграйте пешкой d2-d3 — откройте дорогу слону c1.' :
               exercise === 5 && whiteMoves === 4 ? 'Развейте второго коня, переместив его с b1 на c3.' :
               exercise === 5 && whiteMoves === 5 ? 'Пешка h3 — не даём слону чёрных выйти на g4.' :
               exercise === 5 && whiteMoves === 6 ? 'Пешка g4 — начинаем пешечный штурм!' :
               exercise === 5 && whiteMoves === 7 ? 'Пешка g5 — продолжаем штурм!' :
               exercise === 5 && whiteMoves === 8 ? 'Слон забирает чёрную пешку на g5.' :
               exercise === 5 && whiteMoves === 9 ? 'Сыграйте ферзём на d2 — подготовьте длинную рокировку.' :
               exercise === 5 && whiteMoves === 10 ? 'O-O-O — длинная рокировка!' :
               exercise === 5 && whiteMoves === 11 ? 'Слон забирает коня на f6 — разрушаем защиту короля!' :
               exercise === 5 && whiteMoves === 12 ? 'Ферзь h6 — продолжаем атаку!' :
               exercise === 5 && whiteMoves === 13 ? 'Ладья g1 — шах!' :
               exercise === 5 && whiteMoves === 14 ? 'Ладья забирает чёрного слона на g1 — шах!' :
               exercise === 5 && whiteMoves === 15 ? 'Ладья забирает чёрного слона на g4!' :
               exercise === 5 && whiteMoves === 16 ? 'Пешка забирает ферзя на g4! Пешечный штурм выполнен!' :
               exercise === 5 ? 'Пешечный штурм выполнен!' :
           exercise === 6 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' : ''}
        </div>

        {/* Board */}
        <div className="flex justify-center w-full relative" style={{ minHeight: 8 * sqSize }}>
          <div className="relative" style={{ width: 8 * sqSize + 6, height: 8 * sqSize + 6 }}>
            <UniversalChessBoardDesigner
            fen={game?.fen() || ''}
            selectedSquare={selectedSquare}
            lastMove={lastMove}
            autoValidMoves={true}
            onMove={async (from, to, _promotion) => { await processWhiteMove(from, to, undefined, true); }}
            onSquareClick={handleSquareClick}
            playerAnimatingMove={playerAnimatingMove}
            playerAnimatingMoves={playerAnimatingMoves}
            opponentAnimatingMove={opponentAnimatingMove}
            opponentAnimatingMoves={opponentAnimatingMoves}
            interactive={!isComplete && !isFail}
                disableAutoGhost={true}
            sqSize={sqSize}
          />
          {/* Hint arrows SVG overlay */}
          {hintVisible && !isFail && !isComplete && !selectedSquare && (
            (() => {
              const arrows = HINTS[exercise] || [];
              const phaseArrows = game && ((exercise === 2 && whiteMoves >= 3 && whiteMoves < 7) || (exercise === 6 && whiteMoves >= 3 && whiteMoves < 5))
                ? getFreePlayHintArrow(game, exercise)
                : arrows.filter(a => a.phase === whiteMoves);
              const displayedArrows = (exercise === 5 || exercise === 6) && (whiteMoves === 13 || whiteMoves === 14) && game
                ? phaseArrows.filter(arrow => game.moves({ square: arrow.from as any, verbose: true }).some(move => move.to === arrow.to)).slice(0, 1)
                : phaseArrows;
              if (displayedArrows.length === 0) return null;
              return (
                <svg className="absolute pointer-events-none z-[35]" style={{ top: 3, left: 3, width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                  {displayedArrows.map((arrow, i) => {
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
          </div>
        </div>

        {/* Fail banner */}
        {isFail && (
          <div className="w-full">
            <div className="bg-[#A63838] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">Попробуйте снова</p>
              <button
                onClick={reset}
                className="bg-white text-[#2C241B] font-bold text-base px-6 py-2 rounded shadow hover:bg-gray-100 transition"
              >
                ЕЩЁ РАЗ
              </button>
            </div>
          </div>
        )}

        {/* Success banner */}
        {isComplete && (
          <div className="w-full">
            <div className="bg-[#4A7A3A] rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg">
              <p className="text-white font-bold text-lg">Верно!</p>
              <div className="flex justify-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </div>
            </div>
          </div>
        )}

        {/* Mobile exercise pills */}
        <div className="flex lg:hidden gap-[1px] w-full">
          {[1,2,3,4,5,6].map((num) => {
            const earned = exerciseStars[num] || 0;
            const isCurrent = num === exercise;
            const isDone = earned > 0;
            const isLocked = !isCurrent && !isDone;
            return (
              <button
                key={num}
                onClick={() => { if (!isCurrent) switchExercise(num as any); }}
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

        {/* Mobile progress + buttons row */}
        <div className="flex lg:hidden flex-col gap-2 w-full">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[var(--text-primary)]">Упражнение {exercise} из 6</span>
            <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(exercise / 6) * 100}%` }} />
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={handleHint} className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${hintVisible ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}>
              <Eye size={14} /> Подсказка
            </button>
            <button onClick={reset} className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-all duration-200 border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]">
              <RotateCcw size={14} /> Заново
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

