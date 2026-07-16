'use client';

import { ArrowRight, BookOpen, Trophy } from 'lucide-react';

const DIRECTIONS = [
  {
    key: 'a',
    name: 'A — Apple Chess',
    desc: 'Calm · Precision · Air · Confidence',
    accent: '#0071E3',
    vars: {
      '--bg-primary': '#FAFAFA',
      '--bg-secondary': '#F5F5F7',
      '--bg-elevated': '#FFFFFF',
      '--text-primary': '#1D1D1F',
      '--text-secondary': '#86868B',
      '--text-tertiary': '#A1A1A6',
      '--accent': '#0071E3',
      '--shadow-sm': '0 0.5px 1px rgba(0,0,0,0.04)',
      '--shadow-md': '0 2px 8px rgba(0,0,0,0.04)',
      '--shadow-lg': '0 8px 24px rgba(0,0,0,0.06)',
      '--square-light': '#F0ECE6',
      '--square-dark': '#B8A99A',
      '--square-selected': 'rgba(0,113,227,0.3)',
      '--square-valid': 'rgba(0,113,227,0.6)',
      '--square-rank-file': 'rgba(0,0,0,0.3)',
      '--piece-shadow-inline': 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))',
      '--star-filter': 'brightness(1) saturate(1)',
      '--progress-track': '#E8E8ED',
      '--progress-fill': 'linear-gradient(90deg, #0071E3, #5AC8FA)',
      '--card-bg': '#FFFFFF',
      '--card-border': '1px solid rgba(0,0,0,0.06)',
      '--card-shadow': 'none',
      '--card-hover-shadow': '0 4px 16px rgba(0,0,0,0.04)',
      '--radius-sm': '6px',
      '--radius-md': '10px',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    },
  },
  {
    key: 'b',
    name: 'B — Nintendo Chess',
    desc: 'Joy · Warmth · Delight · Rounded',
    accent: '#FF6B35',
    vars: {
      '--bg-primary': '#FFF8F0',
      '--bg-secondary': '#FFEFDB',
      '--bg-elevated': '#FFFFFF',
      '--text-primary': '#2D1B0E',
      '--text-secondary': '#6B4E3D',
      '--text-tertiary': '#A89080',
      '--accent': '#FF6B35',
      '--shadow-sm': '0 2px 0 rgba(45,27,14,0.06), 0 2px 8px rgba(45,27,14,0.08)',
      '--shadow-md': '0 4px 0 rgba(45,27,14,0.06), 0 4px 16px rgba(45,27,14,0.1)',
      '--shadow-lg': '0 6px 0 rgba(45,27,14,0.06), 0 8px 24px rgba(45,27,14,0.12)',
      '--square-light': '#F5DEB3',
      '--square-dark': '#C4956A',
      '--square-selected': 'rgba(255,107,53,0.3)',
      '--square-valid': 'rgba(255,107,53,0.6)',
      '--square-rank-file': 'rgba(45,27,14,0.4)',
      '--piece-shadow-inline': 'drop-shadow(0 3px 6px rgba(45,27,14,0.25))',
      '--star-filter': 'brightness(1.2) saturate(1.1)',
      '--progress-track': '#FFEFDB',
      '--progress-fill': 'linear-gradient(90deg, #FF6B35, #FFD93D)',
      '--card-bg': '#FFFFFF',
      '--card-border': '2px solid rgba(255,107,53,0.12)',
      '--card-shadow': '0 4px 0 rgba(45,27,14,0.06), 0 4px 12px rgba(45,27,14,0.08)',
      '--card-hover-shadow': '0 6px 0 rgba(45,27,14,0.05), 0 12px 32px rgba(45,27,14,0.12)',
      '--radius-sm': '12px',
      '--radius-md': '20px',
      '--font-heading': '"Nunito", system-ui, sans-serif',
    },
  },
  {
    key: 'c',
    name: 'C — Luxury Chess',
    desc: 'Craft · Wood · Brass · Paper',
    accent: '#B8956A',
    vars: {
      '--bg-primary': '#F5F0EB',
      '--bg-secondary': '#EDE8E2',
      '--bg-elevated': '#FAF8F5',
      '--text-primary': '#2C241B',
      '--text-secondary': '#5C4D3D',
      '--text-tertiary': '#8B7D6B',
      '--accent': '#B8956A',
      '--shadow-sm': '0 1px 2px rgba(44,36,27,0.06), 0 1px 3px rgba(44,36,27,0.04)',
      '--shadow-md': '0 4px 6px rgba(44,36,27,0.07), 0 2px 4px rgba(44,36,27,0.05)',
      '--shadow-lg': '0 12px 24px rgba(44,36,27,0.09), 0 4px 8px rgba(44,36,27,0.06)',
      '--square-light': '#EBD6B3',
      '--square-dark': '#A67C52',
      '--square-selected': 'rgba(184,149,106,0.3)',
      '--square-valid': 'rgba(184,149,106,0.6)',
      '--square-rank-file': 'rgba(44,36,27,0.4)',
      '--piece-shadow-inline': 'drop-shadow(0 2px 4px rgba(44,36,27,0.3))',
      '--star-filter': 'brightness(0.95) saturate(0.9)',
      '--progress-track': '#E8E0D6',
      '--progress-fill': 'linear-gradient(90deg, #B8956A, #D4B896)',
      '--card-bg': 'linear-gradient(145deg, #FFFFFF, #FAF8F5)',
      '--card-border': '1px solid rgba(92,64,51,0.08)',
      '--card-shadow': '0 1px 2px rgba(44,36,27,0.04), 0 8px 24px rgba(44,36,27,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
      '--card-hover-shadow': '0 2px 4px rgba(44,36,27,0.05), 0 12px 32px rgba(44,36,27,0.1), inset 0 1px 0 rgba(255,255,255,0.7)',
      '--radius-sm': '4px',
      '--radius-md': '8px',
      '--font-heading': '"Playfair Display", Georgia, serif',
    },
  },
  {
    key: 'd',
    name: 'D — Digital Chess 2026',
    desc: 'Responsive · Alive · Intelligent · Focused',
    accent: '#00D4AA',
    vars: {
      '--bg-primary': '#0D0D0F',
      '--bg-secondary': '#141416',
      '--bg-elevated': '#1A1A1E',
      '--text-primary': '#F0F0F2',
      '--text-secondary': '#8A8A8E',
      '--text-tertiary': '#5C5C60',
      '--accent': '#00D4AA',
      '--shadow-sm': '0 0 0 1px rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)',
      '--shadow-md': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.4)',
      '--shadow-lg': '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
      '--square-light': '#1E2933',
      '--square-dark': '#0F1923',
      '--square-selected': 'rgba(0,212,170,0.25)',
      '--square-valid': 'rgba(0,212,170,0.5)',
      '--square-rank-file': 'rgba(0,212,170,0.3)',
      '--piece-shadow-inline': 'drop-shadow(0 0 4px rgba(0,212,170,0.3))',
      '--star-filter': 'brightness(1.2) saturate(1.3) drop-shadow(0 0 4px rgba(0,212,170,0.5))',
      '--progress-track': '#1A1A1E',
      '--progress-fill': 'linear-gradient(90deg, #00D4AA, #5DADE2)',
      '--card-bg': 'rgba(26,26,30,0.8)',
      '--card-border': '1px solid rgba(255,255,255,0.06)',
      '--card-shadow': '0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
      '--card-hover-shadow': '0 0 0 1px rgba(0,212,170,0.15), 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,170,0.08)',
      '--radius-sm': '6px',
      '--radius-md': '10px',
      '--font-heading': '"SF Mono", "JetBrains Mono", monospace',
    },
  },
];

