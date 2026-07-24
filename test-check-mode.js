// Test script for check-in-two algorithm after first move
// Simulates the computeHintArrow logic for CHECK_MODE

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

function isValidMove(pieceType, from, to, squares, color) {
  const fromFile = FILES.indexOf(from[0]);
  const fromRank = RANKS.indexOf(from[1]);
  const toFile = FILES.indexOf(to[0]);
  const toRank = RANKS.indexOf(to[1]);
  const fileDist = Math.abs(toFile - fromFile);
  const rankDist = Math.abs(toRank - fromRank);

  switch (pieceType) {
    case 'r':
      if (fromFile !== toFile && fromRank !== toRank) return false;
      if (fromFile === toFile) {
        const step = toRank > fromRank ? 1 : -1;
        for (let r = fromRank + step; r !== toRank; r += step) {
          if (squares[`${FILES[fromFile]}${RANKS[r]}`]) return false;
        }
      } else {
        const step = toFile > fromFile ? 1 : -1;
        for (let f = fromFile + step; f !== toFile; f += step) {
          if (squares[`${FILES[f]}${RANKS[fromRank]}`]) return false;
        }
      }
      return true;
    case 'b':
      if (fileDist !== rankDist) return false;
      {
        const dx = toFile > fromFile ? 1 : -1;
        const dy = toRank > fromRank ? 1 : -1;
        for (let i = 1; i < fileDist; i++) {
          const sq = `${FILES[fromFile + dx * i]}${RANKS[fromRank + dy * i]}`;
          if (squares[sq]) return false;
        }
        return true;
      }
    case 'q':
      if (fromFile === toFile || fromRank === toRank) {
        let dx = 0, dy = 0;
        if (fromFile === toFile) dy = toRank > fromRank ? 1 : -1;
        else dx = toFile > fromFile ? 1 : -1;
        for (let f = fromFile + dx, r = fromRank + dy; f !== toFile || r !== toRank; f += dx, r += dy) {
          if (squares[`${FILES[f]}${RANKS[r]}`]) return false;
        }
        return true;
      } else if (fileDist === rankDist) {
        const dx = toFile > fromFile ? 1 : -1;
        const dy = toRank > fromRank ? 1 : -1;
        for (let i = 1; i < fileDist; i++) {
          if (squares[`${FILES[fromFile + dx * i]}${RANKS[fromRank + dy * i]}`]) return false;
        }
        return true;
      }
      return false;
    case 'n':
      return (fileDist === 2 && rankDist === 1) || (fileDist === 1 && rankDist === 2);
    case 'k':
      return fileDist <= 1 && rankDist <= 1;
    case 'p':
      {
        const dir = color === 'w' ? -1 : 1;
        const startRank = color === 'w' ? 1 : 6;
        if (toFile === fromFile) {
          if (toRank === fromRank + dir && !squares[to]) return true;
          if (toRank === fromRank + 2 * dir && fromRank === startRank && !squares[to] && !squares[`${FILES[fromFile]}${RANKS[fromRank + dir]}`]) return true;
        }
        if (Math.abs(toFile - fromFile) === 1 && toRank === fromRank + dir && squares[to] && squares[to].color !== color) return true;
        return false;
      }
  }
  return false;
}

function canMove(pieceType, from, to, squares, color) {
  if (squares[from]?.color !== color) return false;
  if (from === to) return false;
  if (squares[to]?.color === color) return false;
  return isValidMove(pieceType, from, to, squares, color);
}

function attacksSquare(pieceType, from, to, squares, color) {
  if (pieceType === 'p') {
    const fromFile = FILES.indexOf(from[0]);
    const fromRank = RANKS.indexOf(from[1]);
    const toFile = FILES.indexOf(to[0]);
    const toRank = RANKS.indexOf(to[1]);
    const dir = color === 'w' ? -1 : 1;
    return Math.abs(toFile - fromFile) === 1 && toRank === fromRank + dir;
  }
  return isValidMove(pieceType, from, to, squares, color);
}

