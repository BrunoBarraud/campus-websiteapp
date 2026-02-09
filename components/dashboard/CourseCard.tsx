"use client";

import React, { useState, memo, useCallback } from "react";
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
  const fallbackImage = "/images/ipdvs-logo.png";

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

  const courseMeta = course.code
    ? course.year && course.division
      ? `${course.code} • ${course.year}° ${course.division}`
      : course.year
        ? `${course.code} • ${course.year}°`
        : course.code
    : course.year && course.division
      ? `${course.year}° ${course.division}`
      : course.year
        ? `${course.year}°`
        : "";

  // Memoized error handler
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Generate URL based on user role
  const getSubjectUrl = () => {
    const baseUrl = course.id ? course.id : course.title.toLowerCase().replace(/\s+/g, '-');
    
    if (session?.user?.role === 'student') {
      return `/campus/student/subjects/${baseUrl}`;
    } else if (session?.user?.role === 'teacher') {
      return `/campus/teacher/subjects/${baseUrl}`;
    } else if (session?.user?.role === 'admin') {
      return `/campus/settings/subjects`; // Admin goes to management
    }
    
    return `/campus/subjects/${baseUrl}`; // Default fallback
  };

  return (
    <div className="block group relative">
      <div
        className={`course-card bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 fade-in delay-${delay} hover:shadow-lg hover:border-yellow-200`}
      >
        <div className={`relative h-32 bg-gradient-to-br ${gradients[getGradientIndex()]}`}>
          <Image
            src={imageError ? fallbackImage : course.image}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            priority={delay <= 4}
            onError={handleImageError}
            loading={delay <= 4 ? "eager" : "lazy"}
          />

          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              En curso
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h4 className="text-white font-semibold text-lg leading-tight line-clamp-1">{course.title}</h4>
            <p className="text-white/80 text-sm line-clamp-1">
              {courseMeta ? `${courseMeta} • ${course.teacher}` : course.teacher}
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="mt-4 flex items-center gap-2">
            <Link
              href={getSubjectUrl()}
              className="relative z-20 flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-xl transition-colors text-center"
            >
              Continuar
            </Link>
            <button
              type="button"
              className="relative z-20 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Agregar displayName para debugging
CourseCard.displayName = 'CourseCard';

export default CourseCard;


