// UGC-формат: живая реакция удивления (3 с) + текст-хук → задача → CTA.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {PuzzleReel, reelSchemaDefaults, BASE} from './PuzzleReel';

export const ugcDefaults = {...reelSchemaDefaults, reaction: 'reactions/sample.mp4', reactionHook: 'Почему мне никто не сказал об этом раньше?!', reactionSec: 3};
type P = typeof ugcDefaults;

const Intro: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 10}});
  return <div style={{position: 'absolute', top: 220, left: 50, right: 50, textAlign: 'center', transform: `scale(${s})`,
    fontFamily: 'DejaVu Sans, sans-serif', fontSize: 76, fontWeight: 900, color: '#fff', lineHeight: 1.15,
    textShadow: '0 0 12px #000, 0 6px 0 #000', background: 'rgba(0,0,0,0.25)', borderRadius: 24, padding: '20px 24px'}}>{text}</div>;
};

export const UgcReel: React.FC<P> = (p) => {
  const {fps} = useVideoConfig(); const intro = Math.round(p.reactionSec * fps);
  return <AbsoluteFill style={{background: BASE.dark}}>
    <Sequence durationInFrames={intro}>
      <AbsoluteFill><OffthreadVideo src={staticFile(p.reaction)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
      <Intro text={p.reactionHook} />
    </Sequence>
    {/* задача стартует сразу с доски (пропускаем 2.5 с текстового хука шаблона) */}
    <Sequence from={intro}><PuzzleReel {...p} offset={Math.round(2.5 * fps)} /></Sequence>
  </AbsoluteFill>;
};
