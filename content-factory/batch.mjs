// Usage: node batch.mjs <start> <count>  -> renders out/reel-<i>.mp4
import {execSync} from 'node:child_process';
const hooks = [
  ['97% игроков НЕ видят этот ход', 'Белые ставят мат. Найдёшь за 5 секунд?'],
  ['Гроссмейстер решил за 1 секунду', 'А ты сможешь?'],
  ['Этот мат ловит даже 2000+', 'Найди ход за белых'],
  ['Только 1 из 100 найдёт', 'Ход белых. Время пошло'],
  ['Не листай, если играешь в шахматы', 'Мат в 2 хода'],
];
const [start = 0, count = 6] = process.argv.slice(2).map(Number);
const browser = process.env.CHROME ? `--browser-executable=${process.env.CHROME}` : '';
for (let i = start; i < start + count; i++) {
  const [hook, sub] = hooks[i % hooks.length];
  const props = JSON.stringify({index: i, hook, sub, cta: 'Пиши «ЗАДАЧИ» в комментариях — пришлю 50 таких'});
  execSync(`npx remotion render src/index.ts PuzzleReel out/reel-${i}.mp4 --props='${props}' ${browser}`, {stdio: 'inherit'});
}
