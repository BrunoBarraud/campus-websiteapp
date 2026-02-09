"use client";

import React from "react";
import { ThumbsUp, CheckCircle } from "lucide-react";

interface AnswerCardProps {
  answer: {
    id: string;
    content: string;
    is_teacher_answer: boolean;
    is_accepted: boolean;
    likes_count: number;
    created_at: string;
    author: {
      name: string;
      role: string;
    };
  };
  onLike?: () => void;
  onAccept?: () => void;
  canAccept?: boolean;
  userHasLiked?: boolean;
}

export default function AnswerCard({
  answer,
  onLike,
  onAccept,
  canAccept = false,
  userHasLiked = false,
}: AnswerCardProps) {
  return (
    <div
      className={`bg-white border rounded-lg p-6 ${
        answer.is_accepted
          ? "border-green-300 bg-green-50"
          : answer.is_teacher_answer
          ? "border-yellow-300 bg-yellow-50"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-rose-400 rounded-full flex items-center justify-center text-white font-semibold">
            {answer.author.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {answer.author.name}
              </span>
              {answer.is_teacher_answer && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                  Profesor
                </span>
              )}
              {answer.is_accepted && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  <CheckCircle className="w-3 h-3" />
                  Respuesta Aceptada
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {new Date(answer.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {canAccept && !answer.is_accepted && (
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar como correcta
          </button>
        )}
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none mb-4">
        <p className="text-gray-700 whitespace-pre-wrap">{answer.content}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <button
          onClick={onLike}
          disabled={!onLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            userHasLiked
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ThumbsUp className={`w-4 h-4 ${userHasLiked ? "fill-yellow-700" : ""}`} />
          <span>{answer.likes_count}</span>
        </button>
      </div>
    </div>
  );
}
