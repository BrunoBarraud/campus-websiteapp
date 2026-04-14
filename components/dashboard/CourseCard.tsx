"use client";

import React, { memo, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MoreHorizontal } from "lucide-react";

interface Course {
  id?: string;
  image: string;
  title: string;
  teacher: string;
  code?: string;
  year?: number;
  division?: string;
}

interface CourseCardProps {
  course: Course;
  delay: number;
}

const CourseCard: React.FC<CourseCardProps> = memo(({ course, delay }) => {
  const [imageError, setImageError] = useState(false);
  const { data: session } = useSession();
  const fallbackImage = "/images/subjects/default.svg";

  const gradients = [
    "from-indigo-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];

  const getGradientIndex = () => {
    const key = String(course.id ?? course.title);
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 2147483647;
    return Math.abs(hash) % gradients.length;
  };

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const getSubjectUrl = () => {
    const baseUrl = course.id ? course.id : course.title.toLowerCase().replace(/\s+/g, "-");

    if (session?.user?.role === "student") {
      return `/campus/student/subjects/${baseUrl}`;
    }
    if (session?.user?.role === "teacher") {
      return `/campus/teacher/subjects/${baseUrl}`;
    }
    if (session?.user?.role === "admin") {
      return `/campus/settings/subjects`;
    }

    return `/campus/subjects/${baseUrl}`;
  };

  return (
    <div className="group relative block">
      <div
        className={`course-card overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 fade-in delay-${delay} hover:border-yellow-200 hover:shadow-lg`}
      >
        <div className={`relative h-28 bg-gradient-to-br ${gradients[getGradientIndex()]}`}>
          <Image
            src={imageError ? fallbackImage : course.image}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="h-full w-full object-cover opacity-35 mix-blend-overlay"
            priority={delay <= 4}
            onError={handleImageError}
            loading={delay <= 4 ? "eager" : "lazy"}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent" />

          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              En curso
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="min-h-[80px]">
            <h4 className="line-clamp-2 text-lg font-semibold leading-tight text-slate-900">
              {course.title}
            </h4>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{course.teacher}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {course.code ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600">
                  {course.code}
                </span>
              ) : null}
              {course.year ? (
                <span className="rounded-full border border-yellow-100 bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700">
                  {course.year}° año{course.division ? ` ${course.division}` : ""}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link
              href={getSubjectUrl()}
              className="relative z-20 flex-1 rounded-xl bg-yellow-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-yellow-700"
            >
              Continuar
            </Link>
            <button
              type="button"
              className="relative z-20 rounded-xl border border-slate-200 p-2.5 text-slate-400 hover:bg-slate-50"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CourseCard.displayName = "CourseCard";

export default CourseCard;
