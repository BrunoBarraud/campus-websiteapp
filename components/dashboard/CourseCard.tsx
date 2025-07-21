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
      <div className={`bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 card-hover fade-in delay-${delay} hover:shadow-lg cursor-pointer`}>
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
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">{course.title}</h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
              {course.code || course.year ? `${course.code || ''} ${course.year ? `${course.year}°` : ''}`.trim() : 'Curso'}
            </span>
          </div>
          <p className="text-gray-600 mb-4">Haz clic para ver el contenido completo de la materia.</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                <i className="fas fa-chalkboard-teacher text-indigo-600"></i>
              </div>
              <span className="teacher-chip bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">{course.teacher}</span>
            </div>
            <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver materia →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
