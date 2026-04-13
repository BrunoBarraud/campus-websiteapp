"use client";

import React from "react";
import { BookOpen, Clock } from "lucide-react";

export default function SubjectHeroCard({
  title,
  teacher,
  progress,
  nextDueLabel,
  rightSlot,
}: {
  title: string;
  teacher?: string | null;
  progress?: number | null;
  nextDueLabel?: string | null;
  rightSlot?: React.ReactNode;
}) {
  const progressValue =
    typeof progress === "number" && !Number.isNaN(progress)
      ? Math.max(0, Math.min(100, progress))
      : null;

  return (
    <div className="mx-auto mb-6 max-w-4xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm sm:mb-8">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_28%)]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100 backdrop-blur-sm">
              Materia
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2rem]">
              {title}
            </h1>
            {teacher ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-100">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-sm">
                  Docente: {teacher}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-shrink-0 items-start gap-3 sm:gap-4">
            <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
              {rightSlot}
            </div>
            <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:block">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 bg-white p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] sm:p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
            <span>Tu progreso</span>
            <span className="text-indigo-600">
              {progressValue === null ? "Sin datos" : `${progressValue}% completado`}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.25)]"
              style={{ width: `${progressValue ?? 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-4 text-amber-800 shadow-sm">
          <div className="rounded-xl bg-white/70 p-2.5">
            <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-bold text-amber-900">Proximo vencimiento</p>
            <p className="truncate opacity-90">{nextDueLabel || "Sin datos"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
