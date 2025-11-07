"use client";

import React, { useState } from "react";

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

  // Fetch current subject, then PUT with updated image_url (server-side validation requires full payload)
  async function updateImage(newUrl: string) {
    setLoading(true);
    setError(null);
    try {
      const getRes = await fetch(`/api/subjects/${subjectId}`, { credentials: "include" });
      if (!getRes.ok) throw new Error("No se pudo obtener la materia");
      const payload = await getRes.json();
      const data = payload?.data;
      if (!data) throw new Error("Datos de materia inválidos");

      const body = {
        name: data.name,
        code: data.code,
        description: data.description || "",
        year: data.year,
        division: data.division || null,
        teacher_id: data.teacher_id || null,
        image_url: newUrl
      };

      const putRes = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      const result = await putRes.json();
      if (!putRes.ok) throw new Error(result?.error || 'Error actualizando imagen');

      if (onUpdated) {
        onUpdated(newUrl);
      }
      close();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!file) return setError('Selecciona un archivo');
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'subject_image');
      fd.append('subjectId', subjectId);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson?.error || 'Error subiendo archivo');

      const fileUrl = uploadJson?.url;
      if (!fileUrl) throw new Error('No se recibió URL del upload');

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
        aria-label="Editar imagen"
        title="Editar imagen"
        onPointerDown={(e) => {
          // Prevent parent Link navigation before it can trigger
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          // Prevent parent Link navigation when clicked
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className="p-1 rounded-full bg-surface/80 hover:bg-[var(--muted)] shadow-sm border border-border"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09c0-.58-.37-1.09-.92-1.41a1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 012.31 18.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09c.58 0 1.09-.37 1.41-.92.27-.46.19-1.03-.21-1.42l-.06-.06A2 2 0 017.1 2.31l.06.06c.38.38.96.48 1.42.21.55-.33 1.16-.52 1.81-.52H12c.65 0 1.26.19 1.81.52.46.27 1.04.17 1.42-.21l.06-.06a2 2 0 013.02 0l-.06.06c.38.38.48.96.21 1.42-.33.55-.52 1.16-.52 1.81V9c0 .65.19 1.26.52 1.81.27.46.17 1.04-.21 1.42l-.06.06z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-4">
            <h3 className="font-semibold mb-2">Editar imagen de la materia</h3>
            <p className="text-sm text-gray-600 mb-3">Puedes pegar una URL o subir una imagen desde tu equipo (JPG/PNG/GIF, máximo 10MB).</p>

            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Pegar URL</label>
              <input className="w-full border border-border bg-surface text-[var(--foreground)] px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" value={url} onChange={e => setUrl(e.target.value)} placeholder={currentImage || '/images/ipdvs-logo.png'} />
              <div className="flex justify-end mt-2">
                <button disabled={loading} onClick={() => updateImage(url)} className="px-3 py-1 rounded disabled:opacity-60 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">Guardar URL</button>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">O subir archivo</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
              <div className="flex justify-end mt-2">
                <button disabled={loading} onClick={handleUpload} className="px-3 py-1 rounded disabled:opacity-60 bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90">Subir y usar</button>
              </div>
            </div>

            {error && <p className="text-sm text-[var(--accent)] mb-2">{error}</p>}

            <div className="flex justify-between">
              <button onClick={close} className="px-3 py-1 border border-border rounded hover:bg-[var(--muted)]">Cancelar</button>
              <button onClick={close} className="px-3 py-1 border border-border rounded hover:bg-[var(--muted)]">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
