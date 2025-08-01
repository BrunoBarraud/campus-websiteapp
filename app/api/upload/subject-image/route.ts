import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/app/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Verificar que el usuario sea profesor o admin
    const currentUser = await requireRole(["admin", "teacher"]);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split(".").pop();
    const fileName = `subject-images/${
      currentUser.id
    }/${Date.now()}.${fileExtension}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file:", error);
      return NextResponse.json(
        { error: "Error al subir el archivo" },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    console.error("Error in POST /api/upload/subject-image:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Verificar que el usuario sea profesor o admin
    const currentUser = await requireRole(["admin", "teacher"]);

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "No se proporcionó la ruta del archivo" },
        { status: 400 }
      );
    }

    // Verificar que el usuario tenga permiso para eliminar este archivo
    if (
      currentUser.role === "teacher" &&
      !filePath.includes(`/${currentUser.id}/`)
    ) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este archivo" },
        { status: 403 }
      );
    }

    // Eliminar archivo de Supabase Storage
    const { error } = await supabase.storage.from("images").remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      return NextResponse.json(
        { error: "Error al eliminar el archivo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Archivo eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/upload/subject-image:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
