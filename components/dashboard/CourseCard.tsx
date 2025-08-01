"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageEditor } from "@/components/ui/image-editor";

interface Course {
  id?: string;
  image: string;
  title: string;
  teacher: string;
  code?: string;
  year?: number;
  division?: string;
}

interface CourseCardProps {
  course: Course;
  delay: number;
  onUpdate?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, delay, onUpdate }) => {
  const [imageError, setImageError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: course.title,
    image_url: course.image,
  });
  const { data: session } = useSession();
  const fallbackImage = "/images/ipdvs-logo.png";

  // Generate URL based on user role
  const getSubjectUrl = () => {
    const baseUrl = course.id
      ? course.id
      : course.title.toLowerCase().replace(/\s+/g, "-");

    if (session?.user?.role === "student") {
      return `/campus/student/subjects/${baseUrl}`;
    } else if (session?.user?.role === "teacher") {
      return `/campus/teacher/subjects/${baseUrl}`;
    } else if (session?.user?.role === "admin") {
      return `/campus/settings/subjects`; // Admin goes to management
    }

    return `/campus/subjects/${baseUrl}`; // Default fallback
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettings(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/subjects/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la materia");
      }

      toast.success("Materia actualizada exitosamente");
      setShowSettings(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Error al actualizar la materia");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className={`bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border-2 border-yellow-100 transition-all duration-300 card-hover fade-in delay-${delay} hover:shadow-2xl hover:border-rose-200 transform hover:scale-105 relative group`}
      >
        {/* Settings button for teachers */}
        {session?.user?.role === "teacher" && (
          <button
            onClick={handleSettingsClick}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          >
            <SettingsIcon className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <Link href={getSubjectUrl()} className="block">
          <div className="overflow-hidden relative aspect-video">
            <Image
              src={imageError ? fallbackImage : course.image}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 subject-image"
              priority
              onError={() => setImageError(true)}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="p-3 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base sm:text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-yellow-600 group-hover:to-rose-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2 flex-1 pr-2">
                {course.title}
              </h3>
              <span className="bg-gradient-to-r from-yellow-100 to-rose-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex-shrink-0 border border-yellow-200">
                {course.year && course.division
                  ? `${course.year}° ${course.division}`
                  : course.code || course.year
                  ? `${course.code || ""} ${
                      course.year ? `${course.year}°` : ""
                    }`.trim()
                  : "Curso"}
              </span>
            </div>

            {/* Solo mostrar profesor para estudiantes y admins */}
            {session?.user?.role !== "teacher" && (
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-yellow-100 to-rose-100 flex items-center justify-center mr-2">
                  <i className="fas fa-chalkboard-teacher text-yellow-600 text-xs sm:text-sm"></i>
                </div>
                <span className="teacher-chip bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm truncate border border-gray-200">
                  {course.teacher}
                </span>
              </div>
            )}

            <div className="text-yellow-600 group-hover:text-rose-600 text-xs sm:text-sm font-medium text-right transition-colors duration-300 flex items-center justify-end">
              <span className="mr-1">
                {session?.user?.role === "teacher"
                  ? "Gestionar"
                  : "Ver materia"}
              </span>
              <i className="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform duration-300"></i>
            </div>
          </div>
        </Link>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Materia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la materia</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Imagen de la materia</Label>
              <div className="space-y-3">
                {/* Current image preview */}
                {formData.image_url && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}

                {/* Image management buttons */}
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImageEditor(true)}
                    className="flex-1"
                  >
                    {formData.image_url ? "Cambiar Imagen" : "Subir Imagen"}
                  </Button>

                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData({ ...formData, image_url: "" })
                      }
                    >
                      Eliminar
                    </Button>
                  )}
                </div>

                {/* URL input as fallback */}
                <div className="border-t pt-3">
                  <Label htmlFor="image_url" className="text-sm text-gray-600">
                    O ingresa una URL de imagen
                  </Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={isUpdating} className="flex-1">
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Editor */}
      <ImageEditor
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
        currentImageUrl={formData.image_url}
        onImageSave={(imageUrl) => {
          setFormData({ ...formData, image_url: imageUrl });
          setShowImageEditor(false);
        }}
      />
    </>
  );
};

export default CourseCard;
