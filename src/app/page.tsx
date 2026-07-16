import Link from 'next/link';
import { BookOpen, Trophy, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1A1816] text-[#F9F8F6] py-24 md:py-32 px-4 text-center">
        {/* Warm ambient glow behind the board area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C] opacity-[0.06] blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 text-[#C9A84C] text-xs font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            Премиальная платформа
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
            Chess Progress
            <span className="block text-[#C9A84C] text-3xl md:text-4xl font-light mt-2">Academy</span>
          </h1>
          
          <p className="text-base md:text-lg text-[#9E9892] max-w-xl mx-auto mb-10 leading-relaxed">
            Научись играть в шахматы интерактивно. От первых ходов до победных матов — 
            через приключение, а не учебник.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#DCC078] text-[#1A1816] font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-[0_4px_0_rgba(26,24,22,0.15),0_8px_24px_rgba(201,168,76,0.25)] hover:shadow-[0_6px_0_rgba(26,24,22,0.12),0_12px_32px_rgba(201,168,76,0.3)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(26,24,22,0.15)]"
            >
              Начать обучение
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/courses/1"
              className="inline-flex items-center gap-2 text-[#9E9892] hover:text-[#F5F0EB] font-medium px-6 py-4 rounded-xl border border-[#3D3A37] hover:border-[#6B6560] transition-all duration-200"
            >
              Смотреть демо
            </Link>
          </div>
        </div>

        {/* Decorative board silhouette */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[320px] h-[160px] opacity-[0.04] pointer-events-none">
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
          <span className="text-xs font-bold text-[#2E6B7A] uppercase tracking-[0.2em]">Что внутри</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-3">Не просто уроки — приключение</h2>
          <p className="text-[#6B6560] max-w-lg mx-auto">Каждый урок превращает обучение в игру. Звёзды, уровни, достижения.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: '40+ интерактивных уроков', desc: 'От доски и фигур до первой партии. Собирай звёзды и открывай новые уровни.', color: '#2E6B7A' },
            { icon: Trophy, title: 'Живая доска', desc: 'Ходи фигурами, реши задачи, почувствуй тактильность настоящей шахматной игры.', color: '#C9A84C' },
            { icon: Users, title: 'Путь мастера', desc: 'Отслеживай прогресс в кабинете. Каждый пройденный урок — шаг к мастерству.', color: '#5C4033' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="collectible-card rounded-2xl p-7 text-center group">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${color}12` }}
              >
                <Icon className="transition-colors" size={26} style={{ color }} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#1A1816]">{title}</h3>
              <p className="text-sm text-[#6B6560] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#F5F0EB] py-20 px-4 text-center">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#2E6B7A] opacity-[0.04] blur-[80px] pointer-events-none" />
        
        <div className="relative max-w-2xl mx-auto">
          <span className="inline-block text-6xl mb-6">♟️</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Первый курс уже доступен</h2>
          <p className="text-[#6B6560] mb-8 text-base leading-relaxed">
            «Шахматы с нуля» — полный путь от первых фигур до уверенной игры. 
            40 уроков, звёзды, уровни сложности.
          </p>
          <Link
            href="/courses/1"
            className="group inline-flex items-center gap-2 bg-[#1A1816] hover:bg-[#3D3A37] text-[#F9F8F6] font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-[0_4px_0_rgba(26,24,22,0.2),0_8px_24px_rgba(26,24,22,0.15)] hover:shadow-[0_6px_0_rgba(26,24,22,0.15),0_12px_32px_rgba(26,24,22,0.2)] hover:-translate-y-0.5 active:translate-y-0.5"
          >
            Перейти к курсу
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
