const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/components/ComputerPlayBoard.tsx', 'utf8');

test('mounted ref is restored on each effect setup, including Strict Mode effect replay', () => {
  assert.match(source, /useEffect\(\(\) => \{\s*mountedRef\.current = true;\s*return \(\) => \{ mountedRef\.current = false; \};\s*\}, \[\]\)/);
});

test('board remains conditionally rendered only for level picker versus active game state', () => {
  assert.match(source, /if \(selectedLevel === null\) \{/);
  assert.match(source, /if \(!game\) return null;/);
  assert.doesNotMatch(source, /key=\{(?:selectedLevel|gameOver|thinking|message)\}/);
  assert.match(source, /const \[game, setGame\] = useState<Chess \| null>\(null\)/);
});

test('board grid stays mounted and thinking indicator reserves space instead of moving it', () => {
  const gridStart = source.indexOf('data-board');
  assert.notEqual(gridStart, -1);
  const grid = source.slice(gridStart, gridStart + 2200);
  assert.match(grid, /className="grid border-\[3px\].*relative select-none"/);
  assert.match(grid, /gridTemplateColumns: `repeat\(8, \$\{sqSize\}px\)`/);
  assert.match(grid, /gridTemplateRows: `repeat\(8, \$\{sqSize\}px\)`/);

  const statusBarStart = source.indexOf('{/* CENTER COLUMN */}');
  const statusBarEnd = source.indexOf('{/* Avatar + speech bubble */}', statusBarStart);
  const statusBarBlock = source.slice(statusBarStart, statusBarEnd);
  assert.match(statusBarBlock, /w-full h-1\.5 rounded-full overflow-hidden/);
  assert.match(statusBarBlock, /\$\{thinking \? 'opacity-100' : 'opacity-0'\}/);
  assert.doesNotMatch(statusBarBlock, /\{thinking &&/);
});

test('player and computer moves commit updated FEN without unmounting the board', () => {
  assert.equal((source.match(/setGame\(new Chess\(/g) || []).length, 4);
  assert.match(source, /const finishPlayerMove = \(\) => \{/);
  assert.match(source, /setGame\(new Chess\(g\.fen\(\)\)\)/);
  assert.match(source, /setGame\(new Chess\(newG\.fen\(\)\)\)/);
});
