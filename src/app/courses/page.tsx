import Link from 'next/link';
import { getCourses } from '@/lib/data';
import { Clock, BarChart3, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <span className="section-title">Библиотека курсов</span>
        <h1 className="heading-1 mt-2 mb-3">Выбери свой путь</h1>
        <p className="max-w-lg body-text" style={{ color: 'var(--text-secondary)' }}>
          Каждый курс — это приключение. Начни с основ и расти до мастера.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any, index: number) => (
          <Link key={course.id} href={`/courses/${course.id}`} className="group block">
            <div className="card rounded-2xl overflow-hidden h-full flex flex-col">
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
                <div className="absolute inset-0 opacity-10"
                  style={{ background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)' }}
                />
                <span className="text-6xl relative z-10">♟️</span>
                
                <div className="absolute top-3 right-3">
                  <div 
                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ 
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--surface-border)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <BarChart3 size={12} />
                    {course.level === 'beginner' ? 'Начинающий' : course.level}
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 
                  className="font-bold text-lg mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {course.title}
                </h3>
                <p className="text-sm line-clamp-2 flex-1 leading-relaxed mb-4"
                  style={{ color: 'var(--text-secondary)' }}
                >{course.description}</p>
                
                <div className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid var(--surface-border)' }}
                >
                  <div className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Clock size={13} />
                    Курс
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
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
