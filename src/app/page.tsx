import Link from 'next/link';
import { BookOpen, Trophy, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32 px-4 text-center"
        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none"
          style={{ background: 'var(--accent)' }}
        />
        
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
            style={{ 
              background: 'var(--bg-elevated)',
              border: '1px solid var(--surface-border)',
              color: 'var(--accent)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            Премиальная платформа
          </div>
          
          <h1 className="heading-1 mb-6">
            Chess Progress
            <span className="block mt-2" style={{ color: 'var(--accent)', fontSize: '0.75em', fontWeight: 300 }}>Academy</span>
          </h1>
          
          <p className="max-w-xl mx-auto mb-10 leading-relaxed body-text"
            style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}
          >
            Научись играть в шахматы интерактивно. От первых ходов до победных матов — 
            через приключение, а не учебник.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/courses" className="btn btn-primary group">
              Начать обучение
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/courses/1"
              className="btn"
              style={{ 
                color: 'var(--text-tertiary)',
                border: '1px solid var(--surface-border)',
                padding: '10px 24px'
              }}
            >
              Смотреть демо
            </Link>
          </div>
        </div>

        {/* Decorative board */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[320px] h-[160px] opacity-[0.04] pointer-events-none"
          style={{ color: 'var(--text-primary)' }}
        >
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="300" height="140" rx="4" stroke="currentColor" strokeWidth="4"/>
            <path d="M10 38h300M10 66h300M10 94h300M10 122h300" stroke="currentColor" strokeWidth="2"/>
            <path d="M48 10v140M86 10v140M124 10v140M162 10v140M200 10v140M238 10v140M276 10v140" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="section-title">Что внутри</span>
          <h2 className="heading-2 mt-3 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            Не просто уроки — приключение
          </h2>
          <p className="max-w-lg mx-auto body-text" style={{ color: 'var(--text-secondary)' }}>
            Каждый урок превращает обучение в игру. Звёзды, уровни, достижения.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: '40+ интерактивных уроков', desc: 'От доски и фигур до первой партии. Собирай звёзды и открывай новые уровни.', color: 'var(--accent)' },
            { icon: Trophy, title: 'Живая доска', desc: 'Ходи фигурами, реши задачи, почувствуй тактильность настоящей шахматной игры.', color: 'var(--accent)' },
            { icon: Users, title: 'Путь мастера', desc: 'Отслеживай прогресс в кабинете. Каждый пройденный урок — шаг к мастерству.', color: 'var(--accent)' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-7 text-center group">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${color}12` }}
              >
                <Icon size={26} style={{ color }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 px-4 text-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[80px] pointer-events-none"
          style={{ background: 'var(--accent)' }}
        />
        
        <div className="relative max-w-2xl mx-auto">
          <span className="text-6xl mb-6 block">♟️</span>
          <h2 className="heading-2 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            Первый курс уже доступен
          </h2>
          <p className="mb-8 leading-relaxed body-text" style={{ color: 'var(--text-secondary)' }}>
            «Шахматы с нуля» — полный путь от первых фигур до уверенной игры. 
            40 уроков, звёзды, уровни сложности.
          </p>
          <Link href="/courses/1" className="btn btn-primary group">
            Перейти к курсу
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
