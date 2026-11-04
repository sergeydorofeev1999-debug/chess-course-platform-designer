// LANG_REEL=en для английской версии.
// Конвейер: node batch.mjs <start> <count> [hookId] [ctaId] [theme]
// Рендерит out/reel-<puzzle>-<hook>.mp4 и пишет строку в data/ledger.csv (учёт публикаций).
import {execSync} from 'node:child_process';
import fs from 'node:fs';
const propsFile = (json) => { fs.mkdirSync('out', {recursive: true}); const f = `out/.props-${process.pid}.json`; fs.writeFileSync(f, json); return f; };
const LANG = process.env.LANG_REEL || 'ru';
const i18n = JSON.parse(fs.readFileSync('i18n.json', 'utf8'));
const hooks = LANG === 'ru' ? JSON.parse(fs.readFileSync('hooks.json', 'utf8')) : i18n[LANG].hooks;
const ctas = LANG === 'ru' ? JSON.parse(fs.readFileSync('ctas.json', 'utf8')) : i18n[LANG].ctas;
const themes = ['classic', 'walnut', 'night'];
const puzzles = JSON.parse(fs.readFileSync('src/puzzles-lichess.json', 'utf8')).filter((p) => p.bucket === (process.env.BUCKET || 'mateIn1'));
const [startArg = '0', countArg = '6', onlyHook, onlyCta, onlyTheme] = process.argv.slice(2);
const start = Number(startArg), count = Number(countArg);
const browser = process.env.CHROME ? `--browser-executable=${process.env.CHROME}` : '';
const ledger = 'data/ledger.csv';
if (!fs.existsSync(ledger)) fs.writeFileSync(ledger, 'file,puzzle,rating,hook_id,cta_id,theme,format,created,platform,url,published,views_24h,views_7d,saves,comments,cost_usd\n');
for (let i = start; i < start + count; i++) {
  const h = onlyHook ? hooks.find((x) => x.id === onlyHook) : hooks[i % hooks.length];
  const c = onlyCta ? ctas.find((x) => x.id === onlyCta) : ctas[0];
  const theme = onlyTheme || themes[0];
  const pz = puzzles[i % puzzles.length];
  const sub = h.sub.replace('{moves}', String(Math.ceil(pz.moves.length / 2)));
  const props = JSON.stringify({index: i, hook: h.hook, sub, ctaTitle: c.title, cta: c.text, theme, lang: LANG, source: 'lichess', bucket: process.env.BUCKET || 'mateIn1'});
  const file = `out/reel-${i}-${LANG}-${h.id}-${c.id}-${theme}.mp4`;
  const t0 = Date.now();
  execSync(`npx remotion render src/index.ts PuzzleReel ${file} --props=${propsFile(props)} ${browser}`, {stdio: 'inherit'});
  fs.appendFileSync(ledger, `${file},${i},${pz.rating},${h.id},${c.id},${theme},puzzle-timer,${new Date().toISOString()},,,,,,,,0\n`);
  console.log(`✓ ${file} за ${((Date.now() - t0) / 1000).toFixed(0)}с`);
}
