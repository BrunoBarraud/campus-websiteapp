import React from "react";

type Course = {
  id: number;
  title: string;
  teacher: string;
};

const CourseCard = ({ course }: { course: Course }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
      <p className="text-sm text-gray-600 mb-4">{course.teacher}</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
        Ir al curso
      </button>
    </div>
  );
};

export default CourseCard;