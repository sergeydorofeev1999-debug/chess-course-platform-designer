'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Target, PenLine, Timer, Infinity } from 'lucide-react';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS   = ['8','7','6','5','4','3','2','1'];
// board squares use CSS variables (Heirloom palette)
// const LIGHT_SQ = '#f0d9b5'; // REMOVED — use var(--square-light)
// const DARK_SQ  = '#b58863'; // REMOVED — use var(--square-dark)

/* ═══ Piece image (cburnett PNGs, same as lesson 38) ═══ */
function PieceImg({ type, color, size }: { type: string; color: 'w' | 'b'; size: number }) {
  const pieceKey = `${color}${type.toUpperCase()}`;
  return (
    <img
      src={`/pieces/cburnett/${pieceKey}.svg`}
      alt=""
      draggable={false}
      style={{
        width: Math.round(size * 0.85),
        height: Math.round(size * 0.85),
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
      }}
    />
  );
}

/* ═══ Helpers ═══ */
const START_POS: Record<string, {t:string;c:'w'|'b'}> = {};
for (let f = 0; f < 8; f++) {
  START_POS[`${FILES[f]}2`] = { t: 'p', c: 'w' };
  START_POS[`${FILES[f]}7`] = { t: 'p', c: 'b' };
}
const BACK = ['r','n','b','q','k','b','n','r'];
BACK.forEach((t, i) => { START_POS[`${FILES[i]}1`] = { t, c: 'w' }; });
BACK.forEach((t, i) => { START_POS[`${FILES[i]}8`] = { t, c: 'b' }; });

function randomSquare(): string {
  return `${FILES[Math.floor(Math.random() * 8)]}${RANKS[Math.floor(Math.random() * 8)]}`;
}
function randomOpts(count: number, exclude: string): string[] {
  const set = new Set<string>([exclude]);
  while (set.size < count + 1) set.add(randomSquare());
  const arr = Array.from(set);
  arr.splice(arr.indexOf(exclude), 1);
  return arr.slice(0, count);
}

/* ═══ Types ═══ */
type Mode = 'find' | 'name';
type Time = '30' | 'unlimited';
type Side = 'white' | 'black' | 'random';

interface Props {
  onComplete?: () => void;
  lessonId?: string;
}