function isDefended(squares, sq, color) {
  for (const s in squares) {
    if (s === sq) continue;
    const p = squares[s];
    if (p?.color === color && attacksSquare(p.type, s, sq, squares, color)) {
      return true;
    }
  }
  return false;
}

function canEnemyCapture(squares, sq, color) {
  for (const s in squares) {
    const p = squares[s];
    if (p?.color === color && attacksSquare(p.type, s, sq, squares, color)) {
      return true;
    }
  }
  return false;
}

function computeHintArrow(fen, level) {
  // Parse FEN (correct rank ordering: first row = rank 8)
  const parts = fen.split(' ');
  const board = {};
  const rows = parts[0].split('/');
  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    let fileIdx = 0;
    for (const char of rows[rankIdx]) {
      if (char >= '1' && char <= '8') {
        fileIdx += parseInt(char);
      } else {
        const sq = FILES[fileIdx] + RANKS[7 - rankIdx]; // FEN row 0 = rank 8
        board[sq] = { type: char.toLowerCase(), color: char === char.toUpperCase() ? 'w' : 'b' };
        fileIdx++;
      }
    }
  }

  // CHECK_MODE
  let blackKingSq = '';
  for (const s in board) {
    if (board[s]?.type === 'k' && board[s]?.color === 'b') {
      blackKingSq = s;
      break;
    }
  }

  if (blackKingSq) {
    const whiteSquares = Object.keys(board).filter(s => board[s]?.color === 'w');
    for (const wSq of whiteSquares) {
      const piece = board[wSq];
      for (const file of FILES) {
        for (const rank of RANKS) {
          const target = file + rank;
          if (board[target]?.color === 'w') continue;
          if (!canMove(piece.type, wSq, target, board, 'w')) continue;

          const nextSquares = { ...board };
          nextSquares[target] = nextSquares[wSq];
          delete nextSquares[wSq];

          let givesCheck = false;
          for (const s in nextSquares) {
            const p = nextSquares[s];
            if (p?.color !== 'w') continue;
            if (attacksSquare(p.type, s, blackKingSq, nextSquares, 'w')) {
              givesCheck = true;
              break;
            }
          }

          if (givesCheck) {
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

// Test Exercise 2 after Ng3->e2 (first move)
console.log('=== Exercise 2 after Ng3->e2 ===');
const ex2fen = '8/8/2k5/8/8/4N3/2b5/8 w - - 0 1';
const ex2level = { requireCheck: true, checkOnMove: 2 };
const ex2hint = computeHintArrow(ex2fen, ex2level);
console.log('Hint:', JSON.stringify(ex2hint));

// Test Exercise 5 after Ng3->g5 (first move)
console.log('\n=== Exercise 5 after Ng3->g5 ===');
const ex5fen = 'r1bqkb1r/pppp1p1p/2n2np1/4p1N1/2B5/4P3/PPPP1PPP/R1BQK2R w KQkq - 0 1';
const ex5level = { requireCheck: true, checkOnMove: 2 };
const ex5hint = computeHintArrow(ex5fen, ex5level);
console.log('Hint:', JSON.stringify(ex5hint));

// Test Exercise 5 initial position
console.log('\n=== Exercise 5 initial ===');
const ex5init = 'r1bqkb1r/pppp1p1p/2n2np1/4p3/2B5/4PN2/PPPP1PPP/R1BQK2R w KQkq - 0 1';
const ex5initHint = computeHintArrow(ex5init, ex5level);
console.log('Hint:', JSON.stringify(ex5initHint));

// Test Exercise 7 after first move
console.log('\n=== Exercise 7 after Bg6->d3 ===');
const ex7fen = 'r6r/2k5/2p3B1/8/8/3B4/8/8 w - - 0 1';
const ex7level = { requireCheck: true, checkOnMove: 2 };
const ex7hint = computeHintArrow(ex7fen, ex7level);
console.log('Hint:', JSON.stringify(ex7hint));