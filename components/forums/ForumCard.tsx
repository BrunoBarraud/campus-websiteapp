"use client";

import React from "react";
import { MessageSquare, Lock, Users } from "lucide-react";

interface ForumCardProps {
  forum: {
    id: string;
    title: string;
    description?: string;
    questions_count: number;
    is_locked: boolean;
    allow_student_answers: boolean;
    created_at: string;
    subject?: {
      name: string;
      year: number;
    };
    unit?: {
      title: string;
    };
  };
  onClick: () => void;
  isTeacher?: boolean;
}

export default function ForumCard({ forum, onClick, isTeacher = false }: ForumCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2">
            {forum.title}
          </h3>
          {forum.unit && (
            <p className="text-sm text-gray-500 mt-1">
              📚 {forum.unit.title}
            </p>
          )}
        </div>
        {forum.is_locked && (
          <div className="flex-shrink-0 ml-2">
            <Lock className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Description */}
      {forum.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {forum.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 text-gray-600">
          <MessageSquare className="w-4 h-4" />
          <span>{forum.questions_count} pregunta{forum.questions_count !== 1 ? 's' : ''}</span>
        </div>

        {forum.allow_student_answers && (
          <div className="flex items-center gap-1.5 text-green-600">
            <Users className="w-4 h-4" />
            <span className="text-xs">Respuestas colaborativas</span>
          </div>
        )}

        {forum.is_locked && (
          <span className="text-xs text-red-600 font-medium">
            Cerrado
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>
          {new Date(forum.created_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
        {isTeacher && (
          <span className="text-yellow-600 font-medium">
            Gestionar →
          </span>
        )}
      </div>
    </div>
  );
}
