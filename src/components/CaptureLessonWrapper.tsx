'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';

import CaptureBoard from './CaptureBoard';

function MassiveStar({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FFFFFF' : 'none'} stroke={filled ? 'none' : '#9CA3AF'} strokeWidth="2">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  );
}

interface Props {
  lesson: any;
  allLessons?: any[];
  courseId?: string;
  levels: any[];
  onAllComplete?: () => void;
  onLevelComplete?: (level: number, stars: number) => void;
}

export default function CaptureLessonWrapper({
  lesson,
  allLessons,
  courseId,
  levels,
  onAllComplete,
  onLevelComplete,
}: Props) {
  // DEBUG: Verify component loaded in production
  console.log('CaptureLessonWrapper LOADED');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [hintArrows, setHintArrows] = useState<{ from: string; to: string }[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(() => {
    // SSR-safe: initialize synchronously with the initial level's FEN
    return levels[0]?.initialFen || '';
  });

  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(352);

  const savedKey = `lesson_capture_${lesson.id}`;

// Simple FEN parse (placement only)
function parseFenSimple(fen: string) {
  const squares: Record<string, { type: string; color: 'w' | 'b' }> = {};
  const parts = fen.split(' ');
  const placement = parts[0];
  const rows = placement.split('/');
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['8','7','6','5','4','3','2','1'];
  for (let ri = 0; ri < 8; ri++) {
    let fi = 0;
    for (const ch of rows[ri]) {
      if (ch >= '1' && ch <= '8') {
        fi += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase();
        squares[`${files[fi]}${ranks[ri]}`] = { type, color };
        fi++;
      }
    }
  }
  return squares;
}

  // Load progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.levelStars) setLevelStars(data.levelStars);
        if (typeof data.currentLevel === 'number') {
          setCurrentLevel(data.currentLevel);
          setCurrentPosition(levels[data.currentLevel]?.initialFen || levels[0].initialFen || '');
        }
      }
    } catch {}
  }, [savedKey]);

  // Save progress
  useEffect(() => {
    localStorage.setItem(savedKey, JSON.stringify({
      levelStars,
      currentLevel,
    }));
  }, [levelStars, currentLevel, savedKey]);

  // Initialize position on mount
  useEffect(() => {
    const initialPos = levels[currentLevel]?.initialFen || levels[0].initialFen || '';
    setCurrentPosition(initialPos);
  }, [levels, currentLevel]);

  const handleLevelComplete = (levelIndex: number, stars: number) => {
    setLevelStars(prev => ({ ...prev, [levelIndex]: stars }));
    onLevelComplete?.(levelIndex, stars);
  };

  const handleAllComplete = () => {
    onAllComplete?.();
  };

  const goToLevel = (idx: number) => {
    if (idx < 0 || idx >= levels.length) return;
    setCurrentLevel(idx);
    setShowHint(false);
    setHintArrows([]);
    setCurrentPosition(levels[idx]?.initialFen || '');
  };

  // ====== SAFE CAPTURE HINT ======
  // Find arrow to a target where, after capture, no black can capture any white.
  const FILES = ['a','b','c','d','e','f','g','h'];
  const RANKS = ['8','7','6','5','4','3','2','1'];

  function parseFenBoard(fen: string) {
    const squares: Record<string, { type: string; color: 'w' | 'b' }> = {};
    const rows = fen.split(' ')[0].split('/');
    for (let ri = 0; ri < 8; ri++) {
      let fi = 0;
      for (const ch of rows[ri]) {
        if (ch >= '1' && ch <= '8') fi += parseInt(ch);
        else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          squares[`${FILES[fi]}${RANKS[ri]}`] = { type: ch.toLowerCase(), color };
          fi++;
        }
      }
    }
    return squares;
  }

  function canMove(pieceType: string, from: string, to: string, squares: Record<string, any>, color: 'w' | 'b', ignoreTargetColor?: boolean) {
    if (squares[from]?.color !== color) return false;
    if (!ignoreTargetColor && squares[to]?.color === color) return false;
    if (from === to) return false;
    const ff = FILES.indexOf(from[0]), tf = FILES.indexOf(to[0]);
    const fr = RANKS.indexOf(from[1]), tr = RANKS.indexOf(to[1]);
    const df = tf - ff, dr = tr - fr, adf = Math.abs(df), adr = Math.abs(dr);

    let blocked = (stepF: number, stepR: number, count: number) => {
      for (let i = 1; i < count; i++)
        if (squares[`${FILES[ff + stepF * i]}${RANKS[fr + stepR * i]}`]) return true;
      return false;
    };

    switch (pieceType) {
      case 'r': {
        if (ff !== tf && fr !== tr) return false;
        if (ff === tf) {
          const step = tr > fr ? 1 : -1;
          for (let r = fr + step; r !== tr; r += step)
            if (squares[`${FILES[ff]}${RANKS[r]}`]) return false;
        } else {
          const step = tf > ff ? 1 : -1;
          for (let f = ff + step; f !== tf; f += step)
            if (squares[`${FILES[f]}${RANKS[fr]}`]) return false;
        }
        return true;
      }
      case 'b': {
        if (adf !== adr) return false;
        const stepF = df > 0 ? 1 : -1, stepR = dr > 0 ? 1 : -1;
        for (let i = 1; i < adf; i++)
          if (squares[`${FILES[ff + stepF * i]}${RANKS[fr + stepR * i]}`]) return false;
        return true;
      }
      case 'q': {
        if (ff === tf || fr === tr || adf === adr) {
          let stepF = 0, stepR = 0;
          if (ff === tf) stepR = tr > fr ? 1 : -1;
          else if (fr === tr) stepF = tf > ff ? 1 : -1;
          else { stepF = df > 0 ? 1 : -1; stepR = dr > 0 ? 1 : -1; }
          for (let f = ff + stepF, r = fr + stepR; f !== tf || r !== tr; f += stepF, r += stepR)
            if (squares[`${FILES[f]}${RANKS[r]}`]) return false;
          return true;
        }
        return false;
      }
      case 'n': return (adf === 2 && adr === 1) || (adf === 1 && adr === 2);
      case 'k': return adf <= 1 && adr <= 1;
      case 'p': {
        const dir = color === 'w' ? -1 : 1;
        const startRank = color === 'w' ? '2' : '7';
        // Forward 1
        if (tf === ff && tr === fr + dir && !squares[to]) return true;
        // Forward 2 from start
        if (tf === ff && tr === fr + 2 * dir && from[1] === startRank && !squares[to]) {
          const middleSq = `${FILES[ff]}${RANKS[fr + dir]}`;
          if (!squares[middleSq]) return true;
        }
        // Diagonal capture
        if (Math.abs(tf - ff) === 1 && tr === fr + dir && squares[to]?.color !== color && squares[to]) return true;
        return false;
      }
    }
    return false;
  }

  function attacksSquare(pieceType: string, from: string, to: string, squares: Record<string, any>, color: 'w' | 'b') {
    // For pawns: diagonal forward is always an attack, regardless of occupancy
    if (pieceType === 'p') {
      const ff = FILES.indexOf(from[0]), tf = FILES.indexOf(to[0]);
      const fr = RANKS.indexOf(from[1]), tr = RANKS.indexOf(to[1]);
      const dir = color === 'w' ? -1 : 1;
      return Math.abs(tf - ff) === 1 && tr === fr + dir;
    }
    return canMove(pieceType, from, to, squares, color, true);
  }

  function anyBlackCanCaptureWhite(squares: Record<string, any>) {
    const blacks = Object.keys(squares).filter(s => squares[s]?.color === 'b');
    const whites = Object.keys(squares).filter(s => squares[s]?.color === 'w');
    for (const b of blacks) {
      for (const w of whites) {
        if (canMove(squares[b].type, b, w, squares, 'b')) return true;
      }
    }
    return false;
  }

  function isDefended(squares: Record<string, any>, sq: string, color: 'w' | 'b') {
    for (const s in squares) {
      if (s === sq) continue;
      const p = squares[s];
      if (p.color !== color) continue;
      if (attacksSquare(p.type, s, sq, squares, color)) return true;
    }
    return false;
  }

  function isKingInCheck(squares: Record<string, any>, kingColor: 'w' | 'b') {
    let kingSq = '';
    for (const s in squares) {
      if (squares[s]?.type === 'k' && squares[s]?.color === kingColor) {
        kingSq = s;
        break;
      }
    }
    if (!kingSq) return false;
    const enemyColor = kingColor === 'w' ? 'b' : 'w';
    for (const s in squares) {
      const p = squares[s];
      if (p.color !== enemyColor) continue;
      if (attacksSquare(p.type, s, kingSq, squares, enemyColor)) return true;
    }
    return false;
  }

  function canEnemyCapture(squares: Record<string, any>, sq: string, enemyColor: 'w' | 'b') {
    for (const s in squares) {
      const p = squares[s];
      if (p.color !== enemyColor) continue;
      if (attacksSquare(p.type, s, sq, squares, enemyColor)) return true;
    }
    return false;
  }

  const computeHintArrow = () => {
    // HINT_ALGORITHM_V6_BFS + DEFENSE_MODE + ESCAPE_CHECK_MODE + MATE_MODE + CHECK_IN_TWO_MODE
    console.log('HINT_V6_ACTIVE_MARKER');
    const level = levels[currentLevel];
    if (!level) { console.log('HINT: no level'); return []; }
    const fen = currentPosition || level.initialFen || '';
    if (!fen) { console.log('HINT: no fen'); return []; }

    console.log('HINT: level', {
      currentLevel,
      requireCheck: level.requireCheck,
      checkOnMove: level.checkOnMove,
      requireStalemate: level.requireStalemate,
      requireMate: level.requireMate,
      fen,
      initialFen: level.initialFen,
    });

    const initialSquares = parseFenBoard(fen);
    const allTargets = level.stars || level.targets || [];

    // ── EN PASSANT HINT: auto-detect from any FEN with enPassant field ──
    const parts = fen.split(' ');
    const enPassant = parts.length > 3 && parts[3] !== '-' ? parts[3] : null;
    if (enPassant) {
      const epFile = enPassant[0];
      const epRank = parseInt(enPassant[1]);
      const fromRank = `${epRank - 1}`;
      const leftFile = FILES[FILES.indexOf(epFile) - 1];
      const rightFile = FILES[FILES.indexOf(epFile) + 1];
      const candidates: string[] = [];
      if (leftFile) candidates.push(`${leftFile}${fromRank}`);
      if (rightFile) candidates.push(`${rightFile}${fromRank}`);
      console.log('EP debug:', { lessonId: lesson.id, level: currentLevel, fen, enPassant, candidates, initialSquares });
      for (const sq of candidates) {
        const p = initialSquares[sq];
        if (p?.type === 'p' && p?.color === 'w') {
          console.log('EP arrow found:', { from: sq, to: enPassant });
          return [{ from: sq, to: enPassant }];
        }
      }
    }

    // ── ESCAPE CHECK MODE: white king is in check — find best defense (Lesson 10 priority)
    if (level.requireEscapeCheck || isKingInCheck(initialSquares, 'w')) {
      // Find white king
      let whiteKingSq = '';
      for (const s in initialSquares) {
        if (initialSquares[s]?.type === 'k' && initialSquares[s]?.color === 'w') {
          whiteKingSq = s;
          break;
        }
      }
      if (!whiteKingSq) return [];

      // Find attackers of the white king
      const attackers: string[] = [];
      for (const s in initialSquares) {
        const p = initialSquares[s];
        if (p.color !== 'b') continue;
        if (attacksSquare(p.type, s, whiteKingSq, initialSquares, 'b')) attackers.push(s);
      }
      if (attackers.length === 0) return []; // not actually in check

      const whiteSquares = Object.keys(initialSquares).filter(s => initialSquares[s]?.color === 'w');
      const validDefenses: { from: string; to: string; score: number }[] = [];

      for (const wSq of whiteSquares) {
        const piece = initialSquares[wSq];
        for (const file of FILES) {
          for (const rank of RANKS) {
            const target = file + rank;
            if (wSq === target) continue;
            if (initialSquares[target]?.color === 'w') continue;
            if (!canMove(piece.type, wSq, target, initialSquares, 'w')) continue;
            if (level.forbiddenSquares?.includes(target)) continue;

            // Simulate move
            const nextSquares = { ...initialSquares };
            nextSquares[target] = nextSquares[wSq];
            delete nextSquares[wSq];

            // After the move, is white king still in check?
            if (isKingInCheck(nextSquares, 'w')) continue;

            let score = 0;
            // Priority 1: capture the attacker (NxN, KxR, etc.)
            if (attackers.includes(target)) score += 1000;
            // Priority 2: king move to safety
            if (piece.type === 'k') score += 500;
            // Priority 3: block the attack (piece moves between king and attacker)
            // Only relevant for sliding attackers
            if (attackers.length === 1 && piece.type !== 'k') {
              const attackerSq = attackers[0];
              const atkFile = FILES.indexOf(attackerSq[0]);
              const atkRank = RANKS.indexOf(attackerSq[1]);
              const kingFile = FILES.indexOf(whiteKingSq[0]);
              const kingRank = RANKS.indexOf(whiteKingSq[1]);
              const targetFile = FILES.indexOf(target[0]);
              const targetRank = RANKS.indexOf(target[1]);
              // Same line?
              const sameLine = (kingFile === atkFile && kingFile === targetFile) ||
                               (kingRank === atkRank && kingRank === targetRank) ||
                               (Math.abs(kingFile - atkFile) === Math.abs(kingRank - atkRank) &&
                                Math.abs(kingFile - targetFile) === Math.abs(kingRank - targetRank) &&
                                Math.abs(atkFile - targetFile) === Math.abs(atkRank - targetRank));
              if (sameLine) {
                // Is target between king and attacker?
                const minFile = Math.min(kingFile, atkFile);
                const maxFile = Math.max(kingFile, atkFile);
                const minRank = Math.min(kingRank, atkRank);
                const maxRank = Math.max(kingRank, atkRank);
                if (targetFile > minFile && targetFile < maxFile && targetRank > minRank && targetRank < maxRank) {
                  score += 200;
                }
              }
            }

            validDefenses.push({ from: wSq, to: target, score });
          }
        }
      }

      // Sort by score descending, return best
      validDefenses.sort((a, b) => b.score - a.score);
      if (validDefenses.length > 0) {
        return [{ from: validDefenses[0].from, to: validDefenses[0].to }];
      }
      return [];
    }

    // ── MATE_MODE: requireMate = true (Lesson 11 — deliver checkmate)
    if (level.requireMate) {
      // Find black king
      let blackKingSq = '';
      for (const s in initialSquares) {
        if (initialSquares[s]?.type === 'k' && initialSquares[s]?.color === 'b') {
          blackKingSq = s;
          break;
        }
      }
      if (!blackKingSq) return [];

      const targetSquares = allTargets.length > 0 ? allTargets : [];
      const whiteSquares = Object.keys(initialSquares).filter(s => initialSquares[s]?.color === 'w');

      for (const wSq of whiteSquares) {
        const piece = initialSquares[wSq];
        for (const file of FILES) {
          for (const rank of RANKS) {
            const target = file + rank;
            if (wSq === target) continue;
            if (initialSquares[target]?.color === 'w') continue;
            if (!canMove(piece.type, wSq, target, initialSquares, 'w')) continue;
            if (level.forbiddenSquares?.includes(target)) continue;

            // If targets are specified, only consider moves to target squares
            if (targetSquares.length > 0 && !targetSquares.includes(target)) continue;

            // Simulate white move
            const nextSquares = { ...initialSquares };
            nextSquares[target] = nextSquares[wSq];
            delete nextSquares[wSq];

            // Is black king in check?
            if (!isKingInCheck(nextSquares, 'b')) continue;

            // Try ALL black moves — if ANY gets out of check, it's NOT mate
            let isMate = true;
            const blackSquares = Object.keys(nextSquares).filter(s => nextSquares[s]?.color === 'b');
            for (const bSq of blackSquares) {
              const bPiece = nextSquares[bSq];
              for (const bFile of FILES) {
                for (const bRank of RANKS) {
                  const bTo = bFile + bRank;
                  if (bSq === bTo) continue;
                  if (nextSquares[bTo]?.color === 'b') continue;
                  if (!canMove(bPiece.type, bSq, bTo, nextSquares, 'b')) continue;

                  const afterBlack = { ...nextSquares };
                  afterBlack[bTo] = afterBlack[bSq];
                  delete afterBlack[bSq];

                  if (!isKingInCheck(afterBlack, 'b')) {
                    isMate = false;
                    break;
                  }
                }
                if (!isMate) break;
              }
              if (!isMate) break;
            }

            if (isMate) {
              return [{ from: wSq, to: target }];
            }
          }
        }
      }
      return [];
    }

    // ── CHECK_IN_TWO_MODE: requireCheck + checkOnMove = 2 (Lesson 16 — check in two moves)
    // Only run on the initial position; after first move, fall through to CHECK_MODE
    const isInitialPosition = fen.split(' ')[0] === (level.initialFen || '').split(' ')[0];
    if (level.requireCheck && level.checkOnMove === 2 && isInitialPosition) {
      // Find black king
      let blackKingSq = '';
      for (const s in initialSquares) {
        if (initialSquares[s]?.type === 'k' && initialSquares[s]?.color === 'b') {
          blackKingSq = s;
          break;
        }
      }
      if (!blackKingSq) return [];

      const whiteSquares = Object.keys(initialSquares).filter(s => initialSquares[s]?.color === 'w');

      for (const wSq of whiteSquares) {
        const piece = initialSquares[wSq];
        for (const file of FILES) {
          for (const rank of RANKS) {
            const target = file + rank;
            if (wSq === target) continue;
            if (initialSquares[target]?.color === 'w') continue;
            if (!canMove(piece.type, wSq, target, initialSquares, 'w')) continue;
            if (level.forbiddenSquares?.includes(target)) continue;

            // Simulate first white move
            const afterFirst = { ...initialSquares };
            afterFirst[target] = afterFirst[wSq];
            delete afterFirst[wSq];

            // Check: no undefended white piece is capturable by black after first move
            let safeAfterFirst = true;
            for (const s in afterFirst) {
              const p = afterFirst[s];
              if (p?.color !== 'w') continue;
              if (canEnemyCapture(afterFirst, s, 'b') && !isDefended(afterFirst, s, 'w')) {
                safeAfterFirst = false;
                console.log('CHECK_IN_TWO: rejecting first move', wSq, '->', target, 'because', s, 'is undefended and capturable');
                break;
              }
            }
            // TEMPORARILY DISABLE safeAfterFirst to see if algorithm finds correct moves
            // if (!safeAfterFirst) continue;

            // Now check if white can give check on the next move
            const whiteSquares2 = Object.keys(afterFirst).filter(s => afterFirst[s]?.color === 'w');
            let canGiveCheckNext = false;
            for (const wSq2 of whiteSquares2) {
              const piece2 = afterFirst[wSq2];
              for (const file2 of FILES) {
                for (const rank2 of RANKS) {
                  const target2 = file2 + rank2;
                  if (wSq2 === target2) continue;
                  if (afterFirst[target2]?.color === 'w') continue;
                  if (!canMove(piece2.type, wSq2, target2, afterFirst, 'w')) continue;

                  const afterSecond = { ...afterFirst };
                  afterSecond[target2] = afterSecond[wSq2];
                  delete afterSecond[wSq2];

                  // Does ANY white piece attack the black king after second move?
                  for (const s in afterSecond) {
                    const p = afterSecond[s];
                    if (p?.color !== 'w') continue;
                    if (attacksSquare(p.type, s, blackKingSq, afterSecond, 'w')) {
                      canGiveCheckNext = true;
                      break;
                    }
                  }
                  if (canGiveCheckNext) break;
                }
                if (canGiveCheckNext) break;
              }
              if (canGiveCheckNext) break;
            }

            if (canGiveCheckNext) {
              // Safety: reject if moved piece is immediately capturable and undefended
              let moveIsSafe = true;
              if (canEnemyCapture(afterFirst, target, 'b') && !isDefended(afterFirst, target, 'w')) {
                moveIsSafe = false;
              }
              if (moveIsSafe) {
                console.log('CHECK_IN_TWO: first move found:', { from: wSq, to: target, piece: piece.type });
                return [{ from: wSq, to: target }];
              }
            }
          }
        }
      }
      return [];
    }

    // ── CHECK_MODE: requireCheck = true (Lesson 9 style — give check to black king)
    if (level.requireCheck) {
      // Find black king
      let blackKingSq = '';
      for (const s in initialSquares) {
        if (initialSquares[s]?.type === 'k' && initialSquares[s]?.color === 'b') {
          blackKingSq = s;
          break;
        }
      }
      if (blackKingSq) {
        const whiteSquares = Object.keys(initialSquares).filter(s => initialSquares[s]?.color === 'w');
        for (const wSq of whiteSquares) {
          const piece = initialSquares[wSq];
          // Try all empty squares as destinations
          for (const file of FILES) {
            for (const rank of RANKS) {
              const target = file + rank;
              if (initialSquares[target]?.color === 'w') continue; // can't move to own piece
              if (!canMove(piece.type, wSq, target, initialSquares, 'w')) continue;
              if (level.forbiddenSquares?.includes(target)) continue;

              // Simulate move
              const nextSquares = { ...initialSquares };
              nextSquares[target] = nextSquares[wSq];
              delete nextSquares[wSq];

              // Does ANY white piece attack the black king after this move?
              let givesCheck = false;
              for (const s in nextSquares) {
                const p = nextSquares[s];
                if (p.color !== 'w') continue;
                if (attacksSquare(p.type, s, blackKingSq, nextSquares, 'w')) {
                  givesCheck = true;
                  break;
                }
              }
              if (givesCheck) {
                // Safety: reject if moved piece is immediately capturable and undefended
                let moveIsSafe = true;
                if (canEnemyCapture(nextSquares, target, 'b') && !isDefended(nextSquares, target, 'w')) {
                  moveIsSafe = false;
                }
                if (moveIsSafe) {
                  return [{ from: wSq, to: target }];
                }
              }
            }
          }
        }
      }
      return [];
    }

    // ── STALEMATE MODE: requireStalemate = true (Lesson 15 — deliver stalemate)
    if (level.requireStalemate) {
      // Find black king
      let blackKingSq = '';
      for (const s in initialSquares) {
        if (initialSquares[s]?.type === 'k' && initialSquares[s]?.color === 'b') {
          blackKingSq = s;
          break;
        }
      }
      if (!blackKingSq) return [];

      const whiteSquares = Object.keys(initialSquares).filter(s => initialSquares[s]?.color === 'w');

      for (const wSq of whiteSquares) {
        const piece = initialSquares[wSq];
        for (const file of FILES) {
          for (const rank of RANKS) {
            const target = file + rank;
            if (wSq === target) continue;
            if (initialSquares[target]?.color === 'w') continue;
            if (!canMove(piece.type, wSq, target, initialSquares, 'w')) continue;
            if (level.forbiddenSquares?.includes(target)) continue;

            // Simulate white move
            const nextSquares = { ...initialSquares };
            nextSquares[target] = nextSquares[wSq];
            delete nextSquares[wSq];

            // Is black king in check? If yes, it's NOT stalemate
            if (isKingInCheck(nextSquares, 'b')) continue;

            // Try ALL black moves — if ANY is legal, it's NOT stalemate
            let isStalemate = true;
            const blackSquares = Object.keys(nextSquares).filter(s => nextSquares[s]?.color === 'b');
            for (const bSq of blackSquares) {
              const bPiece = nextSquares[bSq];
              for (const bFile of FILES) {
                for (const bRank of RANKS) {
                  const bTo = bFile + bRank;
                  if (bSq === bTo) continue;
                  if (nextSquares[bTo]?.color === 'b') continue;
                  if (!canMove(bPiece.type, bSq, bTo, nextSquares, 'b')) continue;

                  const afterBlack = { ...nextSquares };
                  afterBlack[bTo] = afterBlack[bSq];
                  delete afterBlack[bSq];

                  // Is black king in check after this move?
                  if (!isKingInCheck(afterBlack, 'b')) {
                    isStalemate = false;
                    break;
                  }
                }
                if (!isStalemate) break;
              }
              if (!isStalemate) break;
            }

            if (isStalemate) {
              return [{ from: wSq, to: target }];
            }
          }
        }
      }
      return [];
    }

    // ── CAPTURE MODE: targets are black pieces (Lesson 7 style)
    const blackTargets = allTargets.filter((t: string) => initialSquares[t]?.color === 'b');
    if (blackTargets.length > 0) {
      const queue: { squares: Record<string, any>; depth: number; firstMove: { from: string; to: string } | null }[] = [];
      queue.push({ squares: initialSquares, depth: 0, firstMove: null });

      const visited = new Set<string>();
      visited.add(JSON.stringify(initialSquares));

      while (queue.length > 0) {
        const state = queue.shift()!;

        const whiteSquares = Object.keys(state.squares).filter(s => state.squares[s]?.color === 'w');
        for (const wSq of whiteSquares) {
          const piece = state.squares[wSq];
          for (const target of blackTargets) {
            if (!canMove(piece.type, wSq, target, state.squares, 'w')) continue;

            const nextSquares = { ...state.squares };
            nextSquares[target] = nextSquares[wSq];
            delete nextSquares[wSq];

            if (!anyBlackCanCaptureWhite(nextSquares)) {
              const moveToShow = state.firstMove || { from: wSq, to: target };
              return [moveToShow];
            }
          }
        }

        if (state.depth < 3) {
          for (const wSq of whiteSquares) {
            const piece = state.squares[wSq];
            for (const file of FILES) {
              for (const rank of RANKS) {
                const to = file + rank;
                if (to === wSq) continue;
                if (state.squares[to]) continue;
                if (!canMove(piece.type, wSq, to, state.squares, 'w')) continue;

                const nextSquares = { ...state.squares };
                nextSquares[to] = nextSquares[wSq];
                delete nextSquares[wSq];

                if (anyBlackCanCaptureWhite(nextSquares)) continue;

                const key = JSON.stringify(nextSquares);
                if (visited.has(key)) continue;
                visited.add(key);

                const firstMove = state.firstMove || { from: wSq, to };
                queue.push({ squares: nextSquares, depth: state.depth + 1, firstMove });
              }
            }
          }
        }
      }
      return [];
    }

    // ── DEFENSE MODE: targets are empty squares (Lesson 8 style)
    const defenseTargets = allTargets.filter((t: string) => !initialSquares[t]);
    if (defenseTargets.length > 0) {
      const whiteSquares = Object.keys(initialSquares).filter(s => initialSquares[s]?.color === 'w');
      for (const wSq of whiteSquares) {
        const piece = initialSquares[wSq];
        for (const target of defenseTargets) {
          if (!canMove(piece.type, wSq, target, initialSquares, 'w')) continue;
          if (level.forbiddenSquares?.includes(target)) continue;

          // Simulate the move and verify the moved piece stays safe
          const nextSquares = { ...initialSquares };
          nextSquares[target] = nextSquares[wSq];
          delete nextSquares[wSq];

          // After moving, check if any white piece is capturable by black
          let moveIsSafe = true;
          for (const s in nextSquares) {
            if (nextSquares[s]?.color !== 'w') continue;
            if (canEnemyCapture(nextSquares, s, 'b')) {
              // If the piece we just moved is now capturable and undefended, reject
              if (s === target && !isDefended(nextSquares, target, 'w')) {
                moveIsSafe = false;
                break;
              }
            }
          }

          if (!moveIsSafe) continue;
          return [{ from: wSq, to: target }];
        }
      }
    }

    return [];
  };

  // DEBUG: force inclusion in bundle
  if (typeof window !== 'undefined') {
    (window as any).computeHintArrow = computeHintArrow;
  }

  const level = levels[currentLevel];
  const totalLevels = levels.length;
  const earned = levelStars[currentLevel];

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-4">
      {/* ── Header: avatar + speech bubble ── */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 flex-shrink-0">
          <img
            src="/coach-avatar.png"
            alt="Тренер"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
        <div className="flex-1 bg-white rounded-xl rounded-tl-none px-4 py-3 shadow-sm border border-[rgba(92,64,51,0.06)]">
          <p className="text-sm text-[var(--text-primary)] leading-snug">
            {level?.instructions || lesson?.content || 'Выполните задание'}
          </p>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex justify-center w-full">
        <div className="relative inline-block rounded-sm">
          <CaptureBoard
            key={String(resetKey)}
            lessonId={lesson.id}
            levels={levels}
            successMessage="Молодец!"
            onAllComplete={handleAllComplete}
            onLevelComplete={handleLevelComplete}
            embedded={true}
            externalCurrentLevel={currentLevel}
            onExternalLevelChange={setCurrentLevel}
            externalLevelStars={levelStars}
            onExternalStarsChange={setLevelStars}
            hintArrows={hintArrows}
            onAnyMove={() => {
              setHintArrows([]);
              setShowHint(false);
              // DO NOT reset currentPosition here — onPositionChange handles it
            }}
            onPositionChange={setCurrentPosition}
          />
        </div>
      </div>

      {/* ── Level Pills (like lesson 5) ── */}
      <div className="w-full">
        <div className="w-full flex items-stretch gap-[1px]">
          {levels.map((_l: any, i: number) => {
            const earnedI = levelStars[i];
            const starCountI = typeof earnedI === 'number' ? earnedI : (earnedI ? 1 : 0);
            const isCurrent = i === currentLevel;
            const isDone = earnedI != null;
            const isFuture = !isCurrent && !isDone && i > currentLevel;
            return (
              <button
                key={i}
                onClick={() => {
                  if (isCurrent) return;
                  goToLevel(i);
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
                {isDone && starCountI > 0 ? (
                  starCountI === 3 ? (
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
                      {Array.from({ length: starCountI }, (_, s) => (
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
      </div>

      {/* ── Progress: "Задание X из Y" + bar ── */}
      <div className="w-full flex flex-col gap-2">
        <span className="text-xs font-bold text-[var(--text-primary)]">
          Задание {currentLevel + 1} из {totalLevels}
        </span>
        <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
            style={{ width: `${((currentLevel + 1) / totalLevels) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Buttons: Hint + Reset ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            console.log('HINT BUTTON CLICKED, current hintArrows:', hintArrows);
            if (hintArrows.length === 0) {
              const arrows = computeHintArrow();
              console.log('COMPUTED ARROWS:', arrows);
              setHintArrows(arrows);
              setShowHint(true);
            } else {
              setHintArrows([]);
              setShowHint(false);
            }
          }}
          className={`flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-all duration-200 ${showHint ? 'border-[#c9a84c]/40 text-[#8a6a3a] bg-[#c9a84c]/10' : 'border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]'}`}
        >
          <Lightbulb size={14} /> Подсказка
        </button>
        <button
          onClick={() => {
            setResetKey((prev) => prev + 1);
            goToLevel(currentLevel);
          }}
          className="flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-all duration-200 border-[rgba(92,64,51,0.12)] text-[var(--text-secondary)] hover:bg-[rgba(92,64,51,0.04)] hover:border-[rgba(92,64,51,0.2)]"
        >
          <RotateCcw size={14} /> Заново
        </button>
      </div>

    </div>
  );
}
