import Link from 'next/link';
import { getCourseWithModules, getUserProgress } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import PieceCards from '@/components/PieceCards';
import CourseProgress from '@/components/CourseProgress';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { course, modules } = await getCourseWithModules(id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let serverProgressMap: Record<string, boolean> = {};
  if (user) {
    const progress = await getUserProgress(id);
    progress.forEach((p: any) => {
      serverProgressMap[p.lesson_id] = p.is_completed;
    });
  }

  const allLessons = modules
    .flatMap((m: any) => m.lessons || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const totalLessons = allLessons.length;

  if (!course) {
    return <div className="max-w-6xl mx-auto px-4 py-12">Курс не найден</div>;
  }

  const basicLevelLessons = allLessons.slice(6, 11);
  const advancedLevelLessons = allLessons.slice(11, 17);
  const prepLevelLessons = allLessons.slice(17, 23);
  const endgameLevelLessons = allLessons.slice(23, 27);
  const midegameLevelLessons = allLessons.slice(27, 31);
  const openingLevelLessons = allLessons.slice(31, 34);
  const tasksLevelLessons = allLessons.slice(34, 37);
  const trainingLevelLessons = allLessons.slice(37);

  const basicLevelDescriptions = [
    'Съешь чёрную фигуру',
    'Защити свою фигуру',
    'Поставь шах королю',
    'Выведи короля из шаха',
    'Поставь мат королю',
  ];

  const advancedLevelDescriptions = [
    'Расстановка фигур в начале партии',
    'Особый ход короля и ладьи',
  ];

  const sectionStyle = "mb-10";
  const sectionTitle = "text-xs font-bold text-[#2E6B7A] uppercase tracking-[0.2em] mb-4 flex items-center gap-2";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link 
        href="/courses" 
        className="group inline-flex items-center gap-2 text-sm text-[#9E9892] hover:text-[#2E6B7A] transition-colors mb-8"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Назад к курсам
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center">
            <span className="text-3xl">♟️</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1816]">{course.title}</h1>
            <p className="text-sm text-[#9E9892] mt-1">{totalLessons} уроков · от нуля до первой победы</p>
          </div>
        </div>
        <p className="text-[#6B6560] leading-relaxed max-w-2xl">{course.description}</p>
        <div className="mt-6">
          <CourseProgress totalLessons={totalLessons} serverProgressMap={serverProgressMap} />
        </div>
      </div>

      <div className="space-y-8">
        {/* ШАХМАТНЫЕ ФИГУРЫ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            Шахматные фигуры
          </h2>
          <PieceCards
            lessons={allLessons.slice(0, 6).map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            pieceCodes={['R','B','Q','K','N','P']}
            descriptions={['Движется по прямой','Двигается по диагонали','Ферзь = ладья + слон','Самая важная фигура','Ходит буквой «Г»','Ходит на 1-2 клетки вперёд']}
          />
        </div>

        {/* БАЗОВЫЙ УРОВЕНЬ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7AB648]" />
            Базовый уровень
          </h2>
          <PieceCards
            lessons={basicLevelLessons.map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={basicLevelDescriptions}
          />
        </div>

        {/* СРЕДНИЙ УРОВЕНЬ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B7A]" />
            Средний уровень
          </h2>
          <PieceCards
            lessons={advancedLevelLessons.map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={advancedLevelDescriptions}
          />
        </div>

        {/* ПОДГОТОВКА К ИГРЕ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            Подготовка к игре
          </h2>
          <PieceCards
            lessons={prepLevelLessons.map((l: any) => {
              let levelsCount = 1;
              if (l.id === 'af74a851-e308-411d-82e1-fafdc5bd390a') levelsCount = 3;
              if (l.id === 'd239daeb-f7e9-410e-84c7-8f0eac3ebcb4') levelsCount = 3;
              if (l.id === '2976cdff-d622-45a6-9ce4-fbcc33fa9528') levelsCount = 3;
              if (l.id === 'a8b9a524-5e37-43c5-a479-9c98494d704e') levelsCount = 3;
              if (l.id === '1ce04101-6a7d-45c9-bcef-6e17dbafa6ac') levelsCount = 3;
              if (l.id === 'bae12fca-bfa4-44b6-9dff-7555fe240706') levelsCount = 3;
              else {
                try {
                  const config = JSON.parse(l.video_url || '{}');
                  if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
                } catch {}
              }
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={['Игра пешками против компьютера']}
          />
        </div>

        {/* ЭНДШПИЛЬ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7AB648]" />
            Эндшпиль
          </h2>
          <PieceCards
            lessons={endgameLevelLessons.map((l: any) => {
              let levelsCount = 1;
              if (l.id === '126a2252-7482-4ed4-8d5a-a0afe82d834d') levelsCount = 4;
              else {
                try {
                  const config = JSON.parse(l.video_url || '{}');
                  if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
                } catch {}
              }
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={['Мат двумя ладьями', 'Мат ферзём', 'Мат ладьёй', 'Правило квадрата']}
          />
        </div>

        {/* МИТТЕЛЬШПИЛЬ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B7A]" />
            Миттельшпиль
          </h2>
          <PieceCards
            lessons={midegameLevelLessons.map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={['Двойной удар']}
          />
        </div>

        {/* ДЕБЮТ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            Дебют
          </h2>
          <PieceCards
            lessons={openingLevelLessons.map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={['Итальянская партия за белых']}
          />
        </div>

        {/* ЗАДАЧИ */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7AB648]" />
            Задачи
          </h2>
          <PieceCards
            lessons={tasksLevelLessons.map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={['Мат в 1 ход']}
          />
        </div>

        {/* ТРЕНИРОВКА */}
        <div className={sectionStyle}>
          <h2 className={sectionTitle}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B7A]" />
            Тренировка
          </h2>
          <PieceCards
            lessons={trainingLevelLessons.map((l: any) => {
              let levelsCount = 1;
              try {
                const config = JSON.parse(l.video_url || '{}');
                if (config.levels && Array.isArray(config.levels)) levelsCount = config.levels.length;
              } catch {}
              return { id: l.id, title: l.title, order: l.order, duration_minutes: l.duration_minutes, levelsCount };
            })}
            progressMap={serverProgressMap}
            courseId={course.id}
            descriptions={['Игра против компьютера']}
          />
        </div>
      </div>
    </div>
  );
}
