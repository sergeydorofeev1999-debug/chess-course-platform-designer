import Link from 'next/link';
import { getCourses } from '@/lib/data';
import { Clock, BarChart3, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <span className="text-xs font-bold text-[#2E6B7A] uppercase tracking-[0.2em]">Библиотека курсов</span>
        <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-3 text-[#1A1816]">Выбери свой путь</h1>
        <p className="text-[#6B6560] max-w-lg text-base">Каждый курс — это приключение. Начни с основ и расти до мастера.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any, index: number) => (
          <Link key={course.id} href={`/courses/${course.id}`} className="group block">
            <div className="collectible-card rounded-2xl overflow-hidden h-full flex flex-col">
              {/* Card top */}
              <div 
                className="h-44 flex items-center justify-center relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(145deg, ${[
                    '#1E3A2F', '#2E1E3A', '#3A2E1E', '#1E2E3A', '#3A1E1E', '#1E3A3A'
                  ][index % 6]} 0%, ${[
                    '#0F1F18', '#1E0F1F', '#1F180F', '#0F181F', '#1F0F0F', '#0F1F1F'
                  ][index % 6]} 100%)`
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,0 L100,100 M100,0 L0,100" stroke="white" strokeWidth="0.5"/>
                  </svg>
                </div>
                <span className="text-6xl relative z-10 float-gentle">♟️</span>
                
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1.5 bg-[#1A1816]/40 backdrop-blur-sm text-[#F5F0EB] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#F5F0EB]/10">
                    <BarChart3 size={12} />
                    {course.level === 'beginner' ? 'Начинающий' : course.level}
                  </div>
                </div>
              </div>
              
              {/* Card body */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 text-[#1A1816] group-hover:text-[#2E6B7A] transition-colors">{course.title}</h3>
                <p className="text-sm text-[#6B6560] mb-4 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-[#EDE8E2]">
                  <div className="flex items-center gap-1.5 text-xs text-[#9E9892]">
                    <Clock size={13} />
                    Курс
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#2E6B7A] group-hover:text-[#C9A84C] transition-colors">
                    Начать
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
