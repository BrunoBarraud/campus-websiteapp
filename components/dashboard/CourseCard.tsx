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
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border-2 border-yellow-100 transition-all duration-300 card-hover fade-in delay-${delay} hover:shadow-2xl hover:border-rose-200 cursor-pointer transform hover:scale-105`}>
        <div className="overflow-hidden relative aspect-video">
          <Image 
            src={imageError ? fallbackImage : course.image} 
            alt={course.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 subject-image" 
            priority={delay <= 4} // Solo priorizar las primeras 4 imágenes
            onError={handleImageError}
            loading={delay <= 4 ? "eager" : "lazy"} // Lazy loading para las imágenes que no están en el fold
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* (Editor removed from card image; editor remains available on subject/admin pages) */}
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base sm:text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-yellow-600 group-hover:to-rose-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2">{course.title}</h3>
            <span className="bg-gradient-to-r from-yellow-100 to-rose-100 text-yellow-800 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 border border-yellow-200">
              {course.year && course.division 
                ? `${course.year}° ${course.division}` 
                : course.code || course.year 
                  ? `${course.code || ''} ${course.year ? `${course.year}°` : ''}`.trim() 
                  : 'Curso'
              }
            </span>
          </div>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2">Haz clic para ver el contenido completo de la materia.</p>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-yellow-100 to-rose-100 flex items-center justify-center mr-2">
                <i className="fas fa-chalkboard-teacher text-yellow-600 text-xs sm:text-sm"></i>
              </div>
              <span className="teacher-chip bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm truncate border border-gray-200">{course.teacher}</span>
            </div>
            <div className="text-yellow-600 group-hover:text-rose-600 text-xs sm:text-sm font-medium text-right transition-colors duration-300 flex items-center">
              <span className="mr-1">Ver materia</span>
              <i className="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform duration-300"></i>
            </div>
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


