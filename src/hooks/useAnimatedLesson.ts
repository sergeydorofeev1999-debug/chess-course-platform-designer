import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';

interface AnimatingMove {
  from: string;
  to: string;
  piece: { type: string; color: 'w' | 'b' };
}

export function useAnimatedLesson() {
  const [playerAnimatingMove, setPlayerAnimatingMove] = useState<AnimatingMove | null>(null);
  const [opponentAnimatingMove, setOpponentAnimatingMove] = useState<AnimatingMove | null>(null);

  const animatePlayerMove = useCallback(
    (game: Chess, from: string, to: string, onComplete: () => void) => {
      const piece = game.get(from as any);
      if (!piece) {
        onComplete();
        return;
      }
      setPlayerAnimatingMove({
        from,
        to,
        piece: { type: piece.type.toUpperCase(), color: piece.color as 'w' | 'b' },
      });
      setTimeout(() => {
        onComplete();
        setPlayerAnimatingMove(null);
      }, 200);
    },
    []
  );

  const animateOpponentMove = useCallback(
    (
      game: Chess,
      from: string,
      to: string,
      delayMs: number = 600,
      onComplete?: () => void
    ) => {
      const piece = game.get(from as any);
      if (!piece) return;

      setTimeout(() => {
        setOpponentAnimatingMove({
          from,
          to,
          piece: { type: piece.type.toUpperCase(), color: 'b' },
        });

        setTimeout(() => {
          onComplete?.();
          setOpponentAnimatingMove(null);
        }, 200);
      }, delayMs);
    },
    []
  );

  return {
    playerAnimatingMove,
    opponentAnimatingMove,
    setPlayerAnimatingMove,
    setOpponentAnimatingMove,
    animatePlayerMove,
    animateOpponentMove,
  };
}
