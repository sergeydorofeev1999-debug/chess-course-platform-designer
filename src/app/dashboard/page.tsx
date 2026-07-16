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
        <h1 className="text-3xl font-bold mb-3 text-[#1A1816]">Войдите в аккаунт</h1>
        <p className="text-[#6B6560] mb-8 max-w-sm mx-auto">Чтобы видеть прогресс и открывать новые уровни, нужно авторизоваться.</p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#DCC078] text-[#1A1816] font-bold px-8 py-4 rounded-xl transition-all shadow-[0_4px_0_rgba(26,24,22,0.15)] hover:-translate-y-0.5"
        >
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
        <span className="text-xs font-bold text-[#2E6B7A] uppercase tracking-[0.2em]">Кабинет</span>
        <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-3 text-[#1A1816]">Мой путь</h1>
        <p className="text-[#6B6560]">Отслеживай свой прогресс и открывай новые достижения.</p>
      </div>

      {dashboardError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {dashboardError}
        </div>
      )}

      {isAdmin && (
        <div className="mb-8 p-4 bg-[#C9A84C]/8 border border-[#C9A84C]/20 rounded-2xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-[#A68A3A]">Режим администратора</p>
              <p className="text-sm text-[#C9A84C]/80">Доступ к редактированию позиций</p>
            </div>
            <Link
              href="/admin/board"
              className="bg-[#C9A84C] hover:bg-[#DCC078] text-[#1A1816] font-bold px-5 py-2.5 rounded-xl transition shadow-[0_2px_0_rgba(26,24,22,0.15)] active:translate-y-px"
            >
              📝 Редактор позиций
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Курсов', value: totalCourses, icon: BookOpen, color: '#2E6B7A' },
          { label: 'Уроков пройдено', value: totalCompleted, icon: CheckCircle, color: '#7AB648' },
          { label: 'Всего уроков', value: totalLessons, icon: Clock, color: '#5C4033' },
          { label: 'Общий прогресс', value: `${overallPercent}%`, icon: Trophy, color: '#C9A84C' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="collectible-card rounded-2xl p-5 text-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: `${color}12` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-[#1A1816]">{value}</div>
            <div className="text-xs text-[#9E9892] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {totalLessons > 0 && (
        <div className="mb-12">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-[#1A1816]">Общий прогресс</span>
            <span className="font-bold text-[#2E6B7A]">{overallPercent}%</span>
          </div>
          <div className="progress-premium">
            <div style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-5 text-[#1A1816]">Мои курсы</h2>
      
      <div className="space-y-4">
        {enrollments.map((enrollment: any) => {
          const course = enrollment.courses;
          const stats = progressPerCourse[course.id] || { completed: 0, total: 0 };
          const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          return (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <div className="collectible-card rounded-2xl p-6 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#1A1816] group-hover:text-[#2E6B7A] transition-colors">{course.title}</h3>
                    <p className="text-sm text-[#6B6560] mt-1">{stats.completed} из {stats.total} уроков пройдено</p>
                  </div>
                  <div className="text-3xl">♟️</div>
                </div>
                
                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9E9892]">Прогресс</span>
                    <span className="font-bold text-[#2E6B7A]">{percent}%</span>
                  </div>
                  <div className="progress-premium">
                    <div style={{ width: `${percent}%` }} />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-[#2E6B7A] group-hover:text-[#C9A84C] transition-colors">
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
