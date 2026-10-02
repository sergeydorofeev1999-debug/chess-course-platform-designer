'use client';

import AvatarBubble from './AvatarBubble';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Trophy, Eye } from 'lucide-react';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

const FILES = ['h','g','f','e','d','c','b','a'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const DISPLAY_RANKS = ['1','2','3','4','5','6','7','8'];

const PROMOTION_PIECES = [
  { code: 'q', name: 'Ферзь' },
  { code: 'n', name: 'Конь' },
  { code: 'r', name: 'Ладья' },
  { code: 'b', name: 'Слон' },
];

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const HINTS: Record<number, { from: string; to: string; phase: number }[]> = {
  1: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'b8', to: 'c6', phase: 1 },
    { from: 'f8', to: 'c5', phase: 2 },
    { from: 'd7', to: 'd6', phase: 3 },
    { from: 'g8', to: 'f6', phase: 4 },
    { from: 'c8', to: 'g4', phase: 5 },
    { from: 'e8', to: 'g8', phase: 6 },
  ],
  2: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'b8', to: 'c6', phase: 1 },
    { from: 'f8', to: 'c5', phase: 2 },
  ],
  3: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'b8', to: 'c6', phase: 1 },
    { from: 'f8', to: 'c5', phase: 2 },
    { from: 'd7', to: 'd6', phase: 3 },
    { from: 'g8', to: 'f6', phase: 4 },
    { from: 'c8', to: 'g4', phase: 5 },
    { from: 'f6', to: 'd4', phase: 6 },
    { from: 'g4', to: 'f3', phase: 7 },
    { from: 'c5', to: 'h3', phase: 8 },
    { from: 'd4', to: 'f3', phase: 9 },
    { from: 'h3', to: 'g2', phase: 10 },
    { from: 'f6', to: 'f5', phase: 11 },
    { from: 'h8', to: 'g8', phase: 12 },
    { from: 'g2', to: 'f3', phase: 13 },
    { from: 'f3', to: 'g3', phase: 14 },
  ],
  4: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'b8', to: 'c6', phase: 1 },
    { from: 'f8', to: 'c5', phase: 2 },
    { from: 'd7', to: 'd6', phase: 3 },
    { from: 'g8', to: 'f6', phase: 4 },
    { from: 'c8', to: 'g4', phase: 5 },
    { from: 'f6', to: 'd4', phase: 6 },
    { from: 'g4', to: 'f3', phase: 7 },
    { from: 'c5', to: 'h3', phase: 8 },
    { from: 'd4', to: 'f3', phase: 9 },
    { from: 'h3', to: 'g2', phase: 10 },
    { from: 'f6', to: 'f5', phase: 11 },
    { from: 'h8', to: 'g8', phase: 12 },
    { from: 'g2', to: 'f3', phase: 13 },
    { from: 'f3', to: 'g3', phase: 14 },
  ],
  5: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'b8', to: 'c6', phase: 1 },
    { from: 'f8', to: 'c5', phase: 2 },
    { from: 'd7', to: 'd6', phase: 3 },
    { from: 'g8', to: 'f6', phase: 4 },
    { from: 'h7', to: 'h6', phase: 5 },
    { from: 'g7', to: 'g5', phase: 6 },
    { from: 'g5', to: 'g4', phase: 7 },
    { from: 'h6', to: 'g5', phase: 8 },
    { from: 'f6', to: 'g4', phase: 9 },
    { from: 'f8', to: 'h8', phase: 10 },
    { from: 'g4', to: 'f2', phase: 11 },
    { from: 'g7', to: 'h6', phase: 12 },
    { from: 'h6', to: 'h4', phase: 13 },
    { from: 'd8', to: 'h4', phase: 14 },
    { from: 'h4', to: 'h2', phase: 15 },
    { from: 'f2', to: 'g3', phase: 16 },
    { from: 'h2', to: 'h1', phase: 17 },
  ],
  6: [
    { from: 'e7', to: 'e5', phase: 0 },
    { from: 'b8', to: 'c6', phase: 1 },
    { from: 'f8', to: 'c5', phase: 2 },
    { from: 'd7', to: 'd6', phase: 3 },
    { from: 'g8', to: 'f6', phase: 4 },
    { from: 'h7', to: 'h6', phase: 5 },
    { from: 'g7', to: 'g5', phase: 6 },
    { from: 'g5', to: 'g4', phase: 7 },
    { from: 'h6', to: 'g5', phase: 8 },
    { from: 'f6', to: 'g4', phase: 9 },
    { from: 'f8', to: 'h8', phase: 10 },
    { from: 'g4', to: 'f2', phase: 11 },
    { from: 'g7', to: 'h6', phase: 12 },
    { from: 'h6', to: 'h4', phase: 13 },
    { from: 'd8', to: 'h4', phase: 14 },
    { from: 'h4', to: 'h2', phase: 15 },
    { from: 'f2', to: 'g3', phase: 16 },
    { from: 'h2', to: 'h1', phase: 17 },
  ],
};

// Find a white capture that leaves the white piece safe (no black recapture)
function findSafeWhiteCapture(currentGame: Chess): { from: string; to: string } | null {
  const whiteMoves = currentGame.moves({ verbose: true });
  const captures = whiteMoves.filter((m: any) => m.captured);
  for (const capture of captures) {
    const testGame = new Chess(currentGame.fen());
    testGame.move({ from: capture.from, to: capture.to });
    const blackMoves = testGame.moves({ verbose: true });
    const blackRecaptures = blackMoves.filter((m: any) => m.captured && m.to === capture.to);
    if (blackRecaptures.length === 0) {
      return { from: capture.from, to: capture.to };
    }
  }
  return null;
}

