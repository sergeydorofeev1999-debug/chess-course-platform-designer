// Карусель 1080x1350: 4 слайда (хук+позиция → подсказка → решение → CTA). Рендер: remotion still по кадрам 0..3.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {Chess} from 'chess.js';
import {getPuzzle} from './puzzles';
import {BASE} from './PuzzleReel';

export const carouselDefaults = {
  index: 0, lang: 'ru', source: 'lichess', bucket: 'mateIn2',
  hook: 'Мат в {moves} хода. Найдёшь?', hint: 'Подсказка: ищи шах, после которого у короля нет полей',
  ctaTitle: 'Сохрани, чтобы не потерять', cta: 'Подпишись — каждый день новая задача',
};
type P = typeof carouselDefaults;

const Board: React.FC<{fen: string; last?: {from: string; to: string} | null; size: number; flip: boolean}> = ({fen, last, size, flip}) => {
  const g = new Chess(fen); const S = size / 8;
  const xy = (sq: string) => { const f = sq.charCodeAt(0) - 97, r = 8 - Number(sq[1]); return flip ? {x: (7 - f) * S, y: (7 - r) * S} : {x: f * S, y: r * S}; };
  const cells = [];
  for (let i = 0; i < 64; i++) {
    const x = i % 8, y = Math.floor(i / 8);
    const name = String.fromCharCode(97 + (flip ? 7 - x : x)) + (flip ? y + 1 : 8 - y);
    const hl = last && (name === last.from || name === last.to);
    cells.push(<div key={i} style={{position: 'absolute', left: x * S, top: y * S, width: S, height: S, background: hl ? '#E8C85A' : (x + y) % 2 ? BASE.darkSq : BASE.light}} />);
  }
  return <div style={{position: 'relative', width: size, height: size, border: `8px solid ${BASE.gold}`, borderRadius: 16, overflow: 'hidden'}}>
    {cells}
    {g.board().flat().filter(Boolean).map((p) => { const {x, y} = xy(p!.square);
      return <Img key={p!.square} src={staticFile(`pieces/${p!.color}${p!.type.toUpperCase()}.svg`)} style={{position: 'absolute', left: x, top: y, width: S, height: S}} />; })}
  </div>;
};

export const Carousel: React.FC<P> = ({index, lang, source, bucket, hook, hint, ctaTitle, cta}) => {
  const slide = useCurrentFrame();
  const p = getPuzzle(index, source, bucket);
  const fill = (s: string) => s.replace('{moves}', String(Math.ceil(p.moves.length / 2))).replace('{rating}', String(p.rating));
  const flip = p.fen.split(' ')[1] === 'b';
  const g = new Chess(p.fen); let last = null; const san: string[] = [];
  for (const m of p.moves) { const r = g.move({from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] || 'q'}); last = {from: r.from, to: r.to}; san.push(r.san); }
  const title = (t: string) => <div style={{fontSize: 72, fontWeight: 900, color: BASE.gold, textAlign: 'center', lineHeight: 1.1}}>{t}</div>;
  const n = <div style={{position: 'absolute', top: 30, right: 40, fontSize: 36, opacity: 0.6}}>{slide + 1}/4 →</div>;
  return <AbsoluteFill style={{background: BASE.dark, color: BASE.cream, fontFamily: 'DejaVu Sans, sans-serif', alignItems: 'center', justifyContent: 'center', gap: 40, padding: 60}}>
    {n}
    {slide === 0 && <>{title(fill(hook))}<Board fen={p.fen} last={p.last} size={860} flip={flip} /><div style={{fontSize: 40}}>{lang === 'en' ? 'Rating' : 'Рейтинг'}: {p.rating}</div></>}
    {slide === 1 && <>{title(lang === 'en' ? 'Hint' : 'Подсказка')}<Board fen={p.fen} size={760} flip={flip} /><div style={{fontSize: 46, textAlign: 'center'}}>{hint}</div></>}
    {slide === 2 && <>{title(lang === 'en' ? 'Solution' : 'Решение')}<Board fen={g.fen()} last={last} size={760} flip={flip} /><div style={{fontSize: 56, fontWeight: 900}}>{san.join('  ')}</div></>}
    {slide === 3 && <>{title(ctaTitle)}<div style={{fontSize: 52, textAlign: 'center'}}>{cta}</div></>}
  </AbsoluteFill>;
};
