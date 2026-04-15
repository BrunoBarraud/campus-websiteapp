'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CourseCard from "../../../components/dashboard/CourseCard";
import { User, Subject, CalendarEvent } from "@/app/lib/types";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";

interface UpcomingAssignment {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  dueDate: string;
  status: string;
}

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nextEvents, setNextEvents] = useState<CalendarEvent[]>([]);
  const [upcomingAssignmentsCount, setUpcomingAssignmentsCount] = useState(0);
  const [upcomingAssignments, setUpcomingAssignments] = useState<UpcomingAssignment[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const dataLoadedRef = useRef(false);

  const formatShortDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  };

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1536) {
        setItemsPerPage(4);
      } else if (window.innerWidth >= 1024) {
        setItemsPerPage(3);
      } else if (window.innerWidth >= 640) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "student" || !user.year || !subjects.length) {
      setNextEvents([]);
      setUpcomingAssignmentsCount(0);
      setUpcomingAssignments([]);
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      try {
        const now = new Date();
        const eventsRes = await fetch(`/api/calendar/events?year=${user.year}`);
        if (eventsRes.ok) {
          const json = await eventsRes.json();
          const events = (json?.data ?? []) as CalendarEvent[];
          const upcoming = events
            .filter((event) => {
              const date = event?.date ? new Date(event.date) : null;
              return date && !Number.isNaN(date.getTime()) && date.getTime() >= now.getTime();
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 2);

          if (!cancelled) {
            setNextEvents(upcoming);
          }
        }

        const upcomingRes = await fetch(`/api/student/assignments/upcoming?days=7`);
        if (upcomingRes.ok) {
          const data = await upcomingRes.json();
          if (!cancelled) {
            setUpcomingAssignmentsCount(Number(data?.count) || 0);
            setUpcomingAssignments(Array.isArray(data?.items) ? data.items : []);
          }
        }
      } catch {
        if (!cancelled) {
          setNextEvents([]);
          setUpcomingAssignmentsCount(0);
          setUpcomingAssignments([]);
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

    if (dataLoadedRef.current && user !== null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userResponse = await fetch("/api/user/me");

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          let subjectsResponse: Response | undefined;

          if (userData.role === "admin") {
            subjectsResponse = await fetch("/api/admin/subjects");
          } else if (userData.role === "teacher" || userData.role === "admin_director") {
            subjectsResponse = await fetch("/api/teacher/subjects");
          } else if (userData.role === "student" && userData.year) {
            subjectsResponse = await fetch("/api/student/subjects");
          } else {
            setSubjects([]);
          }

          if (subjectsResponse?.ok) {
            const subjectsData = await subjectsResponse.json();
            setSubjects(subjectsData);
          } else {
            setSubjects([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSubjects([]);
      } finally {
        setLoading(false);
        dataLoadedRef.current = true;
      }
    };

    fetchData();
  }, [session, status, router, user]);

  const userYear = user?.year;
  const userRole = user?.role;
  const userApprovalStatus = (user as User & { approval_status?: string } | null)?.approval_status;
  const isPendingApproval = userRole === "student" && userApprovalStatus === "pending";

  const getEmptyStateMessage = () => {
    if (!user) return "No hay materias disponibles";
    if (user.role === "student") return `No hay materias disponibles para ${user.year}° año`;
    if (user.role === "teacher") return "No tienes materias asignadas";
    return "No hay materias creadas en el sistema";
  };

  const getEmptyStateAction = () => {
    if (user?.role === "admin") {
      return {
        text: "Crear primera materia",
        href: "/campus/settings/subjects",
      };
    }

    return null;
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSubjects = !normalizedSearch
    ? subjects
    : subjects.filter((subject) => {
        const haystack = [subject.name, subject.code, subject.teacher?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const visibleSubjects = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredSubjects.slice(start, start + itemsPerPage);
  }, [currentPage, filteredSubjects, itemsPerPage]);

  if (status !== "loading" && !loading && user !== null && userRole === "student" && !userYear) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido/a {session?.user?.name || user?.name || "al Campus"}
          </h1>
          <p className="mt-2 text-gray-600">
            Para poder continuar, andá a tu perfil y completá tu año educativo y tu división.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/campus/profile")}
              className="rounded-xl bg-yellow-600 px-6 py-3 font-semibold text-white transition hover:bg-yellow-700"
            >
              Ir a mi perfil
            </button>
            <button
              type="button"
              onClick={() => router.push("/campus/auth/logout")}
              className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="space-y-4">
          <div className="h-12 rounded-2xl skeleton" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 h-5 w-32 skeleton" />
                <div className="mb-2 h-4 w-full skeleton" />
                <div className="h-4 w-2/3 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isPendingApproval && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
          <div className="mx-auto max-w-7xl text-sm text-amber-800">
            <span className="font-semibold">Tu cuenta está pendiente de aprobación.</span> Podés ver el contenido
            del campus, pero no podrás interactuar hasta que un administrador apruebe tu cuenta.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-sm text-slate-500">
                {user?.role === "student" ? "Tus cursos al frente, sin scroll largo." : "Todas las materias"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-yellow-300 focus-within:ring-2 focus-within:ring-yellow-300">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  id="dashboard-subject-search"
                  name="dashboard-subject-search"
                  aria-label="Buscar materias"
                  autoComplete="off"
                  placeholder="Buscar materias..."
                  className="h-auto w-full min-w-0 appearance-none !border-0 !bg-transparent p-0 text-sm text-slate-800 !shadow-none outline-none placeholder-slate-400 ring-0 focus:!border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:w-48 lg:w-64"
                  style={{
                    border: "none",
                    background: "transparent",
                    boxShadow: "none",
                    outline: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          <section className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
              <BookOpen className="h-4 w-4 text-yellow-700" />
              <span className="font-semibold text-slate-900">{subjects.length}</span>
              <span className="text-slate-500">materias</span>
            </div>

            {user?.role === "student" && (
              <>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                  <CalendarDays className="h-4 w-4 text-slate-600" />
                  <span className="font-semibold text-slate-900">{nextEvents.length}</span>
                  <span className="text-slate-500">eventos</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                  <span className="font-semibold text-slate-900">{upcomingAssignmentsCount}</span>
                  <span className="text-slate-500">entregas</span>
                </div>
              </>
            )}

            {(user?.role === "admin" || user?.role === "admin_director") && (
              <>
                <Link
                  href="/campus/admin"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-200 hover:text-yellow-700"
                >
                  Panel admin
                </Link>
                <Link
                  href="/campus/admin/support"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-200 hover:text-yellow-700"
                >
                  Soporte
                </Link>
              </>
            )}

            {user?.role === "teacher" && (
              <Link
                href="/campus/teacher/subjects"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-200 hover:text-yellow-700"
              >
                Mis materias
              </Link>
            )}

            <Link
              href="/campus/calendar"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-200 hover:text-yellow-700"
            >
              Calendario
            </Link>
          </section>

          {user?.role === "student" && upcomingAssignments.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Tareas pendientes</h3>
                  <p className="text-sm text-slate-500">Lo más urgente para no perder entregas.</p>
                </div>
                {upcomingAssignments[0] && (
                  <Link
                    href={`/campus/student/subjects/${upcomingAssignments[0].subjectId}/assignments`}
                    className="text-sm font-semibold text-yellow-700 hover:text-yellow-800"
                  >
                    Ver tareas
                  </Link>
                )}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {upcomingAssignments.slice(0, 6).map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/campus/student/subjects/${assignment.subjectId}/assignments`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-yellow-200 hover:bg-yellow-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{assignment.title}</p>
                        <p className="truncate text-xs text-slate-500">{assignment.subjectName}</p>
                      </div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        Pendiente
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>Entrega: {formatShortDate(assignment.dueDate)}</span>
                      <span className="font-medium text-slate-700">Abrir</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Cursos</h3>
                <p className="text-sm text-slate-500">
                  {filteredSubjects.length} visibles de {subjects.length} materias
                </p>
              </div>

              {filteredSubjects.length > itemsPerPage && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentPage(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          index === currentPage ? "w-6 bg-yellow-600" : "w-2.5 bg-slate-200 hover:bg-slate-300"
                        }`}
                        aria-label={`Ir a la página ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-4 rounded-full border border-yellow-100 bg-yellow-50 p-4 text-yellow-700">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {subjects.length === 0 ? getEmptyStateMessage() : "No se encontraron materias"}
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  {subjects.length === 0
                    ? user?.role === "admin"
                      ? "Comienza creando materias para el campus virtual"
                      : user?.role === "teacher"
                        ? "Contacta con el administrador para que te asigne materias"
                        : "Las materias se mostrarán aquí cuando estén disponibles"
                    : "Probá con otro texto en el buscador."}
                </p>
                {getEmptyStateAction() && (
                  <Link
                    href={getEmptyStateAction()!.href}
                    className="mt-4 rounded-xl bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-700"
                  >
                    {getEmptyStateAction()!.text}
                  </Link>
                )}
              </div>
            ) : (
              <div key={`${currentPage}-${itemsPerPage}`} className="animate-fadeIn pt-5">
                <div
                  className={`grid gap-4 ${
                    itemsPerPage === 1
                      ? "grid-cols-1"
                      : itemsPerPage === 2
                        ? "grid-cols-1 md:grid-cols-2"
                        : itemsPerPage === 3
                          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                          : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                  }`}
                >
                  {visibleSubjects.map((subject, index) => (
                    <CourseCard
                      key={`${subject.id}-${currentPage}`}
                      course={{
                        id: subject.id,
                        title: subject.name,
                        teacher: subject.teacher?.name || "Sin profesor",
                        image: subject.image_url || "/images/subjects/default.svg",
                        code: subject.code,
                        year: subject.year,
                        division: subject.division,
                      }}
                      delay={index + 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredSubjects.length > itemsPerPage && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                <span>
                  Página <span className="font-semibold text-slate-900">{currentPage + 1}</span> de{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span>
                </span>
                <span>
                  Mostrando {visibleSubjects.length} de {filteredSubjects.length}
                </span>
              </div>
            )}
          </section>

          {user?.role === "student" && nextEvents.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Agenda rápida</h3>
                <Link href="/campus/calendar" className="text-sm font-semibold text-yellow-700 hover:text-yellow-800">
                  Ver calendario
                </Link>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                {nextEvents.map((event) => (
                  <div key={event.id} className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {formatShortDate(event.date)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{event.title}</p>
                      <p className="truncate text-xs text-slate-500">{event.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
