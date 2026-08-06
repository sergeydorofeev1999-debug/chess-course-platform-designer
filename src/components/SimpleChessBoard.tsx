'use client';

import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import UniversalChessBoardDesigner from './board/UniversalChessBoardDesigner';

interface Props {
  fen: string;
  stars?: string[];
  onMove?: (from: string, to: string) => boolean;
  onStarCollect?: (square: string) => void;
  highlightSquares?: string[];
}

export default function SimpleChessBoard({
  fen,
  stars = [],
  onMove,
  onStarCollect,
  highlightSquares = [],
}: Props) {
  const [game] = useState(() => new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [position, setPosition] = useState(fen);
  const [collectedStars, setCollectedStars] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<{
    from: string;
    to: string;
    piece: { type: string; color: 'w' | 'b' };
  } | null>(null);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (playerAnimatingMove) return; // Block during animation

      const piece = game.get(square as any);

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setMessage('');
          return;
        }
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          setMessage('');
          return;
        }

        // Board copy pattern: validate on copy, animate on original
        const ng = new Chess(game.fen());
        const moveResult = ng.move({ from: selectedSquare, to: square });

        if (moveResult) {
          const movingPiece = game.get(selectedSquare as any);
          if (movingPiece) {
            setPlayerAnimatingMove({
              from: selectedSquare,
              to: square,
              piece: { type: movingPiece.type.toUpperCase(), color: movingPiece.color as 'w' | 'b' },
            });

            setTimeout(() => {
              game.move({ from: selectedSquare, to: square });
              setPosition(game.fen());
              setPlayerAnimatingMove(null);
              setSelectedSquare(null);
              setMessage('');

              if (stars.includes(square) && !collectedStars.has(square)) {
                setCollectedStars((prev) => {
                  const next = new Set(prev);
                  next.add(square);
                  return next;
                });
                onStarCollect?.(square);
              }

              onMove?.(selectedSquare, square);
            }, 200);
            return;
          }
        }

        setSelectedSquare(null);
        setMessage('Недопустимый ход');
      } else {
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        }
      }
    },
    [selectedSquare, game, stars, collectedStars, onMove, onStarCollect, playerAnimatingMove]
  );

  const starOverlays = stars
    .filter((s) => !collectedStars.has(s))
    .map((s) => ({
      square: s,
      element: (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="animate-pulse">
            <svg viewBox="0 0 45 45" className="w-7 h-7 drop-shadow-lg">
              <defs>
                <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <path
                d="M22.5 2l5.5 14.5L43 18l-11.5 9 4 15-13-9.5-13 9.5 4-15L2 18l15-1.5z"
                fill="url(#starGrad)"
                stroke="#b45309"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ),
    }));

  return (
    <div className="flex flex-col items-center gap-4">
      <UniversalChessBoardDesigner
        fen={position}
        selectedSquare={selectedSquare}
        onSquareClick={handleSquareClick}
        playerAnimatingMove={playerAnimatingMove}
        customOverlays={starOverlays}
        interactive={!playerAnimatingMove}
      />
      {message && <p className="text-red-500 text-sm">{message}</p>}
    </div>
  );
}
