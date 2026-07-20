export default function LessonLoading() {
  return (
    <div className="w-full px-3 py-4 animate-pulse">
      {/* Nav skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-[var(--surface-border)] rounded"></div>
        <div className="h-3 w-32 bg-[var(--surface-border)] rounded"></div>
      </div>

      {/* Board skeleton */}
      <div className="mb-8">
        <div className="w-full max-w-[520px] mx-auto aspect-square bg-[var(--bg-secondary)] rounded-xl"></div>
      </div>

      {/* Level pills skeleton */}
      <div className="flex gap-[1px] mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 h-9 bg-[var(--surface-border)] rounded-md"></div>
        ))}
      </div>

      {/* Text skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-[var(--surface-border)] rounded"></div>
        <div className="h-4 w-full bg-[var(--surface-border)] rounded"></div>
        <div className="h-4 w-5/6 bg-[var(--surface-border)] rounded"></div>
      </div>
    </div>
  );
}
