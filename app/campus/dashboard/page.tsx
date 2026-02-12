'use client';

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CourseCard from "../../../components/dashboard/CourseCard";
import { User, Subject, CalendarEvent } from "@/app/lib/types";
import { Grid3X3, List, Search } from "lucide-react";

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
  const dataLoadedRef = React.useRef(false);

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

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !session.user) {
      router.push("/campus/auth/login");
      return;
    }

    // Evitar recargar datos si ya se cargaron (ej: al cambiar de pestaña)
    if (dataLoadedRef.current && user !== null) {
      setLoading(false);
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
            } else if (userData.role === 'teacher' || userData.role === 'admin_director') {
              // Profesores y admin_director ven sus materias asignadas
              console.log('Dashboard: Fetching teacher subjects');
              subjectsResponse = await fetch('/api/teacher/subjects');
            } else if (userData.role === 'student' && userData.year) {
              // Estudiantes ven materias donde están inscritos
              console.log('Dashboard: Fetching student subjects for year:', userData.year);
              subjectsResponse = await fetch('/api/student/subjects');
            } else {
              // Fallback: no hay materias (estudiante sin año asignado)
              console.log('Dashboard: No role match or student without year, setting empty subjects');
              setSubjects([]);
              // No hacer return aquí para que setLoading(false) se ejecute en finally
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
          dataLoadedRef.current = true;
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router, user]);

  // Estado bloqueado: el alumno debe completar año/división desde Perfil
  // Verificamos los datos del usuario cargado desde la API (más confiable que la sesión)
  const userYear = user?.year;
  const userRole = user?.role;
  const userApprovalStatus = (user as any)?.approval_status;
  const isPendingApproval = userRole === 'student' && userApprovalStatus === 'pending';
  
  // Solo mostrar el mensaje de "completá tu año" si:
  // 1. La sesión ya cargó
  // 2. El fetch de usuario ya terminó (loading = false)
  // 3. Tenemos datos del usuario (user !== null)
  // 4. Es estudiante sin año asignado
  if (
    status !== "loading" &&
    !loading &&
    user !== null &&
    userRole === "student" &&
    !userYear
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido/a {session?.user?.name || user?.name || 'al Campus'}
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
            <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
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
    <div className="min-h-screen bg-slate-50">
      {/* Banner de estudiante pendiente de aprobación */}
      {isPendingApproval && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <p className="text-amber-800 text-sm">
              <span className="font-semibold">Tu cuenta está pendiente de aprobación.</span>{' '}
              Podés ver el contenido del campus, pero no podrás subir tareas ni interactuar hasta que un administrador apruebe tu cuenta.
            </p>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="glass-effect sticky top-0 z-30 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-sm text-slate-500">
                {user?.role === 'student'
                  ? `¡Bienvenido/a! Acá tenés tus cursos, tareas y eventos.`
                  : getSubjectCountMessage()}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-yellow-300 focus-within:border-yellow-300 transition-all">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar materias..."
                  className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm w-48 lg:w-64 text-slate-800 placeholder-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">
                    {user?.role === 'student' ? 'Mis materias' : 'Materias'}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">{subjects.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center">
                  <i className="fas fa-book text-yellow-800"></i>
                </div>
              </div>
            </div>

            {user?.role === 'student' ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Entregas próximas</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1">{upcomingAssignmentsCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <i className="fas fa-clipboard-list text-amber-600"></i>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-500">Próximos 7 días</div>
              </div>
            ) : (
              <a href={user?.role === 'admin' ? '/campus/admin/management' : '/campus/teacher/subjects'} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-yellow-300 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">{user?.role === 'admin' || user?.role === 'admin_director' ? 'Gestión' : 'Mis materias'}</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{user?.role === 'admin' || user?.role === 'admin_director' ? 'Usuarios y Materias' : 'Ver todas'}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <i className={`fas ${user?.role === 'admin' || user?.role === 'admin_director' ? 'fa-users-cog' : 'fa-chalkboard-teacher'} text-blue-600`}></i>
                  </div>
                </div>
                <div className="mt-3 text-sm text-yellow-700 font-medium">Ir →</div>
              </a>
            )}

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Eventos próximos</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">{nextEvents.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <i className="fas fa-calendar text-slate-700"></i>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-500">Calendario</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Tu perfil</p>
                  <p className="text-lg font-bold text-slate-900 mt-2 truncate max-w-[160px]">{user?.name || 'Usuario'}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <i className="fas fa-user text-slate-700"></i>
                </div>
              </div>
              <div className="mt-2">
                <a href="/campus/profile" className="text-sm font-medium text-yellow-700 hover:text-yellow-800">Ver perfil</a>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">{user?.role === 'student' ? 'Mis cursos' : 'Cursos'}</h3>
              <div className="flex items-center gap-2">
                <a
                  href="/campus/dashboard"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-yellow-700 transition-colors"
                >
                  Ver todo
                </a>
                <button type="button" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="Vista grilla">
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Vista lista">
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subjects Grid or Empty State */}
            {filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-5 bg-yellow-50 border border-yellow-100 rounded-full mb-4">
                  <i className="fas fa-book text-3xl text-yellow-800"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1 text-center">
                  {subjects.length === 0 ? getEmptyStateMessage() : 'No se encontraron materias'}
                </h3>
                <p className="text-slate-500 text-center max-w-md mb-4 text-sm">
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
                    className="px-4 py-2.5 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition shadow-sm text-sm font-semibold"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    {getEmptyStateAction()!.text}
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      division: subject.division,
                    }}
                    delay={index + 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Agenda</h3>
                <a href="/campus/calendar" className="text-sm text-yellow-700 font-semibold hover:text-yellow-800">Ver calendario</a>
              </div>
              <div className="space-y-3">
                {nextEvents.length ? (
                  nextEvents.map((e, idx) => (
                    <div
                      key={e.id}
                      className={`flex gap-3 p-3 rounded-xl ${idx === 0 ? "bg-yellow-50 border border-yellow-100" : "bg-slate-50 border border-slate-100"}`}
                    >
                      <div className="text-center min-w-[60px]">
                        <p className={`text-xs font-medium ${idx === 0 ? "text-yellow-700" : "text-slate-600"}`}>{formatShortDate(e.date)}</p>
                        <p className={`text-xs ${idx === 0 ? "text-yellow-500" : "text-slate-400"}`}>Próximo</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{e.title}</p>
                        <p className="text-xs text-slate-500 truncate">{e.type}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-yellow-600" : "bg-slate-300"} mt-1.5`}></span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No tenés eventos próximos.</p>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines - Solo para estudiantes */}
            {user?.role === 'student' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Próximas entregas</h3>
                  <span className="text-sm text-slate-400 font-medium">{upcomingAssignmentsCount} en 7 días</span>
                </div>
                <div className="space-y-3">
                  {nextAssignment ? (
                    <a
                      href={`/campus/student/subjects/${nextAssignment.subjectId}/assignments`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-file-alt text-amber-600"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{nextAssignment.title}</p>
                        <p className="text-xs text-slate-500 truncate">{nextAssignment.subjectName} • Vence {formatShortDate(nextAssignment.dueDate)}</p>
                      </div>
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">No tenés entregas en los próximos 7 días.</p>
                  )}
                </div>
              </div>
            )}

            {/* Accesos rápidos - Solo para admin/teacher */}
            {(user?.role === 'admin' || user?.role === 'admin_director' || user?.role === 'teacher') && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Accesos rápidos</h3>
                </div>
                <div className="space-y-2">
                  {user?.role === 'admin' && (
                    <>
                      <a href="/campus/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <i className="fas fa-shield-alt text-purple-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">Panel de Admin</p>
                          <p className="text-xs text-slate-500">Configuraciones del sistema</p>
                        </div>
                      </a>
                      <a href="/campus/admin/support" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <i className="fas fa-headset text-blue-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">Centro de Soporte</p>
                          <p className="text-xs text-slate-500">Tickets y mantenimiento</p>
                        </div>
                      </a>
                    </>
                  )}
                  {user?.role === 'admin_director' && (
                    <a href="/campus/admin/students" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <i className="fas fa-user-clock text-amber-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">Estudiantes Pendientes</p>
                        <p className="text-xs text-slate-500">Aprobar nuevos estudiantes</p>
                      </div>
                    </a>
                  )}
                  {user?.role === 'teacher' && (
                    <Link href="/campus/teacher/subjects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <i className="fas fa-chalkboard text-emerald-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">Mis Materias</p>
                        <p className="text-xs text-slate-500">Gestionar contenido y tareas</p>
                      </div>
                    </Link>
                  )}
                  <a href="/campus/calendar" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <i className="fas fa-calendar-alt text-slate-600"></i>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Calendario</p>
                      <p className="text-xs text-slate-500">Ver eventos y fechas</p>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Learning Streak - Solo para estudiantes */}
            {user?.role === 'student' && (
              <div className="bg-gradient-to-br from-yellow-600 to-amber-700 rounded-2xl p-5 text-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Racha</h3>
                    <p className="text-yellow-100 text-sm">Seguí entrando al campus</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <i className="fas fa-fire text-white"></i>
                  </div>
                </div>
                <p className="text-sm text-yellow-100">
                  Aún no tenemos datos suficientes para mostrar tu racha.
                </p>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-yellow-100 text-sm">Días consecutivos</p>
                  </div>
                  <a
                    href="/campus/calendar"
                    className="px-4 py-2 bg-white text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    Ver agenda
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity & Announcements - Solo para estudiantes */}
        {user?.role === 'student' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Actividad reciente</h3>
                <span className="text-sm text-slate-400">Ver todo</span>
              </div>
              <p className="text-sm text-slate-500">No hay actividad reciente para mostrar.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Anuncios</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">0</span>
              </div>
              <p className="text-sm text-slate-500">No hay anuncios nuevos.</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
