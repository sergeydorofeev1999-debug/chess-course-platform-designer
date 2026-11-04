// Экономика контент-завода: node economics.mjs <расходы_$> <выручка_$>
// Просмотры и число публикаций берутся из data/ledger.csv (колонка views_7d).
import fs from 'node:fs';
const [cost = 0, revenue = 0] = process.argv.slice(2).map(Number);
const rows = fs.readFileSync('data/ledger.csv', 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
const pubs = rows.filter((r) => r[8]).length;
const views = rows.reduce((s, r) => s + (Number(r[10]) || 0), 0);
const per = (x) => (views ? (x / views) * 1e6 : 0).toFixed(2);
console.log({публикаций: pubs, просмотров_7д: views, средне_на_публикацию: pubs ? Math.round(views / pubs) : 0,
  цена_публикации_$: pubs ? (cost / pubs).toFixed(3) : '-', расходы_на_1М_$: per(cost), выручка_на_1М_$: per(revenue)});
const byHook = {};
for (const r of rows) if (r[10]) (byHook[r[3]] ??= []).push(Number(r[10]));
console.log('Хуки (средние просмотры за 7д):');
for (const [k, v] of Object.entries(byHook).sort((a, b) => b[1].reduce((x, y) => x + y) / b[1].length - a[1].reduce((x, y) => x + y) / a[1].length))
  console.log(`  ${k}: ${Math.round(v.reduce((x, y) => x + y) / v.length)} (n=${v.length})`);
