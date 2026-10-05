const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017 },
  });
  module._compile(outputText, filename);
};

const source = fs.readFileSync('src/components/LessonClient.tsx', 'utf8');
const extractFunction = (name, nextName) => {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} helper exists`);
  const end = source.indexOf(`function ${nextName}(`, start);
  assert.notEqual(end, -1, `${nextName} helper follows ${name}`);
  return source.slice(start, end);
};
const normalizeSource = extractFunction('normalizeProgressValues', 'getLessonMinimumStarsFromValues');
const minimumSource = extractFunction('getLessonMinimumStarsFromValues', 'getLessonMinimumStars');
const getMinimumSource = extractFunction('getLessonMinimumStars', 'parseFen');
const exported = ts.transpileModule(`${normalizeSource}\n${minimumSource}\n${getMinimumSource}\nmodule.exports = { normalizeProgressValues, getLessonMinimumStarsFromValues, getLessonMinimumStars };`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
const helpersModule = { exports: {} };
new Function('module', 'exports', 'window', 'localStorage', exported)(helpersModule, helpersModule.exports, {}, { getItem: () => null });
const { normalizeProgressValues, getLessonMinimumStarsFromValues, getLessonMinimumStars } = helpersModule.exports;

test('minimum stars uses lowest recorded exercise result and ignores metadata', () => {
  assert.equal(getLessonMinimumStarsFromValues({ 0: 3, 1: 2, 2: 1, currentLevel: 2 }), 1);
  assert.equal(getLessonMinimumStarsFromValues({ 0: 3, 1: 3, done: true }), 3);
});

test('boolean completion is conservatively counted as one star', () => {
  assert.deepEqual(normalizeProgressValues({ easy: true, hard: false, level: 3 }), [1, 3]);
  assert.equal(getLessonMinimumStarsFromValues({ easy: true, medium: true }), 1);
});

test('invalid, empty and non-star progress values never fabricate stars', () => {
  for (const values of [null, undefined, [], {}, { currentLevel: 2, done: true }, { x: 0 }, { x: 4 }, { x: '3' }]) {
    assert.equal(getLessonMinimumStarsFromValues(values), 0);
  }
});

test('lesson-specific progress keys are selected for all mapped course lessons', () => {
  const mapped = source.match(/'([0-9a-f-]{36})': '(?:pawnrace|rookpawn|bishoppawn|queenpawn|knightpawn|football|tworooks|queenmate|rookmate|fork|discovered_attack|square_rule|mixed|italian|italian_black|mateinone|mateintwo|defendmate|computerplay)_progress'/g) || [];
  assert.equal(mapped.length, 21);
  assert.doesNotMatch(source, /(?:PIN|DISCOVERED_ATTACK|DEFEND_MATE|SQUARE_RULE|MIXED_TACTICS|ITALIAN_OPENING|ITALIAN_BLACK|MATE_IN_ONE|MATE_IN_TWO|COMPUTER_PLAY)_LESSON_ID/);
  assert.match(source, /lesson_progress_\$\{lessonId\}.*lesson_capture_\$\{lessonId\}/);
});

test('completion callback shows one generic card except for the six branded star lessons', () => {
  const handler = source.match(/const handleInteractiveComplete = async \(\) => \{([\s\S]*?)\n  \};/);
  assert.ok(handler, 'completion callback is defined');
  assert.match(handler[1], /if \(!isPieceStarLesson\) setShowCompletionCard\(true\)/);
  assert.match(handler[1], /markLessonCompleteAuth\(lesson\.id\)/);
  assert.match(handler[1], /getLessonMinimumStars\(lesson\.id\)/);
});

test('coordinate lesson completion remains an explicit user action after score threshold', () => {
  const board = fs.readFileSync('src/components/CoordinateTrainingBoard.tsx', 'utf8');
  assert.match(board, /onComplete && score >= 5/);
  assert.match(board, /onClick=\{onComplete\}/);
});
