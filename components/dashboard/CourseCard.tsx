import React from "react";

interface Course {
  image: string;
  title: string;
  teacher: string;
}

interface CourseCardProps {
  course: Course;
  delay: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, delay }) => {
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 card-hover fade-in delay-${delay}`}>
      <div className="overflow-hidden">
        <img src={course.image} alt={course.title} className="w-full subject-image" />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">Course Code</span>
        </div>
        <p className="text-gray-600 mb-4">Description of the course goes here.</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
              <i className="fas fa-chalkboard-teacher text-indigo-600"></i>
            </div>
            <span className="teacher-chip bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">{course.teacher}</span>
          </div>
          <button className="text-indigo-600 hover:text-indigo-800">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
