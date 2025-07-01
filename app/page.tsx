import React from "react";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Link from "next/link";
import Footer from "@/components/Home/Footer/Footer";

const HomePage = () => {
  return (
    <>
      <main className="bg-gradient-to-r from-blue-50 to-indigo-100 min-h-screen">
        <section className="py-20 px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Bienvenido al <span className="text-yellow-500">Campus</span> Virtual
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accede a tus cursos, recursos académicos, calendario y más desde un solo lugar.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/campus/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-md shadow hover:bg-blue-700 transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/campus/register"
              className="bg-indigo-600 text-white px-6 py-3 rounded-md shadow hover:bg-indigo-700 transition"
            >
              Regístrate
            </Link>
          </div>
        </section>

        {/* Sección de Features */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Cursos Online</h3>
              <p className="text-gray-600">Accede a clases grabadas, material descargable y tareas.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Calendario Académico</h3>
              <p className="text-gray-600">Mantente al día con fechas importantes y entregas.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Soporte Docente</h3>
              <p className="text-gray-600">Contacta a profesores y resuelve dudas cuando las tengas.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
};

export default HomePage;