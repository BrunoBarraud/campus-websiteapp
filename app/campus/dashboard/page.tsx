'use client';

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CourseCard from "../../../components/dashboard/CourseCard";
import { User, Subject, CalendarEvent } from "@/app/lib/types";

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nextEvents, setNextEvents] = useState<CalendarEvent[]>([]);
  const [nextAssignment, setNextAssignment] = useState<{
    subjectId: string;
    subjectName: string;
    title: string;
    dueDate: string;
  } | null>(null);
  const [upcomingAssignmentsCount, setUpcomingAssignmentsCount] = useState(0);

  const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  };

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    if (!user.year) return;
    if (!subjects.length) {
      setNextEvents([]);
      setUpcomingAssignmentsCount(0);
      setNextAssignment(null);
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      try {
        const now = new Date();

        // Próximos eventos (global/año/materia/personales) según rol en el backend
        const eventsRes = await fetch(`/api/calendar/events?year=${user.year}`);
        if (eventsRes.ok) {
          const json = await eventsRes.json();
          const events = (json?.data ?? []) as CalendarEvent[];
          const upcoming = (events || [])
            .filter((e) => {
              const d = e?.date ? new Date(e.date) : null;
              return d && !isNaN(d.getTime()) && d.getTime() >= now.getTime();
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3);

          if (!cancelled) setNextEvents(upcoming);
        }

        // Próximas entregas (optimizado): 1 solo request
        const upcomingRes = await fetch(`/api/student/assignments/upcoming?days=7`);
        if (upcomingRes.ok) {
          const data = await upcomingRes.json();
          if (!cancelled) {
            setUpcomingAssignmentsCount(Number(data?.count) || 0);
            setNextAssignment(data?.nearest || null);
          }
        }
      } catch {
        if (!cancelled) {
          setNextEvents([]);
          setUpcomingAssignmentsCount(0);
          setNextAssignment(null);
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [user, subjects]);

  // Fetch user data and subjects
  useEffect(() => {
    if (status === "loading") return;

    if (!session || !session.user) {
      router.push("/campus/auth/login");
      return;
    }

    // Si es estudiante y no tiene año asignado, NO redirigir.
    // Se mostrará un estado de "perfil incompleto" en el render.

    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          setLoading(true);
          console.log('Dashboard: Starting to fetch data for:', session.user.email);
          
          // Obtener datos del usuario actual
          const userResponse = await fetch('/api/user/me');
          console.log('Dashboard: User API response status:', userResponse.status);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('Dashboard: User data received:', userData);
            setUser(userData);
            
            // Obtener materias basadas en el rol del usuario
            let subjectsResponse;
            if (userData.role === 'admin') {
              // Admins ven todas las materias
              console.log('Dashboard: Fetching admin subjects');
              subjectsResponse = await fetch('/api/admin/subjects');
            } else if (userData.role === 'teacher') {
              // Profesores ven sus materias asignadas
              console.log('Dashboard: Fetching teacher subjects');
              subjectsResponse = await fetch('/api/teacher/subjects');
            } else if (userData.role === 'student' && userData.year) {
              // Estudiantes ven materias donde están inscritos
              console.log('Dashboard: Fetching student subjects for year:', userData.year);
              subjectsResponse = await fetch('/api/student/subjects');
            } else {
              // Fallback: no hay materias
              console.log('Dashboard: No role match, setting empty subjects');
              setSubjects([]);
              return;
            }
            
            console.log('Dashboard: Subjects API response status:', subjectsResponse?.status);
            
            if (subjectsResponse && subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json();
              console.log('Dashboard: Subjects data received:', subjectsData);
              setSubjects(subjectsData);
            } else {
              console.log('Dashboard: Subjects API failed, setting empty array');
              if (subjectsResponse) {
                const errorText = await subjectsResponse.text();
                console.log('Dashboard: Subjects API error response:', errorText);
              }
              setSubjects([]);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setSubjects([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  // Estado bloqueado: el alumno debe completar año/división desde Perfil
  if (
    status !== "loading" &&
    session?.user?.role === "student" &&
    !session.user.year
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido/a {session.user.name || 'al Campus'}
          </h1>
          <p className="text-gray-600 mb-6">
            Para poder continuar, andá al ícono de tu <span className="font-semibold">Perfil</span> y completá
            tu <span className="font-semibold">año educativo</span> y tu <span className="font-semibold">división</span>.
            Recordá que <span className="font-semibold">5° y 6° año</span> no tienen división.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push("/campus/profile")}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold"
            >
              Ir a mi Perfil
            </button>
            <button
              type="button"
              onClick={() => router.push("/campus/auth/logout")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              Cerrar sesión
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Si tus datos académicos no corresponden, contactá a un administrador.
          </p>
        </div>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    if (!user) return "Bienvenido al Campus Virtual";
    
    if (user.role === 'admin') {
      return `Bienvenido Administrador ${user.name}`;
    } else if (user.role === 'teacher') {
      return `Bienvenido Profesor ${user.name}`;
    } else if (user.role === 'student') {
      return `Bienvenido ${user.name} - ${user.year}° Año`;
    }
    
    return `Bienvenido ${user.name}`;
  };

  const getSubjectCountMessage = () => {
    if (!user) return "Materias disponibles";
    
    if (user.role === 'student') {
      return `Materias de ${user.year}° Año`;
    } else if (user.role === 'teacher') {
      return "Tus materias asignadas";
    } else {
      return "Todas las materias";
    }
  };

  const getEmptyStateMessage = () => {
    if (!user) return "No hay materias disponibles";
    
    if (user.role === 'student') {
      return `No hay materias disponibles para ${user.year}° año`;
    } else if (user.role === 'teacher') {
      return "No tienes materias asignadas";
    } else {
      return "No hay materias creadas en el sistema";
    }
  };

  const getEmptyStateAction = () => {
    if (user?.role === 'admin') {
      return {
        text: "Crear primera materia",
        href: "/campus/settings/subjects"
      };
    }
    return null;
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSubjects = !normalizedSearch
    ? subjects
    : subjects.filter((s) => {
        const haystack = [
          s.name,
          s.code,
          s.teacher?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl shadow-soft p-4">
              <div className="h-5 w-32 skeleton mb-3"></div>
              <div className="h-4 w-full skeleton mb-2"></div>
              <div className="h-4 w-2/3 skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center fade-in">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-gray-900">
            {user?.role === 'student'
              ? `Bienvenido/a ${user?.name || ''}`.trim()
              : getWelcomeMessage()}
          </h1>
          {user?.role !== 'student' && (
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-700">
              <span className="font-medium text-gray-800">
                {subjects.length}
              </span>
              <span className="text-gray-600"> materias disponibles · {getSubjectCountMessage()}</span>
            </p>
          )}
        </header>

        {/* Search (themed for dark/light) */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-2/5">
            <input
              type="text"
              placeholder="Buscar materias..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-surface border border-border text-foreground placeholder-gray-500 dark:placeholder-gray-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {user?.role === 'student' && (
          <div className="mb-2 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Mis cursos</h2>
            <p className="text-sm text-gray-600">
              {filteredSubjects.length} {filteredSubjects.length === 1 ? 'materia' : 'materias'}
            </p>
          </div>
        )}

        {user?.role === 'student' && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/campus/calendar"
              className="bg-surface border border-border rounded-xl p-4 shadow-soft hover:shadow-elevated hover:bg-muted transition"
            >
              <div className="text-sm font-semibold text-foreground">Próximos eventos</div>
              {nextEvents.length ? (
                <div className="mt-2 space-y-1">
                  {nextEvents.map((e) => (
                    <div key={e.id} className="text-xs sm:text-sm text-gray-600 truncate">
                      <span className="font-medium text-gray-800">{formatShortDate(e.date)}</span>
                      <span className="text-gray-600"> · {e.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-xs sm:text-sm text-gray-600">No tenés eventos próximos.</div>
              )}
            </a>

            <a
              href={nextAssignment ? `/campus/student/subjects/${nextAssignment.subjectId}/assignments` : '/campus/dashboard'}
              className="bg-surface border border-border rounded-xl p-4 shadow-soft hover:shadow-elevated hover:bg-muted transition"
            >
              <div className="text-sm font-semibold text-foreground">Tareas próximas</div>
              <div className="mt-2 text-xs sm:text-sm text-gray-600">
                {upcomingAssignmentsCount > 0
                  ? `Tenés ${upcomingAssignmentsCount} ${upcomingAssignmentsCount === 1 ? 'entrega' : 'entregas'} en los próximos 7 días.`
                  : 'No tenés entregas en los próximos 7 días.'}
              </div>
              {nextAssignment && (
                <div className="mt-1 text-xs sm:text-sm text-gray-600 truncate">
                  <span className="font-medium text-gray-800">{formatShortDate(nextAssignment.dueDate)}</span>
                  <span className="text-gray-600"> · {nextAssignment.subjectName}: {nextAssignment.title}</span>
                </div>
              )}
            </a>
          </div>
        )}

        {user?.role !== 'student' && (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <a href="/campus/calendar" className="bg-surface border border-border rounded-xl p-3 shadow-soft hover:shadow-elevated hover:bg-muted transition">
                <div className="text-sm font-semibold text-foreground">Calendario</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ver eventos</div>
              </a>
              {/* <a href="/campus/mensajeria" className="bg-surface border border-border rounded-xl p-3 shadow-soft hover:shadow-elevated hover:bg-muted transition">
                <div className="text-sm font-semibold text-foreground">Mensajería</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Contactar</div>
              </a> */}
              <a href="/campus/notifications" className="bg-surface border border-border rounded-xl p-3 shadow-soft hover:shadow-elevated hover:bg-muted transition">
                <div className="text-sm font-semibold text-foreground">Notificaciones</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Novedades</div>
              </a>
              <a href="/campus/profile" className="bg-surface border border-border rounded-xl p-3 shadow-soft hover:shadow-elevated hover:bg-muted transition">
                <div className="text-sm font-semibold text-foreground">Perfil</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ajustes</div>
              </a>
            </div>

            {/* Stats Section */}
            <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-surface p-4 sm:p-6 rounded-xl shadow-soft border border-border hover:shadow-elevated transition-all duration-300 fade-in delay-2">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-700 mr-3 sm:mr-4">
                    <i className="fas fa-book text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">
                      {user?.role === 'teacher' ? 'Mis Materias' : 'Total Materias'}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      {subjects.length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Subjects Grid or Empty State */}
        {filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 mt-8 sm:mt-16 px-4">
            <div className="p-6 bg-yellow-100 rounded-full mb-6">
              <i className="fas fa-book text-4xl sm:text-6xl text-yellow-700 mb-4"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 text-center">
              {subjects.length === 0 ? getEmptyStateMessage() : 'No se encontraron materias'}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4 text-sm sm:text-base">
              {subjects.length === 0
                ? (user?.role === 'admin' 
                    ? 'Comienza creando materias para el campus virtual'
                    : user?.role === 'teacher'
                    ? 'Contacta con el administrador para que te asigne materias'
                    : 'Las materias se mostrarán aquí cuando estén disponibles')
                : 'Probá con otro texto en el buscador.'}
            </p>
            {getEmptyStateAction() && (
              <a
                href={getEmptyStateAction()!.href}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg hover:brightness-110 transition-all shadow-soft hover:shadow-elevated transform hover:scale-105 text-sm sm:text-base"
              >
                <i className="fas fa-plus mr-2"></i>
                {getEmptyStateAction()!.text}
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
            {filteredSubjects.map((subject, index) => (
              <CourseCard 
                key={subject.id} 
                course={{
                  id: subject.id,
                  title: subject.name,
                  teacher: subject.teacher?.name || 'Sin profesor',
                  image: subject.image_url || 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Sin+Imagen',
                  code: subject.code,
                  year: subject.year,
                  division: subject.division
                }} 
                delay={index + 1} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
