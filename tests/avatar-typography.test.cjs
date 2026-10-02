const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Use the existing TypeScript compiler; no test runner dependency or generated files.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017 },
    });
    module._compile(outputText, filename);
  };
}
const { formatAvatarText: format } = require('../src/lib/avatarTypography.ts');
const Bubble = require('../src/components/AvatarBubble.tsx').default;
const nbsp = '\u00a0';
const bound = s => s.replaceAll('~', nbsp);

test('Russian prepositions/conjunctions bind forward, including consecutive words', () => {
  for (const word of ['в', 'во', 'на', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'от', 'до', 'за', 'из', 'по', 'под', 'над', 'при', 'про', 'для', 'без', 'а', 'и', 'но', 'да', 'или', 'либо']) {
    assert.equal(format(`${word} поле`), `${word}${nbsp}поле`);
  }
  assert.equal(format('И в конце, а на поле'), bound('И~в~конце, а~на~поле'));
  assert.equal(format('слова кино вода'), 'слова кино вода');
});
test('numbers bind to time, chess and measurement units', () => {
  assert.equal(format('1 минута, 2 минуты, 5 минут; 1 ход, 2 хода, 10 ходов; 5 пешек'), bound('1~минута, 2~минуты, 5~минут; 1~ход, 2~хода, 10~ходов; 5~пешек'));
  assert.equal(format('1,5 кг; 30 сек.; 50 %; 2 игрока'), bound('1,5~кг; 30~сек.; 50~%; 2 игрока'));
});
test('за 1 минуту forms a single preferred group', () => {
  assert.equal(format('Поставьте мат за 1 минуту.'), bound('Поставьте мат за~1~минуту.'));
});
test('punctuation, quotes, newlines and notation remain intact', () => {
  assert.equal(format('«За 1 минуту!» — и «в игре», но: нет.\nНа e4; в, на.'), bound('«За~1~минуту!» — и~«в~игре», но: нет.\nНа~e4; в, на.'));
  assert.equal(format('в\nполе; 1\nход'), 'в\nполе; 1\nход');
});
test('idempotent display formatting leaves source data and React props unchanged', () => {
  const data = Object.freeze({ message: 'Мат за 1 минуту и в 2 хода.' });
  const child = React.createElement('p', null, data.message);
  const original = child.props.children;
  const first = format(data.message);
  assert.equal(format(first), first);
  const html = renderToStaticMarkup(React.createElement(Bubble, null, child));
  assert.ok(html.includes(first));
  assert.equal(child.props.children, original);
  assert.equal(data.message, 'Мат за 1 минуту и в 2 хода.');
  const updated = renderToStaticMarkup(React.createElement(Bubble, null, React.createElement('p', null, 'На поле за 2 минуты.')));
  assert.ok(updated.includes(bound('На~поле за~2~минуты.')));
});
test('every live avatar bubble uses the shared display boundary', () => {
  let count = 0;
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { scan(path); continue; }
      if (!/\.(tsx|ts)$/.test(entry.name)) continue;
      const source = fs.readFileSync(path, 'utf8');
      const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node) {
        if (ts.isJsxSelfClosingElement(node) && node.getText(ast).includes('src="/coach-avatar.png"')) {
          const row = node.parent.parent;
          assert.ok(row.children.some(child => ts.isJsxElement(child) && child.openingElement.tagName.getText(ast) === 'AvatarBubble'), path);
          count++;
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
  }
  scan('src');
  assert.equal(count, 35);
});
test('bubble CSS allows shrinking, normal wrapping and emergency breaks', () => {
  const element = Bubble({ children: 'за 1 минуту', style: { whiteSpace: 'nowrap', minWidth: 500 } });
  assert.deepEqual(element.props.style, {
    whiteSpace: 'normal', minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere', wordBreak: 'normal',
  });
  const html = renderToStaticMarkup(element);
  assert.ok(html.includes('white-space:normal'));
  assert.ok(html.includes('overflow-wrap:anywhere'));
  assert.ok(!html.includes('nowrap'));
});
test('real narrow layouts wrap normally and use emergency fallback without overflow', { skip: !process.env.CHROMIUM_PATH && 'Set CHROMIUM_PATH to a working browser to run layout checks' }, async () => {
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || require('chromium').path, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    for (const width of [320, 240, 160]) {
      await page.setViewportSize({ width, height: 600 });
      const html = renderToStaticMarkup(React.createElement(Bubble, { style: { flex: 1, padding: 8 } }, React.createElement('p', null, 'Мат за 1 минуту. ' + 'Длинноеслово'.repeat(30))));
      await page.setContent(`<style>body{margin:0}p{margin:0}*{box-sizing:border-box}</style><div style="display:flex;gap:12px;width:100%;font:16px Arial"><div style="width:56px;flex-shrink:0"></div>${html}</div>`);
      const result = await page.locator('[data-avatar-bubble]').evaluate(el => ({
        width: el.clientWidth, scroll: el.scrollWidth, height: el.clientHeight,
        pageWidth: document.documentElement.clientWidth, pageScroll: document.documentElement.scrollWidth,
        whiteSpace: getComputedStyle(el).whiteSpace, overflowWrap: getComputedStyle(el).overflowWrap, wordBreak: getComputedStyle(el).wordBreak,
      }));
      assert.equal(result.whiteSpace, 'normal');
      assert.equal(result.overflowWrap, 'anywhere');
      assert.equal(result.wordBreak, 'normal');
      assert.ok(result.scroll <= result.width, JSON.stringify(result));
      assert.ok(result.pageScroll <= result.pageWidth, JSON.stringify(result));
      assert.ok(result.height > 32);
    }
  } finally { await browser.close(); }
});
