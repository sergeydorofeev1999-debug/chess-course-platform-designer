import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chess} from 'chess.js';
import puzzles from './puzzles.json';

// Brand palette (from platform): gold, dark brown, cream
const C = {gold: '#C9A84C', dark: '#2C241B', cream: '#F5EFE6', light: '#F0D9B5', darkSq: '#8B7355', red: '#E5484D'};

export const reelSchemaDefaults = {
  index: 0,
  hook: '97% игроков НЕ видят этот ход',
  sub: 'Белые ставят мат. Найдёшь за 5 секунд?',
  cta: 'Пиши «ЗАДАЧИ» в комментариях — пришлю 50 таких',
};
type Props = typeof reelSchemaDefaults;

const sq = (s: string) => ({f: s.charCodeAt(0) - 97, r: 8 - Number(s[1])});

export const PuzzleReel: React.FC<Props> = ({index, hook, sub, cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = (puzzles as {fen: string; moves: string[]}[])[index % puzzles.length];

  // Timeline (sec): 0-2.5 hook, 2.5-8 think + timer, 8-12 solution, 12-15 CTA
  const t = frame / fps;
  const solveStart = 8, ctaStart = 12.2;
  const stepDur = 1.2;
  const step = t < solveStart ? 0 : Math.min(p.moves.length, Math.floor((t - solveStart) / stepDur) + 1);
  const game = new Chess(p.fen);
  let last: {from: string; to: string} | null = null;
  for (let i = 0; i < step; i++) {
    const m = p.moves[i];
    const r = game.move({from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] || 'q'});
    last = {from: r.from, to: r.to};
  }
  const flip = new Chess(p.fen).turn() === 'b';
  const board = game.board();
  const S = 1000 / 8;
  const pos = (s: string) => { const {f, r} = sq(s); return flip ? {x: (7 - f) * S, y: (7 - r) * S} : {x: f * S, y: r * S}; };

  const hookIn = spring({frame, fps, config: {damping: 12}});
  const shake = t < 2.5 ? Math.sin(frame * 1.7) * 6 * (1 - t / 2.5) : 0;
  const timer = Math.max(0, Math.ceil(solveStart - t));
  const boardIn = spring({frame: frame - 10, fps});
  const ctaIn = spring({frame: frame - ctaStart * fps, fps});
  const mate = step === p.moves.length && game.isCheckmate();
  const flash = mate ? interpolate((t - solveStart - (p.moves.length - 1) * stepDur) % 1, [0, 1], [0.6, 0]) : 0;

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #3d3226, ${C.dark})`, fontFamily: 'DejaVu Sans, sans-serif', color: C.cream}}>
      {/* HOOK */}
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', padding: '0 60px', boxSizing: 'border-box',
        transform: `scale(${hookIn}) translateX(${shake}px)`}}>
        <div style={{fontSize: 84, fontWeight: 900, lineHeight: 1.1, color: C.gold, textShadow: '0 6px 0 #000'}}>{hook}</div>
        <div style={{fontSize: 46, marginTop: 24, opacity: interpolate(t, [1.2, 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{sub}</div>
      </div>
      {/* BOARD */}
      <div style={{position: 'absolute', left: 40, top: 520, width: 1000, height: 1000, transform: `scale(${0.85 + 0.15 * boardIn})`,
        opacity: boardIn, border: `8px solid ${C.gold}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px #000'}}>
        {Array.from({length: 64}).map((_, i) => {
          const x = i % 8, y = Math.floor(i / 8);
          const name = String.fromCharCode(97 + (flip ? 7 - x : x)) + (flip ? y + 1 : 8 - y);
          const hl = last && (name === last.from || name === last.to);
          return <div key={i} style={{position: 'absolute', left: x * S, top: y * S, width: S, height: S,
            background: hl ? '#E8C85A' : (x + y) % 2 ? C.darkSq : C.light}} />;
        })}
        {board.flat().filter(Boolean).map((pc) => {
          const {x, y} = pos(pc!.square);
          return <Img key={pc!.square} src={staticFile(`pieces/${pc!.color}${pc!.type.toUpperCase()}.svg`)}
            style={{position: 'absolute', left: x, top: y, width: S, height: S}} />;
        })}
        <AbsoluteFill style={{background: C.gold, opacity: flash}} />
      </div>
      {/* TIMER / RESULT */}
      <div style={{position: 'absolute', top: 1580, width: '100%', textAlign: 'center'}}>
        {t >= 2.5 && t < solveStart && <div style={{fontSize: 140, fontWeight: 900, color: timer <= 2 ? C.red : C.cream}}>{timer}</div>}
        {t >= solveStart && t < ctaStart && <div style={{fontSize: 96, fontWeight: 900, color: C.gold}}>{mate ? 'МАТ! 🤯' : 'Смотри...'}</div>}
      </div>
      {/* CTA */}
      {t >= ctaStart && <AbsoluteFill style={{background: 'rgba(44,36,27,0.92)', justifyContent: 'center', alignItems: 'center', padding: 80, opacity: ctaIn}}>
        <div style={{fontSize: 78, fontWeight: 900, textAlign: 'center', color: C.gold, transform: `scale(${ctaIn})`}}>Угадал? Напиши ход 👇</div>
        <div style={{fontSize: 52, textAlign: 'center', marginTop: 40}}>{cta}</div>
      </AbsoluteFill>}
    </AbsoluteFill>
  );
};
