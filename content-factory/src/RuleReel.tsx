// Формат «Правило за 30 секунд»: хук → пошаговая демонстрация с анимацией ходов и стрелками → условия → CTA.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chess, Move} from 'chess.js';
import rules from '../data/rules.json';
import {BASE as C} from './PuzzleReel';

type Step = {dur: number; move?: string; caption: string; arrows?: string[][]; highlight?: string[]; ghost?: string; big?: boolean};
type Rule = {id: string; hook: string; sub: string; fen: string; steps: Step[]; rulesTitle: string; rules: string[]; ctaTitle: string; cta: string};
const HOOK = 3, RULES = 6, CTA = 3.5, ANIM = 0.7;
const get = (id: string) => (rules as Rule[]).find((r) => r.id === id)!;
export const ruleDefaults = {id: 'en-passant'};
export const ruleDuration = (id: string, fps = 30) => Math.round((HOOK + get(id).steps.reduce((s, x) => s + x.dur, 0) + RULES + CTA) * fps);

const S = 1000 / 8;
const xy = (sq: string) => ({x: (sq.charCodeAt(0) - 97) * S, y: (8 - Number(sq[1])) * S});

const Arrow: React.FC<{from: string; to: string; p: number}> = ({from, to, p}) => {
  const a = xy(from), b = xy(to); const x1 = a.x + S / 2, y1 = a.y + S / 2;
  const x2 = x1 + (b.x + S / 2 - x1) * p, y2 = y1 + (b.y + S / 2 - y1) * p;
  return <g opacity={0.9}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E5484D" strokeWidth={22} strokeLinecap="round" markerEnd="url(#head)" /></g>;
};

export const RuleReel: React.FC<typeof ruleDefaults> = ({id}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const r = get(id);
  // где мы в сценарии
  let acc = HOOK, si = -1;
  for (let i = 0; i < r.steps.length; i++) { if (t >= acc) si = i; acc += r.steps[i].dur; }
  const stepsEnd = acc, rulesEnd = stepsEnd + RULES;
  const stepStart = HOOK + r.steps.slice(0, Math.max(si, 0)).reduce((s, x) => s + x.dur, 0);
  const local = t - stepStart;
  // позиция до текущего шага + текущий ход
  const g = new Chess(r.fen); let mv: Move | null = null; let last: Move | null = null;
  for (let i = 0; i <= si && i < r.steps.length; i++) {
    const m = r.steps[i].move; if (!m) continue;
    if (i === si) mv = g.move(m); else last = g.move(m);
  }
  const prog = mv ? interpolate(local, [0.3, 0.3 + ANIM], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  // доска до хода (для анимации) — берём из истории
  const before = new Chess(r.fen);
  for (let i = 0; i < si; i++) { const m = r.steps[i].move; if (m) before.move(m); }
  const pieces = (mv && prog < 1 ? before : g).board().flat().filter(Boolean) as {square: string; type: string; color: string}[];
  const epVictim = mv && mv.flags.includes('e') ? mv.to[0] + mv.from[1] : null;
  const step = si >= 0 ? r.steps[si] : null;
  const hl = new Set<string>([...(step?.highlight ?? []), ...(mv && prog >= 1 ? [mv.from, mv.to] : []), ...(!mv && last ? [last.from, last.to] : [])]);
  const pop = spring({frame: f, fps, config: {damping: 11}});
  const capIn = spring({frame: f - Math.round(stepStart * fps), fps, config: {damping: 14}});

  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #3d3226, ${C.dark})`, color: C.cream, fontFamily: 'DejaVu Sans, sans-serif'}}>
    <div style={{position: 'absolute', top: 130, width: '100%', textAlign: 'center', padding: '0 60px', boxSizing: 'border-box', transform: `scale(${pop})`}}>
      <div style={{fontSize: 82, fontWeight: 900, color: C.gold, lineHeight: 1.1, textShadow: '0 6px 0 #000'}}>{r.hook}</div>
      <div style={{fontSize: 46, marginTop: 20, opacity: interpolate(t, [0.8, 1.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{r.sub}</div>
    </div>
    <div style={{position: 'absolute', left: 40, top: 500, width: 1000, height: 1000, border: `8px solid ${C.gold}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px #000'}}>
      {Array.from({length: 64}).map((_, i) => { const x = i % 8, y = Math.floor(i / 8); const name = String.fromCharCode(97 + x) + (8 - y);
        return <div key={i} style={{position: 'absolute', left: x * S, top: y * S, width: S, height: S, background: hl.has(name) ? '#E8C85A' : (x + y) % 2 ? C.darkSq : C.light}}>
          {y === 7 && <span style={{position: 'absolute', right: 6, bottom: 2, fontSize: 24, opacity: 0.6, color: (x + y) % 2 ? C.light : C.darkSq}}>{String.fromCharCode(97 + x)}</span>}
          {x === 0 && <span style={{position: 'absolute', left: 6, top: 2, fontSize: 24, opacity: 0.6, color: (x + y) % 2 ? C.light : C.darkSq}}>{8 - y}</span>}
        </div>; })}
      {step?.ghost && (() => { const {x, y} = xy(step.ghost); const pulse = 0.5 + 0.5 * Math.sin(f / 4);
        return <div style={{position: 'absolute', left: x + 14, top: y + 14, width: S - 28, height: S - 28, borderRadius: '50%', border: `8px dashed #E5484D`, opacity: 0.5 + 0.5 * pulse}} />; })()}
      {pieces.map((p) => {
        let {x, y} = xy(p.square); let op = 1;
        if (mv && prog < 1 && p.square === mv.from) { const b = xy(mv.to); x += (b.x - x) * prog; y += (b.y - y) * prog; }
        if (mv && prog < 1 && epVictim && p.square === epVictim) op = 1 - prog;
        return <Img key={p.square} src={staticFile(`pieces/${p.color}${p.type.toUpperCase()}.svg`)} style={{position: 'absolute', left: x, top: y, width: S, height: S, opacity: op}} />;
      })}
      <svg width={1000} height={1000} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><marker id="head" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 z" fill="#E5484D" /></marker></defs>
        {(step?.arrows ?? []).map(([a, b], i) => <Arrow key={i} from={a} to={b} p={interpolate(local, [0, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />)}
      </svg>
    </div>
    <div style={{position: 'absolute', top: 1560, width: '100%', textAlign: 'center', padding: '0 60px', boxSizing: 'border-box'}}>
      {step && t < stepsEnd && <div style={{fontSize: step.big ? 84 : 56, fontWeight: 800, lineHeight: 1.2, color: step.big ? C.gold : C.cream, transform: `scale(${capIn})`}}>{step.caption}</div>}
    </div>
    {t >= stepsEnd && t < rulesEnd && <AbsoluteFill style={{background: 'rgba(44,36,27,0.95)', justifyContent: 'center', padding: 80, gap: 50}}>
      <div style={{fontSize: 84, fontWeight: 900, color: C.gold}}>{r.rulesTitle}</div>
      {r.rules.map((x, i) => { const s = spring({frame: f - Math.round((stepsEnd + 0.4 + i * 1.2) * fps), fps});
        return <div key={i} style={{fontSize: 52, lineHeight: 1.25, opacity: s, transform: `translateX(${(1 - s) * 80}px)`, display: 'flex', gap: 24}}>
          <span style={{color: C.gold, fontWeight: 900}}>{i + 1}</span><span>{x}</span></div>; })}
    </AbsoluteFill>}
    {t >= rulesEnd && <AbsoluteFill style={{background: 'rgba(44,36,27,0.95)', justifyContent: 'center', alignItems: 'center', padding: 80}}>
      <div style={{fontSize: 80, fontWeight: 900, textAlign: 'center', color: C.gold, transform: `scale(${spring({frame: f - Math.round(rulesEnd * fps), fps})})`}}>{r.ctaTitle}</div>
      <div style={{fontSize: 52, textAlign: 'center', marginTop: 40}}>{r.cta}</div>
    </AbsoluteFill>}
  </AbsoluteFill>;
};
