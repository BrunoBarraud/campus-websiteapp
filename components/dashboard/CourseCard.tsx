"use client";

import React, { useState, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
      <div className={`bg-surface/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-border transition-all duration-300 card-hover fade-in delay-${delay} hover:shadow-2xl hover:border-[color:var(--accent)] cursor-pointer transform hover:scale-105`}>
        <div className="overflow-hidden relative aspect-video">
          <Image 
            src={imageError ? fallbackImage : course.image} 
            alt={course.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 subject-image" 
            priority={delay <= 4} // Solo priorizar las primeras 4 imágenes
            onError={handleImageError}
            loading={delay <= 4 ? "eager" : "lazy"} // Lazy loading para las imágenes que no están en el fold
          />
          {/* (Editor removed from card image; editor remains available on subject/admin pages) */}
        </div>
        <div className="p-3 sm:p-5 flex flex-col justify-between min-h-[150px] sm:min-h-[170px]">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base sm:text-xl font-bold text-gray-800 transition-colors duration-200 line-clamp-2">
                {course.title}
              </h3>
              <span className="bg-[color:var(--muted)] text-[color:var(--foreground)] text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 border border-[color:var(--border)]">
                {course.year && course.division 
                  ? `${course.year}° ${course.division}` 
                  : course.code || course.year 
                    ? `${course.code || ''} ${course.year ? `${course.year}°` : ''}`.trim() 
                    : 'Curso'
                }
              </span>
            </div>
            <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2">
              Ver contenido de la materia.
            </p>
          </div>
          <div className="mt-1 flex items-center min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[color:var(--primary)]/15 to-[color:var(--accent)]/15 flex items-center justify-center mr-2">
              <i className="fas fa-chalkboard-teacher text-[color:var(--primary)] text-xs sm:text-sm"></i>
            </div>
            <span className="teacher-chip bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm truncate border border-gray-200 max-w-full">
              {course.teacher}
            </span>
          </div>
        </div>
      </div>

      {/* Full area link placed after content; sits below editor (z-10) so editor clicks don't navigate */}
      <Link href={getSubjectUrl()} className="absolute inset-0 z-10" aria-hidden>
        <span className="sr-only">Ver materia</span>
      </Link>
    </div>
  );
});

// Agregar displayName para debugging
CourseCard.displayName = 'CourseCard';

export default CourseCard;


