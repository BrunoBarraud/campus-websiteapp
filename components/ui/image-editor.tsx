"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSave: (imageUrl: string) => void;
  currentImageUrl?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageEditor({
  open,
  onOpenChange,
  onImageSave,
  currentImageUrl,
}: ImageEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    currentImageUrl || ""
  );
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB max
      toast.error("El archivo es demasiado grande. Máximo 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
        // Reset crop area when new image is loaded
        setCropArea({ x: 10, y: 10, width: 80, height: 80 });
        setZoom(1);
        setRotation(0);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleCropStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX * 0.1)),
      y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY * 0.1)),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropEnd = () => {
    setIsDragging(false);
  };

  const adjustCropSize = (widthDelta: number, heightDelta: number) => {
    setCropArea((prev) => ({
      ...prev,
      width: Math.max(20, Math.min(100 - prev.x, prev.width + widthDelta)),
      height: Math.max(20, Math.min(100 - prev.y, prev.height + heightDelta)),
    }));
  };

  const processAndUploadImage = async () => {
    if (!selectedFile && !currentImageUrl) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    setIsUploading(true);

    try {
      let finalImageUrl = imagePreview;

      // Si hay un archivo seleccionado, procesarlo
      if (selectedFile) {
        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (!canvas || !img) {
          throw new Error("Error al procesar la imagen");
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Error al obtener el contexto del canvas");
        }

        // Calcular dimensiones para el crop
        const cropX = (cropArea.x / 100) * img.naturalWidth;
        const cropY = (cropArea.y / 100) * img.naturalHeight;
        const cropWidth = (cropArea.width / 100) * img.naturalWidth;
        const cropHeight = (cropArea.height / 100) * img.naturalHeight;

        // Establecer tamaño del canvas
        canvas.width = 800; // Tamaño fijo para consistencia
        canvas.height = 400;

        // Aplicar transformaciones
        ctx.save();

        // Rotación
        if (rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        // Dibujar la imagen recortada
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight, // Área de origen
          0,
          0,
          canvas.width,
          canvas.height // Destino en canvas
        );

        ctx.restore();

        // Convertir a blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
            },
            "image/jpeg",
            0.9
          );
        });

        // Subir a Supabase Storage
        const formData = new FormData();
        formData.append("file", blob, `subject-image-${Date.now()}.jpg`);

        const uploadResponse = await fetch("/api/upload/subject-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir la imagen");
        }

        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
      }

      onImageSave(finalImageUrl);
      toast.success("Imagen guardada exitosamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Error al procesar la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Imagen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {!imagePreview && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Arrastra una imagen o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, JPEG hasta 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
                className="hidden"
              />
            </div>
          )}

          {/* Image Editor */}
          {imagePreview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor Panel */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Editar Imagen</Label>

                <div
                  className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                >
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />

                  {/* Crop Overlay */}
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                    }}
                    onMouseDown={handleCropStart}
                    onMouseMove={handleCropMove}
                    onMouseUp={handleCropEnd}
                    onMouseLeave={handleCropEnd}
                  >
                    {/* Resize handles */}
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Handle resize logic here
                      }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom +
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                  >
                    <ZoomOut className="h-4 w-4 mr-2" />
                    Zoom -
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Rotar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cambiar
                  </Button>
                </div>

                {/* Crop Size Controls */}
                <div className="space-y-2">
                  <Label className="text-sm">Ajustar área de recorte:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustCropSize(10, 5)}
                    >
                      Más ancho
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustCropSize(-10, -5)}
                    >
                      Más estrecho
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Vista previa</Label>
                <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-50 via-white to-rose-50 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${
                            cropArea.x + cropArea.width / 2
                          }% ${cropArea.y + cropArea.height / 2}%`,
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-bold">
                          Nombre de la Materia
                        </h3>
                        <p className="text-sm opacity-90">
                          Vista previa del card
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Así se verá tu imagen en el dashboard
                </p>
              </div>
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handleFileSelect(e.target.files[0])
            }
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {imagePreview && (
              <Button onClick={processAndUploadImage} disabled={isUploading}>
                {isUploading ? "Guardando..." : "Guardar Imagen"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
