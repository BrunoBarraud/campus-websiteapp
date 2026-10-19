import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { createAccessDeniedResponse } from "@/app/lib/auth/adminCheck";
import {
  requireSession,
  canManageSubject,
  canViewSubject,
  isConversationParticipant,
  SessionUser,
} from "@/app/lib/auth/routeGuards";

// Bucket privado: los archivos solo se sirven mediante URLs firmadas de corta duración
const UPLOADS_BUCKET = "uploads";
const SIGNED_URL_TTL_SECONDS = 60;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

// type → quién puede subir/leer. `scopeId` es la materia o la conversación según el tipo.
const UPLOAD_TYPES = ["subject_image", "messages", "assignment_submission"] as const;
type UploadType = (typeof UPLOAD_TYPES)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_PATH_RE = /^([a-z_]+)\/([0-9a-f-]{36})\/([0-9a-f-]{36})_\d+\.[a-z0-9]+$/i;

function isUploadType(value: string | null): value is UploadType {
  return !!value && (UPLOAD_TYPES as readonly string[]).includes(value);
}

async function canUpload(user: SessionUser, type: UploadType, scopeId: string): Promise<boolean> {
  switch (type) {
    case "subject_image":
      return canManageSubject(user, scopeId);
    case "messages":
      return isConversationParticipant(user, scopeId);
    case "assignment_submission":
      return canViewSubject(user, scopeId);
  }
}

async function canRead(user: SessionUser, type: UploadType, scopeId: string, ownerId: string): Promise<boolean> {
  switch (type) {
    case "subject_image":
      // Las portadas de materias las ve cualquier usuario autenticado del campus
      return true;
    case "messages":
      return isConversationParticipant(user, scopeId);
    case "assignment_submission":
      return ownerId === user.id || canManageSubject(user, scopeId);
  }
}

let bucketReady: Promise<void> | null = null;

// Crea el bucket privado la primera vez si todavía no existe
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await supabaseAdmin.storage.getBucket(UPLOADS_BUCKET);
      if (data) return;
      const { error } = await supabaseAdmin.storage.createBucket(UPLOADS_BUCKET, {
        public: false,
        fileSizeLimit: MAX_SIZE,
      });
      if (error && !/already exists/i.test(error.message)) {
        throw error;
      }
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }
  return bucketReady;
}

// POST /api/upload - Sube un archivo al bucket privado y devuelve una URL estable de la app
export async function POST(request: NextRequest) {
  try {
    const guard = await requireSession();
    if (!guard.ok) return guard.response;
    const user = guard.user;

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") as string | null;
    const scopeId = formData.get("subjectId") as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se ha seleccionado ningún archivo" }, { status: 400 });
    }

    if (!isUploadType(type) || !scopeId || !UUID_RE.test(scopeId)) {
      return NextResponse.json({ error: "Tipo de subida o destino inválido" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 10MB)" }, { status: 400 });
    }

    const extension = ALLOWED_MIME_TYPES[file.type];
    if (!extension) {
      return NextResponse.json({
        error: "Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, TXT, JPG, PNG, GIF",
      }, { status: 400 });
    }

    if (!(await canUpload(user, type, scopeId))) {
      return createAccessDeniedResponse("No tienes permisos para subir archivos a este destino");
    }

    await ensureBucket();

    const objectPath = `${type}/${scopeId}/${user.id}_${Date.now()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(UPLOADS_BUCKET)
      .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }

    return NextResponse.json({
      url: `/api/upload?path=${encodeURIComponent(objectPath)}`,
      path: objectPath,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}

// GET /api/upload?path=... - Verifica permisos y redirige a una URL firmada de corta duración
export async function GET(request: NextRequest) {
  try {
    const guard = await requireSession();
    if (!guard.ok) return guard.response;

    const objectPath = request.nextUrl.searchParams.get("path") || "";
    const match = OBJECT_PATH_RE.exec(objectPath);
    if (!match || !isUploadType(match[1])) {
      return NextResponse.json({ error: "Ruta de archivo inválida" }, { status: 400 });
    }

    const [, type, scopeId, ownerId] = match;
    if (!(await canRead(guard.user, type as UploadType, scopeId, ownerId))) {
      return createAccessDeniedResponse("No tienes acceso a este archivo");
    }

    const { data, error } = await supabaseAdmin.storage
      .from(UPLOADS_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    const response = NextResponse.redirect(data.signedUrl, { status: 302 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ error: "Error al obtener el archivo" }, { status: 500 });
  }
}
