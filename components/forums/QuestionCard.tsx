"use client";

import React from "react";
import { MessageCircle, Eye, Pin, CheckCircle, Lock } from "lucide-react";

interface QuestionCardProps {
  question: {
    id: string;
    title: string;
    content: string;
    views_count: number;
    answers_count: number;
    is_answered: boolean;
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    author: {
      name: string;
      role: string;
    };
  };
  onClick: () => void;
}

export default function QuestionCard({ question, onClick }: QuestionCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Header con badges */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {question.is_pinned && (
              <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
            {question.is_answered && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {question.is_locked && (
              <Lock className="w-4 h-4 text-red-500" />
            )}
          </div>
          
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2">
            {question.title}
          </h3>
        </div>
      </div>

      {/* Content preview */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {question.content}
      </p>

      {/* Stats y autor */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{question.answers_count}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{question.views_count}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">{question.author.name}</span>
          {' · '}
          {new Date(question.created_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
          })}
        </div>
      </div>

      {/* Status badge */}
      {question.is_answered && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3 h-3" />
            Respondida por el profesor
          </span>
        </div>
      )}
    </div>
  );
}
