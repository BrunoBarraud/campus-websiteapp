"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Course {
  id?: string;
  image: string;
  title: string;
  teacher: string;
  code?: string;
  year?: number;
}

interface CourseCardProps {
  course: Course;
  delay: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, delay }) => {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "/images/ipdvs-logo.png"; // Using your existing logo as fallback

  // Generate URL for subject detail page
  const subjectUrl = `/campus/subjects/${course.id || course.title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Link href={subjectUrl} className="block">
      <div className={`bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-md transition-all duration-300 card-hover fade-in delay-${delay} hover:shadow-lg cursor-pointer dark:bg-white/90`}>
        <div className="overflow-hidden relative aspect-video">
          <Image 
            src={imageError ? fallbackImage : course.image} 
            alt={course.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 subject-image" 
            priority
            onError={() => setImageError(true)}
            loading="eager"
          />
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base sm:text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors dark:text-gray-800 line-clamp-2">{course.title}</h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full dark:bg-indigo-100 dark:text-indigo-800 ml-2 flex-shrink-0">
              {course.code || course.year ? `${course.code || ''} ${course.year ? `${course.year}°` : ''}`.trim() : 'Curso'}
            </span>
          </div>
          <p className="text-gray-600 mb-3 sm:mb-4 dark:text-gray-600 text-sm sm:text-base line-clamp-2">Haz clic para ver el contenido completo de la materia.</p>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 dark:bg-indigo-100">
                <i className="fas fa-chalkboard-teacher text-indigo-600 dark:text-indigo-600 text-xs sm:text-sm"></i>
              </div>
              <span className="teacher-chip bg-gray-100 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm dark:bg-gray-100 dark:text-gray-800 truncate">{course.teacher}</span>
            </div>
            <div className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium dark:text-blue-600 dark:hover:text-blue-800 text-right">
              Ver materia →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
