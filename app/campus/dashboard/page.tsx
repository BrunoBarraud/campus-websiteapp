import React from "react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import CourseCard from "../../../components/dashboard/CourseCard";

const DashboardPage = () => {
  const cursos = [
    { id: 1, title: "Matemática", teacher: "Prof. ???", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 2, title: "Lengua", teacher: "Prof. Chiaretta, Luciana", image: "https://images.unsplash.com/photo-1501525771695-688643efeea4?q=80&w=1073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 3, title: "Historia", teacher: "Prof. Patiño, Jimena", image: "https://images.unsplash.com/photo-1718728593327-4f2bc080ca31?q=80&w=1139&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 4, title: "Biología", teacher: "Prof. Faye, Carmen", image: "https://images.unsplash.com/photo-1706204787068-82cf617dc5c8?q=80&w=978&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 5, title: "Física", teacher: "Prof. ???", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 6, title: "Química", teacher: "Prof. ", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 7, title: "Literatura", teacher: "Prof. Chiaretta, Luciana", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 8, title: "Artes Visuales", teacher: "Lcda. Barraud, Macarena Geraldine", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 9, title: "Filosofía", teacher: "Prof. ???", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 10, title: "Educación Física", teacher: "Prof. Capitani, Diego", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 11, title: "Música", teacher: "Prof. Oliva, Emanuel?", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 12, title: "Geografía", teacher: "Prof. ???", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 13, title: "Programación", teacher: "Ing. Barraud, Bruno Ariel", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 14, title: "Economía", teacher: "Prof. ???", image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
  ];

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-3">Virtual Campus</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Explore your subjects and connect with teachers in our interactive learning environment</p>
          <div className="mt-6 flex justify-center space-x-4">
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md">
              <i className="fas fa-book mr-2"></i> My Subjects
            </button>
            <button className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-full hover:bg-indigo-50 transition-all">
              <i className="fas fa-calendar mr-2"></i> Schedule
            </button>
          </div>
        </header>

        {/* Search and Filter */}
        <div className="mb-8 fade-in delay-1">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-600"></i>
            </div>
            <div className="flex space-x-2">
              <select className="px-4 py-2 rounded-full border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800">
                <option>All Subjects</option>
                <option>Mathematics</option>
                <option>Science</option>
                <option>Literature</option>
                <option>History</option>
              </select>
              <select className="px-4 py-2 rounded-full border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800">
                <option>All Teachers</option>
                <option>Dr. Smith</option>
                <option>Prof. Johnson</option>
                <option>Ms. Williams</option>
              </select>
            </div>
          </div>
        </div>

                 {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-2">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                        <i className="fas fa-book text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500">Total Subjects</p>
                        <h3 className="text-2xl font-bold">12</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-3">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <i className="fas fa-chalkboard-teacher text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500">Active Teachers</p>
                        <h3 className="text-2xl font-bold">8</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-4">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <i className="fas fa-calendar-check text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500">Upcoming Classes</p>
                        <h3 className="text-2xl font-bold">5</h3>
                    </div>
                </div>
            </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cursos.map((curso, index) => (
            <CourseCard key={curso.id} course={curso} delay={index + 1} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