/* ═══ Component ═══ */
export default function CoordinateTrainingBoard({ onComplete }: Props) {
  const [mode, setMode]       = useState<Mode>('find');
  const [timeMode, setTime]   = useState<Time>('30');
  const [side, setSide]       = useState<Side>('random');
  const [effectiveSide, setEffectiveSide] = useState<'white'|'black'>('white');
  const [showCoords, setCoords] = useState(true);
  const [showPieces, setPieces] = useState(true);

  const [phase, setPhase]     = useState<'settings' | 'playing' | 'result'>('settings');
  const [score, setScore]     = useState(0);
  const [errors, setErrors]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [target, setTarget]   = useState('');
  const [nameOpts, setNameOpts] = useState<string[]>([]);
  const [flashSq, setFlashSq] = useState<string | null>(null);
  const [flashOk, setFlashOk] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sqSize, setSqSize] = useState(52);

  /* board order based on effectiveSide */
  const dFiles = effectiveSide === 'white' ? FILES : [...FILES].reverse(); // white: a→h, black: h→a
  const dRanks = effectiveSide === 'black' ? [...RANKS].reverse() : RANKS; // white: 8..1 top (white bottom), black: 1..8 top (black bottom)

  useEffect(() => {
    const upd = () => {
      const mob = window.innerWidth < 1024;
      setSqSize(mob
        ? Math.min(64, Math.max(36, Math.floor((window.innerWidth - 24) / 8)))
        : Math.min(64, Math.max(48, Math.floor((window.innerWidth - 340) / 8)))
      );
    };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const nextQuestion = useCallback(() => {
    const sq = randomSquare();
    setTarget(sq);
    setFlashSq(null);
    setFlashOk(null);
    if (mode === 'name') {
      const opts = randomOpts(3, sq);
      opts.push(sq);
      setNameOpts(opts.sort(() => Math.random() - 0.5));
    }
  }, [mode]);

  const startGame = useCallback(() => {
    setScore(0);
    setErrors(0);
    setTimeLeft(timeMode === '30' ? 30 : 0);
    const chosen = side === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : side;
    setEffectiveSide(chosen);
    setPhase('playing');
    nextQuestion();
    if (timeMode === '30') {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 0.1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase('result');
            return 0;
          }
          return Math.max(0, t - 1);
        });
      }, 1000);
    }
  }, [timeMode, side, nextQuestion]);

  const stopGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('result');
  }, []);

  const handleClick = useCallback((square: string) => {
    if (phase !== 'playing') return;
    if (mode === 'find') {
      if (square === target) {
        setScore(s => s + 1);
        setFlashSq(square);
        setFlashOk(true);
        setTimeout(() => nextQuestion(), 350);
      } else {
        setErrors(e => e + 1);
        setFlashSq(square);
        setFlashOk(false);
        setTimeout(() => { setFlashSq(null); setFlashOk(null); }, 450);
      }
    }
  }, [phase, mode, target, nextQuestion]);

  const handleName = useCallback((ans: string) => {
    if (phase !== 'playing') return;
    if (ans === target) {
      setScore(s => s + 1);
      setFlashSq(target);
      setFlashOk(true);
      setTimeout(() => nextQuestion(), 350);
    } else {
      setErrors(e => e + 1);
      setFlashSq(target);
      setFlashOk(false);
      setTimeout(() => { setFlashSq(null); setFlashOk(null); }, 450);
    }
  }, [phase, target, nextQuestion]);

  const isLight = (fi: number, ri: number) => (fi + ri) % 2 === 0;

  /* ═══════════════════════════ SETTINGS ═══════════════════════════ */
  if (phase === 'settings') {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 py-6">
        {/* Hero card */}
        <div
          className="rounded-2xl py-7 px-6 w-full text-center relative overflow-hidden mb-4"
          style={{
            background: 'linear-gradient(135deg, #2C241B 0%, #3A2E1F 50%, #2C241B 100%)',
          }}
        >
          <h2 className="text-white text-2xl font-bold mb-2">Координаты</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#E8D5B5' }}>
            Тренируйтесь находить и обозначать поля на шахматной доске.
            Выберите режим, сторону и настройки.
          </p>
          <div
            className="absolute bottom-0 left-[10%] right-[10%] h-[3px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Mode selection */}
        <div className="flex w-full gap-2">
          <button
            onClick={() => setMode('find')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-150 ease-out flex items-center justify-center gap-2 ${
              mode === 'find'
                ? 'bg-[#5A4A3A] text-white'
                : 'bg-[#F9F8F6] text-[#5A4A3A] border border-[#D4C5B5] hover:bg-white hover:border-[#C9A84C]'
            }`}
          >
            <Target className={`w-5 h-5 ${mode === 'find' ? 'text-white' : 'text-[#8B7355]'}`} />
            Найти поле
          </button>
          <button
            onClick={() => setMode('name')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-150 ease-out flex items-center justify-center gap-2 ${
              mode === 'name'
                ? 'bg-[#5A4A3A] text-white'
                : 'bg-[#F9F8F6] text-[#5A4A3A] border border-[#D4C5B5] hover:bg-white hover:border-[#C9A84C]'
            }`}
          >
            <PenLine className={`w-5 h-5 ${mode === 'name' ? 'text-white' : 'text-[#8B7355]'}`} />
            Обозначить поле
          </button>
        </div>

        {/* Time selection */}
        <div className="flex w-full gap-2">
          <button
            onClick={() => setTime('unlimited')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-150 ease-out flex items-center justify-center gap-2 ${
              timeMode === 'unlimited'
                ? 'bg-[#5A4A3A] text-white'
                : 'bg-[#F9F8F6] text-[#5A4A3A] border border-[#D4C5B5] hover:bg-white hover:border-[#C9A84C]'
            }`}
          >
            <Infinity className={`w-5 h-5 ${timeMode === 'unlimited' ? 'text-white' : 'text-[#8B7355]'}`} />
            Без ограничения
          </button>
          <button
            onClick={() => setTime('30')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-150 ease-out flex items-center justify-center gap-2 ${
              timeMode === '30'
                ? 'bg-[#5A4A3A] text-white'
                : 'bg-[#F9F8F6] text-[#5A4A3A] border border-[#D4C5B5] hover:bg-white hover:border-[#C9A84C]'
            }`}
          >
            <Timer className={`w-5 h-5 ${timeMode === '30' ? 'text-white' : 'text-[#8B7355]'}`} />
            0:30
          </button>
        </div>

        {/* Side selection */}
        <div className="flex w-full gap-2 justify-center">
          <button
            onClick={() => setSide('white')}
            className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-150 ease-out ${
              side === 'white'
                ? 'bg-[#5A4A3A] border-2 border-[#5A4A3A] scale-105 shadow-[0_2px_8px_rgba(90,74,58,0.25)]'
                : 'bg-white border-2 border-[#D4C5B5] hover:border-[#C9A84C] hover:bg-[#F9F8F6]'
            }`}
          >
            <div className="w-8 h-8"><PieceImg type="k" color="w" size={32} /></div>
          </button>
          <button
            onClick={() => setSide('random')}
            className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-150 ease-out ${
              side === 'random'
                ? 'bg-[#5A4A3A] border-2 border-[#5A4A3A] scale-105 shadow-[0_2px_8px_rgba(90,74,58,0.25)]'
                : 'bg-white border-2 border-[#D4C5B5] hover:border-[#C9A84C] hover:bg-[#F9F8F6]'
            }`}
          >
            <div className="flex -space-x-1">
              <div className="w-5 h-5"><PieceImg type="k" color="b" size={20} /></div>
              <div className="w-5 h-5"><PieceImg type="k" color="w" size={20} /></div>
            </div>
          </button>
          <button
            onClick={() => setSide('black')}
            className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-150 ease-out ${
              side === 'black'
                ? 'bg-[#5A4A3A] border-2 border-[#5A4A3A] scale-105 shadow-[0_2px_8px_rgba(90,74,58,0.25)]'
                : 'bg-white border-2 border-[#D4C5B5] hover:border-[#C9A84C] hover:bg-[#F9F8F6]'
            }`}
          >
            <div className="w-8 h-8"><PieceImg type="k" color="b" size={32} /></div>
          </button>
        </div>

        {/* Toggles */}
        <div className="flex flex-col w-full gap-3 bg-white rounded-xl p-3 shadow-sm border border-[#E8E0D5]">
          <label className="flex items-center justify-between text-sm">
            <span className="text-[#2C241B] font-medium">Показывать координаты</span>
            <button onClick={() => setCoords(v => !v)} className={`w-12 h-6 rounded-full transition-all duration-200 ${showCoords ? 'bg-[#C9A84C]' : 'bg-[#D4C5B5]'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full mt-0.5 transition-all duration-200 ${showCoords ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-[#2C241B] font-medium">Показывать фигуры</span>
            <button onClick={() => setPieces(v => !v)} className={`w-12 h-6 rounded-full transition-all duration-200 ${showPieces ? 'bg-[#C9A84C]' : 'bg-[#D4C5B5]'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full mt-0.5 transition-all duration-200 ${showPieces ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>

        {/* CTA */}
        <button
          onClick={startGame}
          className="w-full py-4 rounded-2xl text-base font-bold uppercase tracking-widest text-[#2C241B] transition-all duration-200 ease-out relative overflow-hidden active:scale-[0.98]"
          style={{
            background: 'linear-gradient(180deg, #D4A84C 0%, #C9A84C 100%)',
            boxShadow: '0 4px 16px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #C9A84C 0%, #B8973D 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #D4A84C 0%, #C9A84C 100%)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Начать тренировку
        </button>
      </div>
    );
  }

  /* ═══════════════════════════ RESULT ═══════════════════════════ */
  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto px-4 py-6">
        {/* Score card (hero-style) */}
        <div
          className="rounded-2xl p-6 w-full text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2C241B 0%, #3A2E1F 50%, #2C241B 100%)',
          }}
        >
          <Trophy className="w-12 h-12 text-[#C9A84C] mx-auto mb-3" />
          <h2 className="text-white text-2xl font-bold mb-2">Результат</h2>
          <div className="text-white text-5xl font-mono font-bold mb-1">{score}</div>
          <div className="text-[#8B7355] text-sm mb-4">правильных ответов</div>
          {errors > 0 && <div className="text-[#B04A3A] text-sm">Ошибок: {errors}</div>}
          <div
            className="absolute bottom-0 left-[10%] right-[10%] h-[3px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex w-full gap-3">
          <button
            onClick={() => setPhase('settings')}
            className="flex-1 py-3 px-4 bg-[#4A3A2A] hover:bg-[#5A4A3A] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition duration-150"
          >
            <ArrowLeft className="w-4 h-4 text-white" /> Настройки
          </button>
          <button
            onClick={startGame}
            className="flex-1 py-3 px-4 bg-[#C9A84C] hover:bg-[#B8973D] text-[#2C241B] rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition duration-150"
          >
            <RotateCcw className="w-4 h-4 text-[#2C241B]" /> Заново
          </button>
        </div>

        {onComplete && score >= 5 && (
          <button
            onClick={onComplete}
            className="w-full py-4 rounded-2xl text-base font-bold uppercase tracking-widest text-[#2C241B] transition-all duration-200 ease-out relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #D4A84C 0%, #C9A84C 100%)',
              boxShadow: '0 4px 16px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #C9A84C 0%, #B8973D 100%)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #D4A84C 0%, #C9A84C 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Урок пройден ✓
          </button>
        )}
      </div>
    );
  }

  /* ═══════════════════════════ PLAYING ═══════════════════════════ */
  return (
    <div className="flex flex-col items-center gap-2 w-full px-2">
      {/* Timer bar */}
      {timeMode === '30' && (
        <div className="w-full h-1.5 bg-[#E8E0D5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A84C] rounded-full"
            style={{
              width: `${((30 - timeLeft) / 30) * 100}%`,
              transition: 'width 1s linear',
            }}
          />
        </div>
      )}

      {/* Score / Time bar */}
      <div className="flex w-full justify-between items-center bg-white rounded-xl p-3 border border-[#E8E0D5] shadow-sm">
        <div className="flex flex-col">
          <span className="text-[#8B7355] text-xs uppercase">Результат</span>
          <span className="text-[#2C241B] font-bold text-lg">{score}</span>
        </div>
        {timeMode === '30' && (
          <div className="flex flex-col items-end">
            <span className="text-[#8B7355] text-xs uppercase">Время</span>
            <span className="text-[#2C241B] font-mono font-bold text-lg">{timeLeft.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Prompt (find mode) */}
      {mode === 'find' && target && (
        <div
          className="text-center py-4 rounded-xl border border-[#E8E0D5] w-full mb-2"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F8F6 100%)',
          }}
        >
          <span className="text-5xl font-bold text-[#2C241B]" style={{ textShadow: '0 1px 2px rgba(44,36,27,0.1)' }}>{target}</span>
        </div>
      )}

      {/* BOARD */}
      <div className="flex justify-center w-full">
        <div
          className="grid border-[3px] border-[#2C241B] rounded-sm relative select-none"
          style={{
            gridTemplateColumns: `repeat(8, ${sqSize}px)`,
            gridTemplateRows: `repeat(8, ${sqSize}px)`,
          }}
        >
          {dRanks.map((rank, ri) =>
            dFiles.map((file, fi) => {
              const sq = `${file}${rank}`;
              const piece = showPieces ? START_POS[sq] : null;
              const light = isLight(fi, ri);
              const isFlash = flashSq === sq;
              const flashBg = isFlash
                ? flashOk === true
                  ? 'rgba(201,168,76,0.55)'
                  : 'rgba(176,74,58,0.55)'
                : null;
              const isTarget = mode === 'name' && target === sq;

              return (
                <div
                  key={sq}
                  data-square={sq}
                  className="flex items-center justify-center relative select-none"
                  style={{
                    width: sqSize,
                    height: sqSize,
                    backgroundColor: flashBg || (light ? 'var(--square-light)' : 'var(--square-dark)'),
                    cursor: mode === 'find' ? 'pointer' : 'default',
                  }}
                  onClick={() => handleClick(sq)}
                >
                  {/* Coordinates */}
                  {showCoords && fi === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${light ? 'text-[#8B6914]' : 'text-[#E8D5B5]'}`}>{rank}</span>
                  )}
                  {showCoords && ri === 7 && (
                    <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${light ? 'text-[#8B6914]' : 'text-[#E8D5B5]'}`}>{file}</span>
                  )}

                  {/* name-mode target highlight */}
                  {isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="w-3/4 h-3/4 rounded-full animate-pulse"
                        style={{
                          background: 'rgba(201,168,76,0.35)',
                          border: '2px solid rgba(201,168,76,0.5)',
                        }}
                      />
                    </div>
                  )}

                  {/* Piece */}
                  {piece && (
                    <div className="relative pointer-events-none z-10">
                      <PieceImg type={piece.t} color={piece.c} size={sqSize} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* name mode options */}
      {mode === 'name' && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-2">
          {nameOpts.map(opt => (
            <button key={opt} onClick={() => handleName(opt)}
              className="py-3 bg-white border-2 border-[#D4C5B5] rounded-lg font-bold text-lg text-[#2C241B] transition-all duration-150 ease-out hover:bg-[#F9F8F6] hover:border-[#C9A84C] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(201,168,76,0.15)] active:scale-[0.97] active:bg-[#E8E0D5]"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Stop */}
      <div className="flex gap-2 mt-2 w-full max-w-sm">
        <button onClick={stopGame} className="flex-1 py-2.5 bg-[#F5F0E8] text-[#2C241B] border border-[#D4C9B8] rounded-lg text-sm font-medium transition duration-150 hover:bg-[#EBE4DA]">Стоп</button>
      </div>
    </div>
  );
}
