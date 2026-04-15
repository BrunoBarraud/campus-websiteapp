"use client";

import React, { useState } from "react";
import { Camera, ImagePlus, Link2, Upload } from "lucide-react";
import SimpleModal from "@/components/common/SimpleModal";

interface Props {
  subjectId: string;
  currentImage: string;
  canEdit: boolean;
  onUpdated?: (newUrl: string) => void;
}

export default function SubjectImageEditor({ subjectId, currentImage, canEdit, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) return null;

  const reset = () => {
    setUrl("");
    setFile(null);
    setLoading(false);
    setError(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  async function updateImage(newUrl: string) {
    setLoading(true);
    setError(null);

    try {
      const getRes = await fetch(`/api/subjects/${subjectId}`, { credentials: "include" });
      if (!getRes.ok) throw new Error("No se pudo obtener la materia");

      const payload = await getRes.json();
      const data = payload?.data;
      if (!data) throw new Error("Datos de materia invalidos");

      const body = {
        name: data.name,
        code: data.code,
        description: data.description || "",
        year: data.year,
        division: data.division || null,
        teacher_id: data.teacher_id || null,
        image_url: newUrl,
      };

      const putRes = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const result = await putRes.json();
      if (!putRes.ok) throw new Error(result?.error || "Error actualizando imagen");

      onUpdated?.(newUrl);
      close();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "subject_image");
      fd.append("subjectId", subjectId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson?.error || "Error subiendo archivo");

      const fileUrl = uploadJson?.url;
      if (!fileUrl) throw new Error("No se recibio URL del upload");

      await updateImage(fileUrl);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-label="Editar portada"
        title="Editar portada"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/20"
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">Editar portada</span>
      </button>

      <SimpleModal isOpen={open} onClose={close} title="Editar imagen de la materia">
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Pega una URL o subi una imagen desde tu equipo. Formatos recomendados: JPG, PNG o GIF.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Link2 className="h-4 w-4 text-indigo-600" />
              <span>Usar imagen por URL</span>
            </div>
            <label htmlFor="subject-image-url" className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Pegar URL
            </label>
            <input
              id="subject-image-url"
              name="subject-image-url"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentImage || "/images/subjects/default.svg"}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={loading || !url.trim()}
                onClick={() => updateImage(url.trim())}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" />
                Guardar URL
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Upload className="h-4 w-4 text-emerald-600" />
              <span>Subir desde tu equipo</span>
            </div>
            <label htmlFor="subject-image-file" className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Seleccionar archivo
            </label>
            <input
              id="subject-image-file"
              name="subject-image-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {file && <p className="mt-2 text-sm text-slate-500">Archivo elegido: {file.name}</p>}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={loading || !file}
                onClick={handleUpload}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                Subir y usar
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
