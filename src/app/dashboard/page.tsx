import Link from 'next/link';
import { getCurrentUserEnrollments, getCurrentUserCourseProgress } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, CheckCircle, Clock, ArrowRight, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    isAdmin = !!profile;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="heading-1 mb-3">Войдите в аккаунт</h1>
        <p className="mb-8 max-w-sm mx-auto body-text" style={{ color: 'var(--text-secondary)' }}>
          Чтобы видеть прогресс и открывать новые уровни, нужно авторизоваться.
        </p>
        <Link href="/auth" className="btn btn-primary">
          Войти
        </Link>
      </div>
    );
  }

  let enrollments: any[] = [];
  let progressPerCourse: Record<string, { completed: number; total: number }> = {};
  let dashboardError: string | null = null;

  try {
    enrollments = await getCurrentUserEnrollments();
    const courseIds = enrollments.map((e: any) => e.course_id);
    progressPerCourse = await getCurrentUserCourseProgress(courseIds);
  } catch (error) {
    console.error('Dashboard data error:', error);
    dashboardError = 'Не удалось загрузить данные кабинета. Попробуйте обновить страницу.';
  }

  const totalCourses = enrollments.length;
  const totalCompleted = Object.values(progressPerCourse).reduce((sum, p) => sum + p.completed, 0);
  const totalLessons = Object.values(progressPerCourse).reduce((sum, p) => sum + p.total, 0);
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <span className="section-title">Кабинет</span>
        <h1 className="heading-1 mt-2 mb-3">Мой путь</h1>
        <p className="body-text" style={{ color: 'var(--text-secondary)' }}>
          Отслеживай свой прогресс и открывай новые достижения.
        </p>
      </div>

      {dashboardError && (
        <div className="mb-6 rounded-xl border p-4 text-sm"
          style={{ borderColor: 'var(--surface-border)', background: 'var(--bg-elevated)', color: 'var(--accent)' }}
        >
          {dashboardError}
        </div>
      )}

      {isAdmin && (
        <div className="mb-8 p-5 rounded-2xl"
          style={{ 
            background: 'var(--bg-elevated)',
            border: '1px solid var(--surface-border)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold" style={{ color: 'var(--accent)' }}>Режим администратора</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Доступ к редактированию позиций</p>
            </div>
            <Link href="/admin/board" className="btn btn-primary">
              📝 Редактор позиций
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Курсов', value: totalCourses, icon: BookOpen },
          { label: 'Уроков пройдено', value: totalCompleted, icon: CheckCircle },
          { label: 'Всего уроков', value: totalLessons, icon: Clock },
          { label: 'Общий прогресс', value: `${overallPercent}%`, icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5 text-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--bg-hover)' }}
            >
              <Icon size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {totalLessons > 0 && (
        <div className="mb-12">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Общий прогресс</span>
            <span className="font-bold" style={{ color: 'var(--accent)' }}>{overallPercent}%</span>
          </div>
          <div className="progress-bar">
            <div style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      )}

      <h2 className="font-bold text-xl mb-5" style={{ color: 'var(--text-primary)' }}>Мои курсы</h2>
      
      <div className="space-y-4">
        {enrollments.map((enrollment: any) => {
          const course = enrollment.courses;
          const stats = progressPerCourse[course.id] || { completed: 0, total: 0 };
          const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          return (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <div className="card p-6 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 
                      className="font-bold text-lg transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >{course.title}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {stats.completed} из {stats.total} уроков пройдено
                    </p>
                  </div>
                  <div className="text-3xl">♟️</div>
                </div>
                
                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{ color: 'var(--text-tertiary)' }}>Прогресс</span>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>{percent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ width: `${percent}%` }} />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mt-4 text-xs font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  Продолжить обучение
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