function handleFailWithWhiteCapture(
  g: Chess,
  setGameFn: (g: Chess) => void,
  setIsFailFn: (v: boolean) => void,
  setMessageFn: (msg: string) => void,
  setSelectedSquareFn: (sq: string | null) => void,
  setLastMoveFn: (m: { from: string; to: string } | null) => void,
  setOpponentAnimatingMoveFn: (m: { from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null) => void,
  mountedRef: React.RefObject<boolean>
) {
  const cap = findSafeWhiteCapture(g);
  if (cap) {
    setTimeout(() => {
      if (!mountedRef.current) return;
      
      const wp = g.get(cap.from as any);
      setLastMoveFn({ from: cap.from, to: cap.to });
      setOpponentAnimatingMoveFn({
        from: cap.from,
        to: cap.to,
        piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
      });
      setTimeout(() => {
        if (!mountedRef.current) return;
        g.move({ from: cap.from, to: cap.to });
        setGameFn(new Chess(g.fen()));
        setOpponentAnimatingMoveFn(null);
      }, 200);
      setTimeout(() => {
        if (mountedRef.current) { setIsFailFn(true); setMessageFn('Провалено'); }
      }, 1200);
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

export default function ItalianOpeningBoardBlack({ onComplete, lessonId }: { onComplete: () => void; lessonId?: string }) {
  const [exercise, setExercise] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isFail, setIsFail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [blackMoves, setBlackMoves] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [sqSize, setSqSize] = useState(52);
  const [exerciseStars, setExerciseStars] = useState<Record<number, number>>({});
  const [postMoveHint, setPostMoveHint] = useState('');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [opponentAnimatingMoves, setOpponentAnimatingMoves] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } }[] | null>(null);
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } } | null>(null);
  const [playerAnimatingMoves, setPlayerAnimatingMoves] = useState<{ from: string; to: string; piece: { type: string; color: 'w' | 'b' } }[] | null>(null);

  const isCompleteRef = useRef(false);
  const isFailRef = useRef(false);
  const isProcessingRef = useRef(false);
  const mountedRef = useRef(true);
  const autoStartedRef = useRef(false);
  const justDraggedRef = useRef(false);

  const [dragPiece, setDragPiece] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const pointerStartRef = useRef<PointerStart | null>(null);
  const [promotionPending, setPromotionPending] = useState<{from: string; to: string} | null>(null);

  const storageKey = lessonId ? `italian_black_progress_${lessonId}` : 'italian_black_progress';

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
    if (!game) setGame(new Chess(START_FEN));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start: white plays e4 on init
  useEffect(() => {
    if (!game) return;
    if (autoStartedRef.current) return;
    if (game.turn() === 'w' && blackMoves === 0) {
      autoStartedRef.current = true;
      setTimeout(() => {
        if (!mountedRef.current) return;
        const g = game!;
        const wp = g.get('e2' as any);
setLastMove({ from: 'e2', to: 'e4' });
        setOpponentAnimatingMove({
          from: 'e2',
          to: 'e4',
          piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
        });
        setTimeout(() => {
        if (!mountedRef.current) return;
        g.move({ from: 'e2', to: 'e4' });
        setGame(new Chess(g.fen()));
        setHintVisible(false);
        setOpponentAnimatingMove(null);
        }, 200);
      }, 1000);
    }
  }, [game, blackMoves]);

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

    const handleHint = useCallback(() => {
    if (isComplete || isFail) return;
    if (game?.turn() !== 'b') return;
    setHintVisible(prev => !prev);
  }, [isComplete, isFail, game]);

  const reset = useCallback(() => {
    const g = new Chess(START_FEN);
    setGame(g);
    setSelectedSquare(null);
    setMessage('');
    setLastMove(null);
    setIsFail(false);
    setIsComplete(false);
    setBlackMoves(0);
    setHintVisible(false);
    setPostMoveHint('');
    autoStartedRef.current = false;
    // Auto-play white e4 again
    setTimeout(() => {
      if (!mountedRef.current) return;
      const g = game!;
      const wp = g.get('e2' as any);
setLastMove({ from: 'e2', to: 'e4' });
      setOpponentAnimatingMove({
        from: 'e2',
        to: 'e4',
        piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
      });
      setTimeout(() => {
      if (!mountedRef.current) return;
      g.move({ from: 'e2', to: 'e4' });
      setGame(new Chess(g.fen()));
      setHintVisible(false);
      setOpponentAnimatingMove(null);
      }, 200);
    }, 1000);
  }, []);

  const switchExercise = useCallback((num: 1 | 2 | 3 | 4 | 5 | 6) => {
    setExercise(num);
    reset();
  }, [reset]);

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

  const saveStars = useCallback((ex: number, stars: number) => {
    setExerciseStars(prev => {
      const next = { ...prev, [ex]: Math.max(prev[ex] || 0, stars) };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const processBlackMove = useCallback(async (from: string, to: string, promotionPiece?: string, skipAnimation = false) => {
    if (!game) return;
    if (isProcessingRef.current) return;
    const g = game!;
    if (g.turn() !== 'b') return;
    const fromPiece = g.get(from as any);
    if (!fromPiece || fromPiece.color !== 'b') return;
    isProcessingRef.current = true;

    const isPromotion = fromPiece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    if (isPromotion && !promotionPiece) {
      setPromotionPending({ from, to });
      isProcessingRef.current = false;
      return;
    }

    try {
      const move = g.move({ from, to, promotion: promotionPiece });
      if (!move) return;
      setLastMove({ from, to });
      setSelectedSquare(null);
      setHintVisible(false);

      if (!skipAnimation) {
        const isCastle = move.piece === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
        if (isCastle) {
          const isShort = to === 'g8';
          const rookFrom = isShort ? 'h8' : 'a8';
          const rookTo = isShort ? 'f8' : 'd8';
          setPlayerAnimatingMoves([
            { from, to, piece: { type: 'K', color: 'b' } },
            { from: rookFrom, to: rookTo, piece: { type: 'R', color: 'b' } },
          ]);
          await new Promise(resolve => setTimeout(resolve, 200));
          setPlayerAnimatingMoves(null);
        } else {
          setPlayerAnimatingMove({
            from,
            to,
            piece: { type: move.piece.toUpperCase(), color: 'b' },
          });
          await new Promise(resolve => setTimeout(resolve, 200));
          setPlayerAnimatingMove(null);
        }
      }

      const nextBlackMoves = blackMoves + 1;

      if (exercise === 1) {
        // Exercise 1: Italian Opening for Black — hints BEFORE moves
        if (blackMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f1' as any);
setLastMove({ from: 'f1', to: 'c4' });
              setOpponentAnimatingMove({
                from: 'f1',
                to: 'c4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f1', to: 'c4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 2) {
          if (from === 'f8' && to === 'c5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'd3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'd3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'd3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 3) {
          if (from === 'd7' && to === 'd6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('b1' as any);
setLastMove({ from: 'b1', to: 'c3' });
              setOpponentAnimatingMove({
                from: 'b1',
                to: 'c3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'b1', to: 'c3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 4) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              g.move({ from: 'e1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setLastMove({ from: 'e1', to: 'g1' });
              setOpponentAnimatingMoves([
                { from: 'e1', to: 'g1', piece: { type: 'K', color: 'w' } },
                { from: 'h1', to: 'f1', piece: { type: 'R', color: 'w' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setOpponentAnimatingMoves(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 5) {
          if (from === 'c8' && to === 'g4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('c1' as any);
setLastMove({ from: 'c1', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'c1',
                to: 'g5',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'c1', to: 'g5' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 6) {
          if (move.piece === 'k' && (to === 'g8' || to === 'h8')) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setIsComplete(true);
            setMessage('Отлично! Итальянская партия за чёрных завершена. Вы ответили на ходы белых правильно!');
            saveStars(1, 3);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
      } else if (exercise === 2) {
        // Exercise 2: Repeat Italian Opening for Black — hints AFTER moves, free order for moves 3-5 (d6, Nf6, Bg4)
        function isPieceOnSquare(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          isProcessingRef.current = false;
          return p.type === piece && p.color === color;
        }
        function countFreeMoves(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquare(pos, 'd6', 'p', 'b')) count++;   // d6
          if (isPieceOnSquare(pos, 'f6', 'n', 'b')) count++;   // Nf6
          if (isPieceOnSquare(pos, 'g4', 'b', 'b')) count++;  // Bg4
          isProcessingRef.current = false;
          return count;
        }
        // Move 0: e5
        if (blackMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, пешка захватила центр');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        // Move 1: Nc6
        if (blackMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, конь вышел ближе к центру и защитил пешку e5');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f1' as any);
setLastMove({ from: 'f1', to: 'c4' });
              setOpponentAnimatingMove({
                from: 'f1',
                to: 'c4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f1', to: 'c4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        // Move 2: Bc5
        if (blackMoves === 2) {
          if (from === 'f8' && to === 'c5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, слон вышел ближе к центру');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'd3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'd3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'd3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        // Free play: moves 3-5 (d6, Nf6, Bg4 in any order)
        if (blackMoves >= 3 && blackMoves <= 5) {
          const isAllowed = (
            (from === 'd7' && to === 'd6' && move.piece === 'p') ||
            (from === 'g8' && to === 'f6' && move.piece === 'n') ||
            (from === 'c8' && to === 'g4' && move.piece === 'b')
          );
          if (!isAllowed) {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
          const expectedCount = blackMoves - 2;
          const actualCount = countFreeMoves(g);
          if (actualCount !== expectedCount) {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setBlackMoves(nextBlackMoves);
          setPostMoveHint('Отлично! Правильное развитие фигур в центре.');
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (blackMoves === 3) {
              const wp1 = g.get('b1' as any);
              setLastMove({ from: 'b1', to: 'c3' });
              setOpponentAnimatingMove({
                from: 'b1',
                to: 'c3',
                piece: { type: wp1?.type?.toUpperCase() || 'N', color: 'w' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b1', to: 'c3' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else if (blackMoves === 4) {
              g.move({ from: 'e1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setLastMove({ from: 'e1', to: 'g1' });
              setOpponentAnimatingMoves([
                { from: 'e1', to: 'g1', piece: { type: 'K', color: 'w' } },
                { from: 'h1', to: 'f1', piece: { type: 'R', color: 'w' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setOpponentAnimatingMoves(null);
              }, 200);
            } else {
              const wb = g.get('c1' as any);
              setLastMove({ from: 'c1', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'c1',
                to: 'g5',
                piece: { type: wb?.type?.toUpperCase() || 'B', color: 'w' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c1', to: 'g5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }
          }, 1000);
          isProcessingRef.current = false;
          return;
        }
        // Move 6: O-O
        if (blackMoves === 6) {
          if (move.piece === 'k' && (to === 'g8' || to === 'h8')) {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setIsComplete(true);
            setMessage('Отлично! Итальянская партия за чёрных завершена. Вы ответили на ходы белых правильно!');
            saveStars(2, 3);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
      } else if (exercise === 3) {
        // Exercise 3: Dyrakol (дырокол) — student plays black in a full game leading to Rxg5#
        // Sequence: e5, Nc6, Bc5, d6, Nf6, Bg4, Nd4, Nxf3, Bh3, gxf6, f5, Rg8+, Bg2+, Bxf3+, Rxg5#
        // White moves: e4 Nf3 Bc4 d3 Nc3 O-O Bg5 Nd5 Nxf6+ Bh4 Bxd8 Kh1 Kg1 Bg5
        if (blackMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь выходит на f3 — защищает пешку e4 и готовит развитие. Сделайте Nf3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь выходит на c6 — ближе к центру и защищает пешку e5.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f1' as any);
setLastMove({ from: 'f1', to: 'c4' });
              setOpponentAnimatingMove({
                from: 'f1',
                to: 'c4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f1', to: 'c4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 2) {
          if (from === 'f8' && to === 'c5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('d3 — тихая итальянская, готовим позицию для дырокола. Сделайте d3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'd3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'd3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'd3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 3) {
          if (from === 'd7' && to === 'd6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь c3 развивает фигуры и готовится к центру. Сделайте Nc3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('b1' as any);
setLastMove({ from: 'b1', to: 'c3' });
              setOpponentAnimatingMove({
                from: 'b1',
                to: 'c3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'b1', to: 'c3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 4) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Белые рокировались — король в безопасности. Сыграйте Bg4 — нападение на коня f3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              g.move({ from: 'e1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setLastMove({ from: 'e1', to: 'g1' });
              setOpponentAnimatingMoves([
                { from: 'e1', to: 'g1', piece: { type: 'K', color: 'w' } },
                { from: 'h1', to: 'f1', piece: { type: 'R', color: 'w' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setOpponentAnimatingMoves(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 5) {
          if (from === 'c8' && to === 'g4' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Чёрные рокировались! Это ключевой момент — мы НЕ рокировали и можем атаковать. Конь d5!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('c1' as any);
setLastMove({ from: 'c1', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'c1',
                to: 'g5',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'c1', to: 'g5' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 6) {
          if (from === 'c6' && to === 'd4' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь забирает коня на f6 — размен! Делайте Nxf6!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('c3' as any);
setLastMove({ from: 'c3', to: 'd5' });
              setOpponentAnimatingMove({
                from: 'c3',
                to: 'd5',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'c3', to: 'd5' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 7) {
          if (from === 'd4' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Пешка g берёт коня — линия f открыта! Делайте gxf3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g2' as any);
setLastMove({ from: 'g2', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g2',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g2', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 8) {
          if (from === 'g4' && to === 'h3' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь забирает коня на f6 — шах! Делайте Nxf6+!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d5' as any);
setLastMove({ from: 'd5', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'd5',
                to: 'f6',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd5', to: 'f6' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 9) {
          if (from === 'g7' && to === 'f6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Пешка f открыта — это дырокол! Слон h6 атакует ладью. Делайте Bh6!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g5' as any);
setLastMove({ from: 'g5', to: 'h4' });
              setOpponentAnimatingMove({
                from: 'g5',
                to: 'h4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g5', to: 'h4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 10) {
          if (from === 'f6' && to === 'f5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Слон забирает ферзя на d8! Дырокол! Делайте Bxd8!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h4' as any);
setLastMove({ from: 'h4', to: 'd8' });
              setOpponentAnimatingMove({
                from: 'h4',
                to: 'd8',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h4', to: 'd8' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 11) {
          if (from === 'h8' && to === 'g8' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Король отходит на h1. Делайте Kh1!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'h1' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'h1',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'h1' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 12) {
          if (from === 'h3' && to === 'g2' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Король на g1. Делайте Kg1!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h1' as any);
setLastMove({ from: 'h1', to: 'g1' });
              setOpponentAnimatingMove({
                from: 'h1',
                to: 'g1',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 13) {
          if (from === 'g2' && to === 'f3' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Слон g5 — финальный удар! Делайте Bg5!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d8' as any);
setLastMove({ from: 'd8', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'd8',
                to: 'g5',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd8', to: 'g5' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 14) {
          if (from === 'g8' && to === 'g5' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Дырокол выполнен! Чёрные сначала разменяли коня на f6, потом разрушили рокировку, и в конце поставили мат ладьёй на g5. Когда рокировка разрушена, белого короля легче атаковать!');
            saveStars(3, 3);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
      } else if (exercise === 4) {
        // Exercise 4: Dyrakol (дырокол) — student repeats all black moves with hints AFTER each move
        // Moves 0-2: strict order (e5, Nc6, Bc5) with post-move hints
        // Moves 3-5: free order (d6, Nf6, Bg4) in any order
        // Moves 6+: strict order (Nd4, Nxf3, Bh3, gxf6, f5, Rg8+, Bg2+, Bxf3+, Rxg5#)
        function isPieceOnSquareEx4(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          isProcessingRef.current = false;
          return p.type === piece && p.color === color;
        }
        function countFreeMovesEx4(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquareEx4(pos, 'd6', 'p', 'b')) count++;
          if (isPieceOnSquareEx4(pos, 'f6', 'n', 'b')) count++;
          if (isPieceOnSquareEx4(pos, 'g4', 'b', 'b')) count++;
          isProcessingRef.current = false;
          return count;
        }
        if (blackMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, пешка захватила центр');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, конь вышел ближе к центру и защитил пешку e5');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f1' as any);
setLastMove({ from: 'f1', to: 'c4' });
              setOpponentAnimatingMove({
                from: 'f1',
                to: 'c4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f1', to: 'c4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 2) {
          if (from === 'f8' && to === 'c5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, слон вышел ближе к центру');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'd3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'd3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'd3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves >= 3 && blackMoves <= 5) {
          const isAllowed = (
            (from === 'd7' && to === 'd6' && move.piece === 'p') ||
            (from === 'g8' && to === 'f6' && move.piece === 'n') ||
            (from === 'c8' && to === 'g4' && move.piece === 'b')
          );
          if (!isAllowed) {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
          const expectedCount = blackMoves - 2;
          const actualCount = countFreeMovesEx4(g);
          if (actualCount !== expectedCount) {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setBlackMoves(nextBlackMoves);
          setPostMoveHint('Отлично! Правильное развитие фигур в центре.');
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (blackMoves === 3) {
              const wp1 = g.get('b1' as any);
              setLastMove({ from: 'b1', to: 'c3' });
              setOpponentAnimatingMove({
                from: 'b1',
                to: 'c3',
                piece: { type: wp1?.type?.toUpperCase() || 'N', color: 'w' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b1', to: 'c3' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else if (blackMoves === 4) {
              g.move({ from: 'e1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setLastMove({ from: 'e1', to: 'g1' });
              setOpponentAnimatingMoves([
                { from: 'e1', to: 'g1', piece: { type: 'K', color: 'w' } },
                { from: 'h1', to: 'f1', piece: { type: 'R', color: 'w' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setOpponentAnimatingMoves(null);
              }, 200);
            } else {
              const wb = g.get('c1' as any);
              setLastMove({ from: 'c1', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'c1',
                to: 'g5',
                piece: { type: wb?.type?.toUpperCase() || 'B', color: 'w' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'c1', to: 'g5' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }
          }, 1000);
          isProcessingRef.current = false;
          return;
        }
        if (blackMoves === 6) {
          if (from === 'c6' && to === 'd4' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь забирает коня на f3 — размен! Делайте Nxf3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('c3' as any);
setLastMove({ from: 'c3', to: 'd5' });
              setOpponentAnimatingMove({
                from: 'c3',
                to: 'd5',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'c3', to: 'd5' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 7) {
          if (from === 'd4' && to === 'f3' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Пешка g берёт коня — линия f открыта! Делайте gxf3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g2' as any);
setLastMove({ from: 'g2', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g2',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g2', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 8) {
          if (from === 'g4' && to === 'h3' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Конь забирает коня на f6 — шах! Делайте Nxf6+!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d5' as any);
setLastMove({ from: 'd5', to: 'f6' });
              setOpponentAnimatingMove({
                from: 'd5',
                to: 'f6',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd5', to: 'f6' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 9) {
          if (from === 'g7' && to === 'f6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Пешка f открыта — это дырокол! Слон h6 атакует ладью. Делайте Bh6!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g5' as any);
setLastMove({ from: 'g5', to: 'h4' });
              setOpponentAnimatingMove({
                from: 'g5',
                to: 'h4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g5', to: 'h4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 10) {
          if (from === 'f6' && to === 'f5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Слон забирает ферзя на d8! Дырокол! Делайте Bxd8!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h4' as any);
setLastMove({ from: 'h4', to: 'd8' });
              setOpponentAnimatingMove({
                from: 'h4',
                to: 'd8',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h4', to: 'd8' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 11) {
          if (from === 'h8' && to === 'g8' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Король отходит на h1. Делайте Kh1!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'h1' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'h1',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'h1' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 12) {
          if (from === 'h3' && to === 'g2' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Король на g1. Делайте Kg1!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h1' as any);
setLastMove({ from: 'h1', to: 'g1' });
              setOpponentAnimatingMove({
                from: 'h1',
                to: 'g1',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 13) {
          if (from === 'g2' && to === 'f3' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Слон g5 — финальный удар! Делайте Bg5!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d8' as any);
setLastMove({ from: 'd8', to: 'g5' });
              setOpponentAnimatingMove({
                from: 'd8',
                to: 'g5',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd8', to: 'g5' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 14) {
          if (from === 'g8' && to === 'g5' && move.piece === 'r') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Отлично! Дырокол выполнен! Чёрные сначала разменяли коня на f6, потом разрушили рокировку, и в конце поставили мат ладьёй на g5. Когда рокировка разрушена, белого короля легче атаковать!');
            saveStars(4, 3);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
      } else if (exercise === 5) {
        // Exercise 5: Пешечный штурм — hints BEFORE each black move
        // Full sequence: e4 e5 Nf3 Nc6 Bc4 Bc5 d3 d6 Nc3 Nf6 h3 h6 O-O g5 Nfd2 g4 h4 g3 Kh1 Bxf2 Nf3 Ng4 Ne2 Nh2 Nxh2 Qxh4 Nxg3 Bxg3 Qf3 Qxh2#
        if (blackMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f1' as any);
setLastMove({ from: 'f1', to: 'c4' });
              setOpponentAnimatingMove({
                from: 'f1',
                to: 'c4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f1', to: 'c4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 2) {
          if (from === 'f8' && to === 'c5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'd3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'd3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'd3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 3) {
          if (from === 'd7' && to === 'd6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('b1' as any);
setLastMove({ from: 'b1', to: 'c3' });
              setOpponentAnimatingMove({
                from: 'b1',
                to: 'c3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'b1', to: 'c3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 4) {
          if (from === 'g8' && to === 'f6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h2' as any);
setLastMove({ from: 'h2', to: 'h3' });
              setOpponentAnimatingMove({
                from: 'h2',
                to: 'h3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h2', to: 'h3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 5) {
          if (from === 'h7' && to === 'h6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              g.move({ from: 'e1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setLastMove({ from: 'e1', to: 'g1' });
              setOpponentAnimatingMoves([
                { from: 'e1', to: 'g1', piece: { type: 'K', color: 'w' } },
                { from: 'h1', to: 'f1', piece: { type: 'R', color: 'w' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setOpponentAnimatingMoves(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 6) {
          if (from === 'g7' && to === 'g5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f3' as any);
setLastMove({ from: 'f3', to: 'd2' });
              setOpponentAnimatingMove({
                from: 'f3',
                to: 'd2',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f3', to: 'd2' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 7) {
          if (from === 'g5' && to === 'g4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h3' as any);
setLastMove({ from: 'h3', to: 'h4' });
              setOpponentAnimatingMove({
                from: 'h3',
                to: 'h4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h3', to: 'h4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 8) {
          if (from === 'g4' && to === 'g3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'h1' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'h1',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'h1' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 9) {
          if (from === 'c5' && to === 'f2' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 10) {
          if (from === 'f6' && to === 'g4' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('c3' as any);
setLastMove({ from: 'c3', to: 'e2' });
              setOpponentAnimatingMove({
                from: 'c3',
                to: 'e2',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'c3', to: 'e2' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 11) {
          if (from === 'g4' && to === 'h2' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f3' as any);
setLastMove({ from: 'f3', to: 'h2' });
              setOpponentAnimatingMove({
                from: 'f3',
                to: 'h2',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f3', to: 'h2' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 12) {
          if (from === 'd8' && to === 'h4' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('e2' as any);
setLastMove({ from: 'e2', to: 'g3' });
              setOpponentAnimatingMove({
                from: 'e2',
                to: 'g3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'e2', to: 'g3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 13) {
          if (from === 'f2' && to === 'g3' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d1' as any);
setLastMove({ from: 'd1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'd1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 14) {
          if (from === 'h4' && to === 'h2' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Мат! Пешечный штурм успешен! Чёрные прорвались через королевский фланг и поставили мат ферзём на h2!');
            saveStars(5, 3);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
      } else if (exercise === 6) {
        // Exercise 6: Пешечный штурм (самостоятельный) — post-move hints
        // Moves 0-2: strict order (e5, Nc6, Bc5) with post-move hints
        // Moves 3-4: free order (d6, Nf6) in any order
        // Moves 5+: strict order (h6, O-O, g5, Nfd2, g4, h4, g3, Kh1, Bxf2, Nf3, Ng4, Ne2, Nh2, Nxh2, Qxh4, Nxg3, Bxg3, Qf3, Qxh2#)
        function isPieceOnSquareEx6(pos: Chess, sq: string, piece: string, color: 'w'|'b'): boolean {
          const p = pos.get(sq as any);
          if (!p) return false;
          isProcessingRef.current = false;
          return p.type === piece && p.color === color;
        }
        function countFreeMovesEx6(pos: Chess): number {
          let count = 0;
          if (isPieceOnSquareEx6(pos, 'd6', 'p', 'b')) count++;
          if (isPieceOnSquareEx6(pos, 'f6', 'n', 'b')) count++;
          isProcessingRef.current = false;
          return count;
        }
        if (blackMoves === 0) {
          if (from === 'e7' && to === 'e5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, пешка захватила центр');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 1) {
          if (from === 'b8' && to === 'c6' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, конь вышел ближе к центру и защитил пешку e5');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f1' as any);
setLastMove({ from: 'f1', to: 'c4' });
              setOpponentAnimatingMove({
                from: 'f1',
                to: 'c4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f1', to: 'c4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 2) {
          if (from === 'f8' && to === 'c5' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично, слон вышел ближе к центру');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'd3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'd3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'd3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves >= 3 && blackMoves <= 4) {
          const isAllowed = (
            (from === 'd7' && to === 'd6' && move.piece === 'p') ||
            (from === 'g8' && to === 'f6' && move.piece === 'n')
          );
          if (!isAllowed) {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
          const expectedCount = blackMoves - 2;
          const actualCount = countFreeMovesEx6(g);
          if (actualCount !== expectedCount) {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
          setGame(new Chess(g.fen()));
          setSelectedSquare(null);
          setBlackMoves(nextBlackMoves);
          setPostMoveHint('Отлично! Правильное развитие фигур в центре.');
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (blackMoves === 3) {
              const wp1 = g.get('b1' as any);
              setLastMove({ from: 'b1', to: 'c3' });
              setOpponentAnimatingMove({
                from: 'b1',
                to: 'c3',
                piece: { type: wp1?.type?.toUpperCase() || 'N', color: 'w' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'b1', to: 'c3' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            } else {
              const g = game!;
              const wp = g.get('h2' as any);
setLastMove({ from: 'h2', to: 'h3' });
              setLastMove({ from: 'h2', to: 'h3' });
              setOpponentAnimatingMove({
                from: 'h2',
                to: 'h3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
                if (!mountedRef.current) return;
                g.move({ from: 'h2', to: 'h3' });
                setGame(new Chess(g.fen()));
                setHintVisible(false);
                setOpponentAnimatingMove(null);
              }, 200);
            }
          }, 1000);
          isProcessingRef.current = false;
          return;
        }
        if (blackMoves === 5) {
          if (from === 'h7' && to === 'h6' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Готовим пешечный штурм.');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              g.move({ from: 'e1', to: 'g1' });
              setGame(new Chess(g.fen()));
              setLastMove({ from: 'e1', to: 'g1' });
              setOpponentAnimatingMoves([
                { from: 'e1', to: 'g1', piece: { type: 'K', color: 'w' } },
                { from: 'h1', to: 'f1', piece: { type: 'R', color: 'w' } },
              ]);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setOpponentAnimatingMoves(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 6) {
          if (from === 'g7' && to === 'g5' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Начинаем пешечный штурм!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f3' as any);
setLastMove({ from: 'f3', to: 'd2' });
              setOpponentAnimatingMove({
                from: 'f3',
                to: 'd2',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f3', to: 'd2' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 7) {
          if (from === 'g5' && to === 'g4' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Пешки наступают!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('h3' as any);
setLastMove({ from: 'h3', to: 'h4' });
              setOpponentAnimatingMove({
                from: 'h3',
                to: 'h4',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'h3', to: 'h4' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 8) {
          if (from === 'g4' && to === 'g3' && move.piece === 'p') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Прорыв пешками!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('g1' as any);
setLastMove({ from: 'g1', to: 'h1' });
              setOpponentAnimatingMove({
                from: 'g1',
                to: 'h1',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'g1', to: 'h1' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 9) {
          if (from === 'c5' && to === 'f2' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Слон врывается в позицию!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d2' as any);
setLastMove({ from: 'd2', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'd2',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd2', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 10) {
          if (from === 'f6' && to === 'g4' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Конь прорывается!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('c3' as any);
setLastMove({ from: 'c3', to: 'e2' });
              setOpponentAnimatingMove({
                from: 'c3',
                to: 'e2',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'c3', to: 'e2' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 11) {
          if (from === 'g4' && to === 'h2' && move.piece === 'n') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Конь врывается на h2!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('f3' as any);
setLastMove({ from: 'f3', to: 'h2' });
              setOpponentAnimatingMove({
                from: 'f3',
                to: 'h2',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'f3', to: 'h2' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 12) {
          if (from === 'd8' && to === 'h4' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Ферзь выходит на атаку!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('e2' as any);
setLastMove({ from: 'e2', to: 'g3' });
              setOpponentAnimatingMove({
                from: 'e2',
                to: 'g3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'e2', to: 'g3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 13) {
          if (from === 'f2' && to === 'g3' && move.piece === 'b') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setBlackMoves(nextBlackMoves);
            setPostMoveHint('Отлично! Слон забирает на g3!');
            setTimeout(() => {
              if (!mountedRef.current) return;
              const g = game!;
              const wp = g.get('d1' as any);
setLastMove({ from: 'd1', to: 'f3' });
              setOpponentAnimatingMove({
                from: 'd1',
                to: 'f3',
                piece: { type: wp?.type?.toUpperCase() || 'P', color: 'w' },
              });
              setTimeout(() => {
              if (!mountedRef.current) return;
              g.move({ from: 'd1', to: 'f3' });
              setGame(new Chess(g.fen()));
              setHintVisible(false);
              setOpponentAnimatingMove(null);
              }, 200);
            }, 1000);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
        if (blackMoves === 14) {
          if (from === 'h4' && to === 'h2' && move.piece === 'q') {
            setGame(new Chess(g.fen()));
            setSelectedSquare(null);
            setIsComplete(true);
            setMessage('Мат! Пешечный штурм выполнен! Вы самостоятельно прошли всю партию!');
            saveStars(6, 3);
            isProcessingRef.current = false;
            return;
          } else {
            handleFailWithWhiteCapture(g, setGame, setIsFail, setMessage, setSelectedSquare, setLastMove, setOpponentAnimatingMove, mountedRef);
            isProcessingRef.current = false;
            return;
          }
        }
      }
    } catch {
      // Invalid move
    }
  }, [game, blackMoves, saveStars, exercise]);

  const handleSquareClick = useCallback((square: string) => {
    if (promotionPending) return;
    if (isCompleteRef.current || isFailRef.current) return;
    if (!game) return;
    const g = game;
    if (g.turn() !== 'b') return;

    const piece = g.get(square as any);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      if (piece && piece.color === 'b') {
        setSelectedSquare(square);
        return;
      }
      processBlackMove(selectedSquare, square);
    } else {
      if (piece && piece.color === 'b') {
        setSelectedSquare(square);
      }
    }
  }, [game, selectedSquare, processBlackMove, promotionPending]);


  // Drag is handled by UniversalChessBoardDesigner

  // ──── PROMOTION ────
  const handlePromotion = useCallback((pieceCode: string) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    processBlackMove(from, to, pieceCode);
  }, [promotionPending, processBlackMove]);

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

  const turnText = game ? (game.turn() === 'b' ? 'Ваш ход (чёрные)' : 'Белые ходят...') : '';

  const hintText = exercise === 1
    ? (blackMoves === 0 ? 'Сыграйте e7-e5 — захватите центр пешкой.' :
       blackMoves === 1 ? 'Конь выходит на c6 — ближе к центру и защищает пешку e5.' :
       blackMoves === 2 ? 'Сыграйте слоном с f8 на c5 — так начинается итальянская партия.' :
       blackMoves === 3 ? 'Сыграйте пешкой d7-d6 — откройте дорогу слону c8.' :
       blackMoves === 4 ? 'Развейте второго коня, переместив его с g8 на f6.' :
       blackMoves === 5 ? 'Сыграйте слоном с c8 на g4 — свяжите коня f3.' :
       blackMoves === 6 ? 'Сделайте рокировку — уберите короля в безопасность.' :
       '')
    : exercise === 3
    ? (blackMoves === 0 ? 'Используйте дырокол, чтобы разрушить защиту короля соперника.' :
       blackMoves === 1 ? 'Конь выходит на c6 — ближе к центру и защищает пешку e5.' :
       blackMoves === 2 ? 'Сыграйте слоном с f8 на c5 — так начинается итальянская партия.' :
       blackMoves === 3 ? 'Сыграйте пешкой d7-d6 — откройте дорогу слону c8.' :
       blackMoves === 4 ? 'Развейте второго коня, переместив его с g8 на f6.' :
       blackMoves === 5 ? 'Сыграйте слоном с c8 на g4 — свяжите коня f3.' :
       blackMoves === 6 ? 'Конь идёт на d4 и нападает на белого коня f3.' :
       blackMoves === 7 ? 'Конь забирает белого коня на f3.' :
       blackMoves === 8 ? 'Слон идёт на h3 и нападает на ладью.' :
       blackMoves === 9 ? 'Пешка g7 забирает коня на f6.' :
       blackMoves === 10 ? 'Пешка с f6 идёт на f5. Жертва!' :
       blackMoves === 11 ? 'Ладья идёт на g8 — шах!' :
       blackMoves === 12 ? 'Слон идёт на g2 — шах!' :
       blackMoves === 13 ? 'Слон забирает пешку на f3 — вскрытый шах!' :
       blackMoves === 14 ? 'Ладья забирает слона на g5 — мат! Дырокол выполнен!' :
       'Смотрите, как завершается партия.')
    : exercise === 5
    ? (blackMoves === 0 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' :
       blackMoves === 1 ? 'Конь выходит на c6 — ближе к центру и защищает пешку e5.' :
       blackMoves === 2 ? 'Сыграйте слоном с f8 на c5 — так начинается итальянская партия.' :
       blackMoves === 3 ? 'Сыграйте пешкой d7-d6 — откройте дорогу слону c8.' :
       blackMoves === 4 ? 'Развейте второго коня, переместив его с g8 на f6.' :
       blackMoves === 5 ? 'Пешка h6 — не даём слону чёрных выйти на g5.' :
       blackMoves === 6 ? 'Пешка g5 — начинаем пешечный штурм!' :
       blackMoves === 7 ? 'Пешка g4 — продолжаем штурм!' :
       blackMoves === 8 ? 'Пешка g3 — идём вперёд!' :
       blackMoves === 9 ? 'Слон забирает пешку на f2.' :
       blackMoves === 10 ? 'Конь с f6 на g4 — подключаем коня к атаке.' :
       blackMoves === 11 ? 'Конь идёт на h2.' :
       blackMoves === 12 ? 'Ферзь забирает пешку на h4 — готовим удар!' :
       blackMoves === 13 ? 'Слон забирает коня на g3.' :
       blackMoves === 14 ? 'Ферзь бьёт коня на h2 — мат! Пешечный штурм выполнен!' :
       'Смотрите, как завершается партия.')
    : '';

  const earnedStars = exerciseStars[exercise] || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[500px]">
      {/* LEFT COLUMN */}
      <div className="hidden lg:flex w-full lg:w-[300px] flex-shrink-0 flex-col gap-2">
        <button
          onClick={handleHint}
          className={`hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs border rounded transition w-full justify-center ${hintVisible ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'text-[var(--text-secondary)] border-[rgba(92,64,51,0.12)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}
        >
          <Eye size={14} /> Подсказка
        </button>
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
              {exercise === 6 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' : exercise === 4 ? 'Используйте дырокол, чтобы разрушить рокировку соперника.' : exercise === 1 || exercise === 3 || exercise === 5 ? hintText : postMoveHint || 'Повторите партию за чёрных!'}
            </p>
          </AvatarBubble>
        </div>

        {/* Desktop hint banner */}
        <div className="hidden lg:block px-6 py-3 rounded-xl text-center font-bold text-white bg-[#C9A84C] mb-2 w-full">
          {exercise === 6 ? 'Пешечный штурм — захватите центр, выведите коней и слонов и атакуйте рокировку соперника!' : exercise === 4 ? 'Используйте дырокол, чтобы разрушить рокировку соперника.' : exercise === 1 || exercise === 3 || exercise === 5 ? hintText : postMoveHint || 'Повторите партию за чёрных!'}
        </div>

        {/* Board */}
        <div className="flex justify-center w-full relative" style={{ minHeight: 8 * sqSize }}>
          <div className="relative" style={{ width: 8 * sqSize + 6, height: 8 * sqSize + 6 }}>
            <UniversalChessBoardDesigner
              fen={game?.fen() || ''}
              selectedSquare={selectedSquare}
              lastMove={lastMove}
              autoValidMoves={true}
              onMove={async (from, to, _promotion) => { await processBlackMove(from, to, undefined, true); }}
              onSquareClick={handleSquareClick}
              playerAnimatingMove={playerAnimatingMove}
              playerAnimatingMoves={playerAnimatingMoves}
              opponentAnimatingMove={opponentAnimatingMove}
              opponentAnimatingMoves={opponentAnimatingMoves}
              interactive={!isComplete && !isFail}
              disableAutoGhost={true}
              isReversed={true}
              sqSize={sqSize}
              absoluteOverlay={
                promotionPending ? (
                  <div className="absolute z-50 pointer-events-auto" style={{
                    left: `${FILES.indexOf(promotionPending.to[0]) * sqSize}px`,
                    top: promotionPending.from[1] === '2' ? 4 * sqSize : 0,
                    width: sqSize,
                    height: 4 * sqSize,
                    backgroundColor: '#2C241B',
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
                        onClick={() => handlePromotion(code)}
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
                ) : null
              }
            />
            {/* Hint arrows SVG overlay */}
            {hintVisible && !isFail && !isComplete && !selectedSquare && (
              (() => {
                const arrows = HINTS[exercise] || [];
                const phaseArrows = arrows.filter(a => a.phase === blackMoves);
                if (phaseArrows.length === 0) return null;
                return (
                  <svg className="absolute pointer-events-none z-[35]" style={{ top: 3, left: 3, width: 8 * sqSize, height: 8 * sqSize }} viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}>
                    {phaseArrows.map((arrow, i) => {
                      const fromF = FILES.indexOf(arrow.from[0]);
                      const fromR = 7 - RANKS.indexOf(arrow.from[1]);
                      const toF = FILES.indexOf(arrow.to[0]);
                      const toR = 7 - RANKS.indexOf(arrow.to[1]);
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
                onClick={() => { if (!isCurrent) switchExercise(num as 1 | 2 | 3 | 4 | 5 | 6); }}
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
