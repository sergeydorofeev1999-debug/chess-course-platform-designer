const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const sources = [
  'src/components/LessonClient.tsx',
  'src/components/CaptureBoard.tsx',
];

function extractFunction(source, name) {
  const match = source.match(new RegExp(`function ${name}\\(`));
  assert.ok(match, `could not find ${name}`);
  const start = match.index;
  let parenDepth = 0;
  let signatureEnd = -1;
  for (let i = source.indexOf('(', start); i < source.length; i++) {
    if (source[i] === '(') parenDepth++;
    if (source[i] === ')') {
      parenDepth--;
      if (parenDepth === 0) { signatureEnd = i + 1; break; }
    }
  }
  assert.notEqual(signatureEnd, -1, `could not parse ${name} signature`);
  const bodyStart = source.indexOf('{', signatureEnd);
  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  assert.notEqual(end, -1, `could not parse ${name} body`);
  return ts.transpile(source.slice(start, end), { target: ts.ScriptTarget.ES2020 });
}

function loadMoveFunctions(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const functions = ['isValidMove', 'getValidSquares'].map(name => extractFunction(source, name));
  const context = { FILES: ['a','b','c','d','e','f','g','h'], RANKS: ['8','7','6','5','4','3','2','1'] };
  vm.createContext(context);
  vm.runInContext(functions.join(String.fromCharCode(10)) + String.fromCharCode(10) + 'this.result={isValidMove,getValidSquares};', context);
  return context.result;
}

for (const file of sources) {
  test(`${file}: bishop target allows continuation and queen horizontal path is correct`, () => {
    const { isValidMove, getValidSquares } = loadMoveFunctions(file);
    const valid = (fn, piece, from, to, squares, stars) => file === 'src/components/CaptureBoard.tsx'
      ? fn(piece, from, to, squares, 'w', stars)
      : fn(piece, from, to, squares, stars);
    const candidates = (fn, piece, from, squares, stars) => file === 'src/components/CaptureBoard.tsx'
      ? fn(piece, from, squares, 'w', stars)
      : fn(piece, from, squares, stars);

    const bishopBoard = {
      b5: { type: 'b', color: 'w' },
      g3: { type: 'r', color: 'w' },
      h8: { type: 'k', color: 'b' },
    };
    assert.equal(valid(isValidMove, 'b', 'b5', 'f1', bishopBoard, ['d3']), true,
      'the target at d3 must not block a bishop move to f1');
    const bishopCandidates = Array.from(candidates(getValidSquares, 'b', 'b5', bishopBoard, ['d3']));
    assert.ok(bishopCandidates.includes('e2'));
    assert.ok(bishopCandidates.includes('f1'));

    const queenBoard = { a1: { type: 'q', color: 'w' } };
    const queenRay = ['b1','c1','d1','e1','f1','g1','h1'];
    assert.deepEqual(queenRay.map(to => valid(isValidMove, 'q', 'a1', to, queenBoard, ['d3'])),
      queenRay.map(() => true));
    const queenCandidates = Array.from(candidates(getValidSquares, 'q', 'a1', queenBoard, ['d3']));
    for (const sq of queenRay) assert.ok(queenCandidates.includes(sq), `queen candidates should include ${sq}`);

    const blockedBoard = { ...queenBoard, c1: { type: 'n', color: 'w' } };
    assert.equal(valid(isValidMove, 'q', 'a1', 'd1', blockedBoard, ['d3']), false,
      'an occupied intervening square must still block the queen');
  });
}