function MiniBoard({ dir }: { dir: typeof DIRECTIONS[0] }) {
  const sqSize = 28;
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['8','7','6','5','4','3','2','1'];
  const isLight = (f: number, r: number) => (f + r) % 2 === 0;

  return (
    <div className="rounded overflow-hidden mx-auto"
      style={{
        border: `3px solid ${dir.key === 'd' ? 'rgba(0,212,170,0.15)' : '#D2D2D7'}`,
        boxShadow: dir.vars['--shadow-md'] as string,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(8, ${sqSize}px)`, gridTemplateRows: `repeat(8, ${sqSize}px)` }}>
        {ranks.map((rank, ri) =>
          files.map((file, fi) => {
            const light = isLight(fi, ri);
            const isSelected = file === 'e' && rank === '4';
            const isValid = (file === 'e' && rank === '5') || (file === 'f' && rank === '4') || (file === 'd' && rank === '4');
            return (
              <div key={`${file}${rank}`}
                className="flex items-center justify-center relative"
                style={{
                  width: sqSize,
                  height: sqSize,
                  backgroundColor: light ? dir.vars['--square-light'] as string : dir.vars['--square-dark'] as string,
                }}
              >
                {isSelected && <div className="absolute inset-[1px] rounded-[3px]" style={{ background: dir.vars['--square-selected'] as string }} />}
                {isValid && <div className="absolute w-2 h-2 rounded-full" style={{ background: dir.vars['--square-valid'] as string, opacity: 0.7 }} />}
                {fi === 0 && <span className="absolute top-0.5 left-1 text-[8px] font-bold"
                  style={{ color: light ? dir.vars['--square-dark'] : dir.vars['--square-light'] }}
                >{rank}</span>}
                {ri === 7 && <span className="absolute bottom-0.5 right-1 text-[8px] font-bold"
                  style={{ color: light ? dir.vars['--square-dark'] : dir.vars['--square-light'] }}
                >{file}</span>}
                {file === 'e' && rank === '4' && (
                  <img src="/pieces/cburnett/wP.svg" className="w-5 h-5 relative z-10" draggable={false}
                    style={{ filter: dir.vars['--piece-shadow-inline'] as string }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DirectionPreview({ dir }: { dir: typeof DIRECTIONS[0] }) {
  const v = dir.vars as Record<string, string>;
  
  return (
    <div className="flex flex-col h-full"
      style={{
        ...v,
        fontFamily: v['--font-heading'],
        background: v['--bg-secondary'],
        color: v['--text-primary'],
      }}
    >
      {/* Header label */}
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: v['--text-tertiary'] + '20', background: v['--bg-primary'] }}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: v['--accent'] }}>
            {dir.name}
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: v['--text-tertiary'] }}>{dir.desc}</p>
        </div>
        <div className="w-4 h-4 rounded-full" style={{ background: v['--accent'] }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Hero mini */}
        <div className="text-center py-6 rounded-xl"
          style={{ background: v['--bg-primary'], border: `1px solid ${v['--text-tertiary']}15` }}
        >
          <span className="text-3xl block mb-2">♟️</span>
          <h2 className="text-lg font-bold mb-1">Chess Progress</h2>
          <p className="text-xs px-3" style={{ color: v['--text-secondary'] }}>
            Научись играть через приключение
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: v['--accent'], color: '#fff' }}
          >
            Начать <ArrowRight size={12} />
          </div>
        </div>

        {/* Board */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: v['--text-tertiary'] }}>
            Интерактивная доска
          </p>
          <MiniBoard dir={dir} />
        </div>

        {/* Feature card */}
        <div className="p-4 rounded-xl"
          style={{
            background: v['--card-bg'],
            border: v['--card-border'],
            boxShadow: v['--card-shadow'],
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: v['--accent'] + '12' }}
            >
              <BookOpen size={18} style={{ color: v['--accent'] }} />
            </div>
            <span className="font-bold text-sm">40+ уроков</span>
          </div>
          <p className="text-xs" style={{ color: v['--text-secondary'] }}>
            От фигур до первой победы. Собирай звёзды.
          </p>
        </div>

        {/* Lesson card */}
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: v['--card-bg'],
            border: v['--card-border'],
            boxShadow: v['--card-shadow'],
          }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: v['--bg-hover'] }}
          >
            <img src="/pieces/cburnett/wR.svg" className="w-6 h-6" draggable={false}
              style={{ filter: v['--piece-shadow-inline'] }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">Ладья</p>
            <p className="text-[10px] truncate" style={{ color: v['--text-tertiary'] }}>Движется по прямой</p>
          </div>
          <div className="shrink-0 flex gap-0.5">
            {[1,2,3].map(s => (
              <img key={s} src="/images/learn/star.png" className="w-3.5 h-3.5"
                style={{ filter: v['--star-filter'], opacity: s <= 2 ? 1 : 0.25 }}
                draggable={false} alt=""
              />
            ))}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium" style={{ color: v['--text-primary'] }}>Прогресс</span>
            <span className="font-bold" style={{ color: v['--accent'] }}>62%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden"
            style={{ background: v['--progress-track'] }}
          >
            <div className="h-full rounded-full" style={{ width: '62%', background: v['--progress-fill'] }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            4 направления. 4 ощущения.
          </h1>
          <p className="text-[#8A8A8E] max-w-xl mx-auto">
            Сравни каждое направление бок о бок. Не выбирай красивейшее — выбирай то, 
            которое заставляет сразу захотеть решить первую задачу.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
          style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
        >
          {DIRECTIONS.map((dir) => (
            <div key={dir.key} className="h-full overflow-hidden rounded-2xl"
              style={{ border: `1px solid ${dir.accent}30` }}
            >
              <DirectionPreview dir={dir} />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#5C5C60]">
            Вернуться к <a href="/" className="text-[#00D4AA] hover:underline">главной странице</a>
          </p>
        </div>
      </div>
    </div>
  );
}
