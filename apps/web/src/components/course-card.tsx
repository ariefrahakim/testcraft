import Link from 'next/link';
import { Clock, PlayCircle, Star, Users } from 'lucide-react';
import type { CourseSummaryDto } from '@testcraft/shared';
import { Badge } from '@/components/ui/badge';
import { Tx } from '@/components/tx';
import { discountPct, formatDuration, formatIDR, formatNumber } from '@/lib/format';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

export function CourseCard({ course }: { course: CourseSummaryDto }) {
  const off = discountPct(course.priceIDR, course.compareAtIDR);

  return (
    <Link
      href={`/courses/${course.slug}`}
      data-testid="course-card"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative grid h-36 place-items-center bg-gradient-to-br from-primary/10 to-success/10 text-5xl">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span aria-hidden>{course.icon ?? '🎓'}</span>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {course.isBestseller && (
            <Badge tone="amber">
              <Tx k="catalog.bestseller" />
            </Badge>
          )}
          {off > 0 && <Badge tone="red">-{off}%</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{course.category.name}</span>
          <span aria-hidden>·</span>
          <span>
            <Tx k={`catalog.level.${course.level}` as TranslationKey} />
          </span>
        </div>

        <h3 data-testid="course-title" className="mt-2 line-clamp-2 font-display text-[15px] font-bold leading-snug text-navy group-hover:text-primary dark:text-white">
          {course.title}
        </h3>

        <p className="mt-1 truncate text-xs text-slate-500">{course.instructor.name}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            {course.rating.toFixed(1)}
            <span className="font-normal text-slate-400">
              ({formatNumber(course.reviewCount)})
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(course.studentCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(course.durationMin)}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" />
            {course.lessonCount} <Tx k="catalog.materials" />
          </span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-4">
          {course.isFree ? (
            <span className="font-display text-lg font-extrabold text-success">
              <Tx k="catalog.free" />
            </span>
          ) : (
            <>
              <span className="font-display text-lg font-extrabold text-navy dark:text-white">
                {formatIDR(course.priceIDR)}
              </span>
              {course.compareAtIDR && course.compareAtIDR > course.priceIDR && (
                <span className="text-sm text-slate-400 line-through">
                  {formatIDR(course.compareAtIDR)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-36 rounded-t-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}
