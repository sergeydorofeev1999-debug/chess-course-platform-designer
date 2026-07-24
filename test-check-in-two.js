// Test script for check-in-two algorithm
// Extract functions from CaptureLessonWrapper.tsx

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

function parseFenBoard(fen) {
  const squares = {};
  const rows = fen.split(' ')[0].split('/');
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    let fileIdx = 0;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch >= '1' && ch <= '8') {
        fileIdx += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase();
        squares[FILES[fileIdx] + RANKS[7 - r]] = { type, color };
        fileIdx++;
      }
    }
  }
  return squares;
}

function canMove(pieceType, from, to, squares, color, ignoreTargetColor) {
  if (squares[from]?.color !== color) return false;
  if (!ignoreTargetColor && squares[to]?.color === color) return false;
  if (from === to) return false;
  const ff = FILES.indexOf(from[0]), tf = FILES.indexOf(to[0]);
  const fr = RANKS.indexOf(from[1]), tr = RANKS.indexOf(to[1]);
  const df = tf - ff, dr = tr - fr, adf = Math.abs(df), adr = Math.abs(dr);

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
      if (tf === ff && tr === fr + dir && !squares[to]) return true;
      if (tf === ff && tr === fr + 2 * dir && from[1] === startRank && !squares[to]) {
        const middleSq = `${FILES[ff]}${RANKS[fr + dir]}`;
        return !squares[middleSq];
      }
      if (Math.abs(tf - ff) === 1 && tr === fr + dir) {
        if (squares[to]?.color !== color && squares[to]) return true;
        if (!ignoreTargetColor && !squares[to]) return false;
      }
      return false;
    }
  }
  return false;
}

function attacksSquare(pieceType, from, to, squares, color) {
  return canMove(pieceType, from, to, squares, color, true);
}

function isDefended(squares, sq, color) {
  for (const s in squares) {
    if (s === sq) continue;
    const p = squares[s];
    if (p.color !== color) continue;
    if (attacksSquare(p.type, s, sq, squares, color)) return true;
  }
  return false;
}

function canEnemyCapture(squares, sq, enemyColor) {
  for (const s in squares) {
    const p = squares[s];
    if (p.color !== enemyColor) continue;
    if (attacksSquare(p.type, s, sq, squares, enemyColor)) return true;
  }
  return false;
}

function isKingInCheck(squares, kingColor) {
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

// Test LEVEL 5
console.log('\n=== LEVEL 5 TEST ===');
const fen5 = 'r1bqkb1r/pppp1p1p/2n2np1/4p3/2B5/4PN2/PPPP1PPP/R1BQK2R w KQkq - 0 1';
const squares5 = parseFenBoard(fen5);
console.log('Initial squares:');
for (const s in squares5) {
  const p = squares5[s];
  if (p.color === 'w') console.log(`  ${s}: ${p.type} ${p.color}`);
}

// Test canMove for white pieces
for (const s in squares5) {
  const p = squares5[s];
  if (p.color !== 'w') continue;
  // Test if piece can move to f7
  if (canMove(p.type, s, 'f7', squares5, 'w')) {
    console.log(`  ${p.type} at ${s} CAN move to f7`);
  }
}

// Test LEVEL 7
console.log('\n=== LEVEL 7 TEST ===');
const fen7 = 'r6r/2kn2Q1/2p3B1/8/8/8/8/8 w - - 0 1';
const squares7 = parseFenBoard(fen7);
console.log('Initial squares:');
for (const s in squares7) {
  const p = squares7[s];
  if (p.color === 'w') console.log(`  ${s}: ${p.type} ${p.color}`);
}

// Simulate Bg6 -> d3 and test if Qg7 gives check
console.log('\nSimulating Bg6 -> d3:');
const afterBd3 = { ...squares7 };
afterBd3['d3'] = afterBd3['g6'];
delete afterBd3['g6'];

// Can Qg7 give check?
if (attacksSquare('q', 'g7', 'd8', afterBd3, 'w')) {
  console.log('  Qg7 CAN attack d8 -> gives check!');
} else {
  console.log('  Qg7 CANNOT attack d8');
}

// But is Qg7 defended?
if (isDefended(afterBd3, 'g7', 'w')) {
  console.log('  Qg7 IS defended');
} else {
  console.log('  Qg7 is NOT defended (might be captured)');
}

// Can black capture Qg7 after Bd3?
if (canEnemyCapture(afterBd3, 'g7', 'b')) {
  console.log('  Black CAN capture Qg7 after Bd3');
} else {
  console.log('  Black CANNOT capture Qg7 after Bd3');
}
