// Конвейер: node batch.mjs <start> <count> [hookId]
// Рендерит out/reel-<puzzle>-<hook>.mp4 и пишет строку в data/ledger.csv (учёт публикаций).
import {execSync} from 'node:child_process';
import fs from 'node:fs';
const hooks = JSON.parse(fs.readFileSync('hooks.json', 'utf8'));
const puzzles = JSON.parse(fs.readFileSync('src/puzzles.json', 'utf8'));
const [startArg = '0', countArg = '6', onlyHook] = process.argv.slice(2);
const start = Number(startArg), count = Number(countArg);
const browser = process.env.CHROME ? `--browser-executable=${process.env.CHROME}` : '';
const ledger = 'data/ledger.csv';
if (!fs.existsSync(ledger)) fs.writeFileSync(ledger, 'file,puzzle,rating,hook_id,format,created,platform,url,published,views_24h,views_7d,saves,comments,cost_usd\n');
for (let i = start; i < start + count; i++) {
  const h = onlyHook ? hooks.find((x) => x.id === onlyHook) : hooks[i % hooks.length];
  const pz = puzzles[i % puzzles.length];
  const sub = h.sub.replace('{moves}', String(Math.ceil(pz.moves.length / 2)));
  const props = JSON.stringify({index: i, hook: h.hook, sub, cta: 'Пиши «ЗАДАЧИ» в комментариях — пришлю 50 таких'});
  const file = `out/reel-${i}-${h.id}.mp4`;
  const t0 = Date.now();
  execSync(`npx remotion render src/index.ts PuzzleReel ${file} --props='${props}' ${browser}`, {stdio: 'inherit'});
  fs.appendFileSync(ledger, `${file},${i},${pz.rating},${h.id},puzzle-timer,${new Date().toISOString()},,,,,,,,0\n`);
  console.log(`✓ ${file} за ${((Date.now() - t0) / 1000).toFixed(0)}с`);
}
