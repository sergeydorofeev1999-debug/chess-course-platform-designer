// node ugc.mjs <файл в public/reactions> <номер_задачи> [hookId]
import {execSync} from 'node:child_process';
import fs from 'node:fs';
const hooks = JSON.parse(fs.readFileSync('ugc/hooks.json', 'utf8'));
const [file, idx = '0', hookId] = process.argv.slice(2);
const h = hookId ? hooks.find((x) => x.id === hookId) : hooks[+idx % hooks.length];
const props = {index: +idx, reaction: `reactions/${file}`, reactionHook: h.text, reactionSec: 3,
  hook: '', sub: '', ctaTitle: 'Понял ход? Напиши 👇', cta: 'Подпишись — шахматы с нуля, по шагу в день', theme: 'classic', lang: 'ru', source: 'lichess', bucket: process.env.BUCKET || 'mateIn1'};
fs.mkdirSync('out', {recursive: true}); const pf = `out/.props-${process.pid}.json`; fs.writeFileSync(pf, JSON.stringify(props));
const out = `out/ugc-${file.replace(/\.mp4$/, '')}-${idx}-${h.id}.mp4`;
const browser = process.env.CHROME ? `--browser-executable=${process.env.CHROME}` : '';
execSync(`npx remotion render src/index.ts UgcReel ${out} --props=${pf} ${browser}`, {stdio: 'inherit'});
console.log('✓', out);
