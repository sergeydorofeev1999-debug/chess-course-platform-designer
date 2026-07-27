import { notFound } from 'next/navigation';
import { getLesson, getCourseLessons } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import LessonClient from '@/components/LessonClient';
import '../../game-mode.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const { id } = await params;
  const { course: courseId } = await searchParams;

  const lesson = await getLesson(id);
  if (!lesson) return notFound();

  // Run independent queries in parallel
  const [allLessonsRaw, supabase] = await Promise.all([
    getCourseLessons(lesson.course_id),
    createClient(),
  ]);
  const allLessons = allLessonsRaw.map(({ id, title, order }) => ({ id, title, order }));

  // Auth + progress — parallel if user exists
  const { data: { user } } = await supabase.auth.getUser();
  let isCompleted = false;
  if (user) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('is_completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();
    isCompleted = progress?.is_completed || false;
  }

  return (
    <div className="game-mode-page">
      <LessonClient
        lesson={lesson}
        allLessons={allLessons}
        courseId={courseId || lesson.course_id}
        isCompletedInit={isCompleted}
      />
    </div>
  );
}
