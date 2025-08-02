"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircleIcon,
  SendIcon,
  CheckCircleIcon,
  XCircleIcon,
  ReplyIcon,
  EditIcon,
  MessageSquareIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  submission_id: string;
  author_id: string;
  content: string;
  line_number?: number;
  is_resolved: boolean;
  created_at: string;
  updated_at?: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  replies?: CommentReply[];
}

interface CommentReply {
  id: string;
  comment_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
}

interface SubmissionCommentsProps {
  submissionId: string;
  submissionText: string;
  canComment?: boolean;
}

const SubmissionComments: React.FC<SubmissionCommentsProps> = ({
  submissionId,
  submissionText,
  canComment = true,
}) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAddComment, setShowAddComment] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  useEffect(() => {
    loadComments();
  }, [submissionId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/submissions/${submissionId}/comments`);
      const data = await response.json();

      if (response.ok) {
        setComments(data);
      } else {
        console.error("Error loading comments:", data.error);
        toast.error("Error al cargar comentarios");
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Error al cargar comentarios");
    } finally {
      setLoading(false);
    }
  };

  const createComment = async () => {
    if (!newComment.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newComment,
            line_number: selectedLine,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setComments([...comments, data]);
        setNewComment("");
        setSelectedLine(null);
        setShowAddComment(false);
        toast.success("Comentario agregado");
      } else {
        toast.error(data.error || "Error al crear comentario");
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Error al crear comentario");
    }
  };

  const createReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.error("La respuesta no puede estar vacía");
      return;
    }

    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: replyContent,
            parent_comment_id: commentId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Actualizar el comentario con la nueva respuesta
        setComments(
          comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), data],
              };
            }
            return comment;
          })
        );

        setReplyContent("");
        setReplyingTo(null);
        toast.success("Respuesta agregada");
      } else {
        toast.error(data.error || "Error al crear respuesta");
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      toast.error("Error al crear respuesta");
    }
  };

  const toggleResolved = async (
    commentId: string,
    currentResolved: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/comments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment_id: commentId,
            is_resolved: !currentResolved,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? { ...comment, is_resolved: !currentResolved }
              : comment
          )
        );
        toast.success(
          currentResolved
            ? "Comentario marcado como no resuelto"
            : "Comentario marcado como resuelto"
        );
      } else {
        toast.error(data.error || "Error al actualizar comentario");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Error al actualizar comentario");
    }
  };

  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/comments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment_id: commentId,
            content: editContent,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setComments(
          comments.map((comment) => (comment.id === commentId ? data : comment))
        );
        setEditingComment(null);
        setEditContent("");
        toast.success("Comentario actualizado");
      } else {
        toast.error(data.error || "Error al actualizar comentario");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Error al actualizar comentario");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "teacher":
        return "Profesor";
      case "admin":
        return "Admin";
      case "student":
        return "Estudiante";
      default:
        return role;
    }
  };

  const renderSubmissionWithComments = () => {
    const lines = submissionText.split("\n");

    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-medium text-gray-900 mb-3">Texto de la entrega:</h4>
        <div className="space-y-1">
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const lineComments = comments.filter(
              (c) => c.line_number === lineNumber
            );

            return (
              <div key={index} className="flex group">
                <div className="w-8 text-xs text-gray-400 select-none flex-shrink-0 pt-1">
                  {lineNumber}
                </div>
                <div className="flex-1">
                  <div
                    className={`px-2 py-1 rounded ${
                      lineComments.length > 0
                        ? "bg-yellow-100 border-l-2 border-yellow-400"
                        : ""
                    }`}
                  >
                    {line || "\u00A0"}
                    {canComment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() => {
                          setSelectedLine(lineNumber);
                          setShowAddComment(true);
                        }}
                      >
                        <MessageCircleIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {lineComments.length > 0 && (
                    <div className="ml-2 mt-1 space-y-2">
                      {lineComments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <Card className="border-l-4 border-blue-400">
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    className={getRoleColor(
                                      comment.author.role
                                    )}
                                  >
                                    {getRoleLabel(comment.author.role)}
                                  </Badge>
                                  <span className="font-medium text-xs">
                                    {comment.author.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                {comment.is_resolved && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600"
                                  >
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Resuelto
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Cargando comentarios...
          </div>
        </CardContent>
      </Card>
    );
  }

  const generalComments = comments.filter((c) => !c.line_number);

  return (
    <div className="space-y-6">
      {/* Texto de la entrega con comentarios */}
      {submissionText && renderSubmissionWithComments()}

      {/* Comentarios generales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5" />
              Comentarios Generales ({generalComments.length})
            </CardTitle>
            {canComment && (
              <Dialog open={showAddComment} onOpenChange={setShowAddComment}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MessageCircleIcon className="h-4 w-4 mr-2" />
                    Agregar Comentario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedLine
                        ? `Comentario en línea ${selectedLine}`
                        : "Nuevo Comentario General"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Escribe tu comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddComment(false);
                          setNewComment("");
                          setSelectedLine(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={createComment}>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {generalComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No hay comentarios generales aún</p>
              {canComment && (
                <p className="text-sm">
                  Sé el primero en agregar un comentario
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {generalComments.map((comment) => (
                <Card
                  key={comment.id}
                  className={`${comment.is_resolved ? "opacity-75" : ""}`}
                >
                  <CardContent className="p-4">
                    {/* Header del comentario */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(comment.author.role)}>
                          {getRoleLabel(comment.author.role)}
                        </Badge>
                        <span className="font-medium">
                          {comment.author.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.updated_at &&
                          comment.updated_at !== comment.created_at && (
                            <span className="text-xs text-gray-400">
                              (editado)
                            </span>
                          )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {comment.is_resolved ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Resuelto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Contenido del comentario */}
                    {editingComment === comment.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateComment(comment.id)}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                          {comment.content}
                        </p>

                        {/* Acciones del comentario */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {canComment && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(comment.id)}
                                >
                                  <ReplyIcon className="h-3 w-3 mr-1" />
                                  Responder
                                </Button>

                                {(session?.user?.role === "teacher" ||
                                  session?.user?.role === "admin") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleResolved(
                                        comment.id,
                                        comment.is_resolved
                                      )
                                    }
                                  >
                                    {comment.is_resolved ? (
                                      <>
                                        <XCircleIcon className="h-3 w-3 mr-1" />
                                        Marcar pendiente
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                                        Marcar resuelto
                                      </>
                                    )}
                                  </Button>
                                )}

                                {(comment.author_id === session?.user?.id ||
                                  ["admin", "teacher"].includes(
                                    session?.user?.role || ""
                                  )) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingComment(comment.id);
                                      setEditContent(comment.content);
                                    }}
                                  >
                                    <EditIcon className="h-3 w-3 mr-1" />
                                    Editar
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Respuestas */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-gray-50 p-3 rounded"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge
                                className={getRoleColor(reply.author.role)}
                              >
                                {getRoleLabel(reply.author.role)}
                              </Badge>
                              <span className="font-medium text-sm">
                                {reply.author.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario de respuesta */}
                    {replyingTo === comment.id && (
                      <div className="mt-4 pl-4 border-l-2 border-blue-200">
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => createReply(comment.id)}
                            >
                              <SendIcon className="h-3 w-3 mr-1" />
                              Responder
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionComments;
