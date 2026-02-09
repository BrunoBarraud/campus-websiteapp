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
  const progressValue = typeof progress === "number" && !Number.isNaN(progress) ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-md">
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-white">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight truncate">{title}</h1>
            {teacher ? (
              <p className="opacity-90 flex items-center gap-2 text-indigo-100 font-medium">
                <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/20">
                  Docente: {teacher}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-3">
            {rightSlot}
            <div className="hidden md:block bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="w-full md:w-1/2 space-y-2">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>Tu Progreso</span>
            <span className="text-indigo-600">
              {progressValue === null ? "—" : `${progressValue}% completado`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.35)]"
              style={{ width: `${progressValue ?? 0}%` }}
            />
          </div>
        </div>

        <div className="w-full md:w-auto flex items-center gap-3 bg-amber-50 text-amber-800 px-5 py-3 rounded-xl border border-amber-200/60 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Próximo vencimiento</p>
            <p className="opacity-90">{nextDueLabel || "Sin datos"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
