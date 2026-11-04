// node carousel.mjs <puzzleIndex> [ru|en] -> out/carousel-<i>-<lang>/slide-1..4.png
import {execSync} from 'node:child_process';
import fs from 'node:fs';
const propsFile = (json) => { fs.mkdirSync('out', {recursive: true}); const f = `out/.props-${process.pid}.json`; fs.writeFileSync(f, json); return f; };
const [i = '0', lang = 'ru'] = process.argv.slice(2);
const en = lang === 'en';
const props = JSON.stringify(en ? {index: +i, lang, hook: 'Mate in {moves}. Can you find it?', hint: 'Hint: look for a check that leaves the king no squares',
  ctaTitle: 'Save it for later', cta: 'Follow — a new puzzle every day'} : {index: +i, lang});
const dir = `out/carousel-${i}-${lang}`; fs.mkdirSync(dir, {recursive: true});
const browser = process.env.CHROME ? `--browser-executable=${process.env.CHROME}` : '';
for (let f = 0; f < 4; f++) execSync(`npx remotion still src/index.ts Carousel ${dir}/slide-${f + 1}.png --frame=${f} --props=${propsFile(props)} ${browser}`, {stdio: 'inherit'});
console.log('✓', dir);
