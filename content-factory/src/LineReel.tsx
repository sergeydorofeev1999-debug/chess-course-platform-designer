// Формат «партия/ловушка по ходам»: заголовок → ходы с подписями → вывод-урок → CTA.
import React from 'react';
import {AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chess} from 'chess.js';
import lines from '../data/lines.json';
import {BASE as C} from './PuzzleReel';

export const lineDefaults = {id: 'scholars-mate', ctaTitle: 'Сохрани, чтобы не попасться 👇', cta: 'Подпишись — шахматы с нуля, по шагу в день', perMove: 1.4};
export const lineDuration = (id: string, fps = 30, perMove = 1.4) => {
  const l = (lines as {id: string; moves: string[]}[]).find((x) => x.id === id)!;
  return Math.round((2.5 + l.moves.length * perMove + 3 + 3) * fps);
};

export const LineReel: React.FC<typeof lineDefaults> = ({id, ctaTitle, cta, perMove}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const l = (lines as {id: string; title: string; sub: string; moves: string[]; captions: string[]; lesson: string}[]).find((x) => x.id === id)!;
  const start = 2.5, endMoves = start + l.moves.length * perMove, ctaAt = endMoves + 3;
  const n = t < start ? 0 : Math.min(l.moves.length, Math.floor((t - start) / perMove) + 1);
  const g = new Chess(); let last: {from: string; to: string} | null = null;
  for (let i = 0; i < n; i++) { const r = g.move(l.moves[i]); last = {from: r.from, to: r.to}; }
  const S = 1000 / 8; const pop = spring({frame: f, fps});
  const cap = n > 0 ? l.captions[n - 1] : '';
  return <AbsoluteFill style={{background: C.dark, color: C.cream, fontFamily: 'DejaVu Sans, sans-serif'}}>
    <div style={{position: 'absolute', top: 140, width: '100%', textAlign: 'center', padding: '0 60px', boxSizing: 'border-box', transform: `scale(${pop})`}}>
      <div style={{fontSize: 80, fontWeight: 900, color: C.gold, lineHeight: 1.1}}>{l.title}</div>
      <div style={{fontSize: 44, marginTop: 20}}>{l.sub}</div>
    </div>
    <div style={{position: 'absolute', left: 40, top: 520, width: 1000, height: 1000, border: `8px solid ${C.gold}`, borderRadius: 16, overflow: 'hidden'}}>
      {Array.from({length: 64}).map((_, i) => { const x = i % 8, y = Math.floor(i / 8); const name = String.fromCharCode(97 + x) + (8 - y);
        const hl = last && (name === last.from || name === last.to);
        return <div key={i} style={{position: 'absolute', left: x * S, top: y * S, width: S, height: S, background: hl ? '#E8C85A' : (x + y) % 2 ? C.darkSq : C.light}} />; })}
      {g.board().flat().filter(Boolean).map((p) => { const x = p!.square.charCodeAt(0) - 97, y = 8 - Number(p!.square[1]);
        return <Img key={p!.square} src={staticFile(`pieces/${p!.color}${p!.type.toUpperCase()}.svg`)} style={{position: 'absolute', left: x * S, top: y * S, width: S, height: S}} />; })}
    </div>
    <div style={{position: 'absolute', top: 1570, width: '100%', textAlign: 'center', padding: '0 60px', boxSizing: 'border-box'}}>
      {t >= start && t < endMoves + 0.2 && cap && <div style={{fontSize: 58, fontWeight: 800, color: g.isCheckmate() ? C.gold : C.cream}}>{cap}</div>}
      {t >= endMoves + 0.2 && t < ctaAt && <div style={{fontSize: 54, fontWeight: 800, color: C.gold}}>💡 {l.lesson}</div>}
    </div>
    {t >= ctaAt && <AbsoluteFill style={{background: 'rgba(44,36,27,0.92)', justifyContent: 'center', alignItems: 'center', padding: 80}}>
      <div style={{fontSize: 78, fontWeight: 900, textAlign: 'center', color: C.gold}}>{ctaTitle}</div>
      <div style={{fontSize: 52, textAlign: 'center', marginTop: 40}}>{cta}</div>
    </AbsoluteFill>}
  </AbsoluteFill>;
};
