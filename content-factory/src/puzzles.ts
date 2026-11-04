import {Chess} from 'chess.js';
import platform from './puzzles.json';
import lichess from './puzzles-lichess.json';

export type Puzzle = {fen: string; moves: string[]; rating: number; last: {from: string; to: string} | null; id?: string; bucket?: string};
type Raw = {fen: string; moves: string[]; rating: number; setup?: string; id?: string; bucket?: string};

// source: 'lichess' (5k популярных задач, CC0) | 'platform' (задачи с платформы)
// bucket: mateIn1 | mateIn2 | opening | fork | pin | sacrifice | smothered | queenSac | endgame | '' (все)
export const getPuzzle = (index: number, source = 'lichess', bucket = 'mateIn1'): Puzzle => {
  const all = (source === 'platform' ? platform : lichess) as Raw[];
  const list = bucket && source === 'lichess' ? all.filter((p) => p.bucket === bucket) : all;
  const p = list[index % list.length];
  if (!p.setup) return {...p, last: null};
  const g = new Chess(p.fen);
  const r = g.move({from: p.setup.slice(0, 2), to: p.setup.slice(2, 4), promotion: p.setup[4] || 'q'});
  return {fen: g.fen(), moves: p.moves, rating: p.rating, last: {from: r.from, to: r.to}, id: p.id, bucket: p.bucket};
};
