// 📄 API para gestión de contenidos de unidades (Profesores y Administradores)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener contenidos de una unidad específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: subjectId, unitId } = await params;

    // Validar que los parámetros sean strings válidos
    if (
      !subjectId ||
      !unitId ||
      typeof subjectId !== "string" ||
      typeof unitId !== "string"
    ) {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    // Verificar que la materia existe
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, name, teacher_id")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from("subject_units")
      .select("id, title")
      .eq("id", unitId)
      .eq("subject_id", subjectId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (
      currentUser.role === "teacher" &&
      subject.teacher_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta materia" },
        { status: 403 }
      );
    }

    // Obtener los contenidos de la unidad
    const { data: contents, error } = await supabaseAdmin
      .from("subject_content")
      .select(
        `
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        file_url,
        file_name,
        created_by,
        is_pinned,
        is_active,
        created_at,
        updated_at,
        creator:users!subject_content_created_by_fkey(id, name, email)
      `
      )
      .eq("subject_id", subjectId)
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contents:", error);
      return NextResponse.json(
        { error: "Error al obtener los contenidos" },
        { status: 500 }
      );
    }

    return NextResponse.json(contents || []);
  } catch (error: any) {
    console.error(
      "Error in GET /api/subjects/[id]/units/[unitId]/contents:",
      error
    );
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo contenido en una unidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher"]);
    const { id: subjectId, unitId } = await params;

    // Verificar que la materia existe y el profesor tiene acceso
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, name, teacher_id")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (
      currentUser.role === "teacher" &&
      subject.teacher_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta materia" },
        { status: 403 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from("subject_units")
      .select("id")
      .eq("id", unitId)
      .eq("subject_id", subjectId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Leer datos del formulario (FormData)
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const content_type = formData.get("content_type") as string;
    const is_pinned = formData.get("is_pinned") === "true";
    const file = formData.get("file") as File | null;

    // DEBUG: Ver si el archivo llega
    console.log("Archivo recibido en backend:", file);

    // Validaciones
    if (!title || !content_type) {
      return NextResponse.json(
        { error: "Título y tipo de contenido son requeridos" },
        { status: 400 }
      );
    }

    // Tipos de contenido válidos
    const validContentTypes = [
      "text",
      "video",
      "document",
      "link",
      "assignment",
      "content",
    ];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: "Tipo de contenido inválido" },
        { status: 400 }
      );
    }

    let file_url = null;
    let file_name = null;

    // Si hay archivo, subirlo a Supabase Storage
    if (
      file &&
      typeof file === "object" &&
      "arrayBuffer" in file &&
      file.size > 0
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      file_name = file.name;

      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("documents")
          .upload(`${subjectId}/${unitId}/${Date.now()}_${file.name}`, buffer, {
            contentType: file.type,
            upsert: true,
          });

      // DEBUG: Ver resultado de la subida
      console.log("Resultado subida:", { uploadData, uploadError });

      if (uploadError) {
        return NextResponse.json(
          { error: "Error al subir el archivo" },
          { status: 500 }
        );
      }

      file_url = uploadData?.path
        ? supabaseAdmin.storage.from("documents").getPublicUrl(uploadData.path)
            .data.publicUrl
        : null;
    }

    // Crear el contenido
    const { data, error } = await supabaseAdmin
      .from("subject_content")
      .insert([
        {
          subject_id: subjectId,
          unit_id: unitId,
          title,
          content,
          content_type,
          file_url,
          file_name,
          created_by: currentUser.id,
          is_pinned,
          is_active: true,
        },
      ])
      .select(
        `
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        file_url,
        file_name,
        created_by,
        is_pinned,
        is_active,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      console.error("Error creating content:", error);
      return NextResponse.json(
        { error: "Error al crear el contenido" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error(
      "Error in POST /api/subjects/[id]/units/[unitId]/contents:",
      error
    );
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar contenido de una unidad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher"]);
    const { id: subjectId, unitId } = await params;

    // Verificar que la materia existe y el profesor tiene acceso
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, name, teacher_id")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (
      currentUser.role === "teacher" &&
      subject.teacher_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta materia" },
        { status: 403 }
      );
    }

    // Leer datos del formulario (FormData)
    const formData = await request.formData();
    const contentId = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const content_type = formData.get("content_type") as string;
    const is_pinned = formData.get("is_pinned") === "true";
    const file = formData.get("file") as File | null;

    // Validaciones
    if (!contentId || !title || !content_type) {
      return NextResponse.json(
        { error: "ID, título y tipo de contenido son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el contenido existe y pertenece a la unidad y materia
    const { data: existingContent, error: contentError } = await supabaseAdmin
      .from("subject_content")
      .select("id, file_url, file_name")
      .eq("id", contentId)
      .eq("unit_id", unitId)
      .eq("subject_id", subjectId)
      .single();

    if (contentError || !existingContent) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    let file_url = existingContent.file_url;
    let file_name = existingContent.file_name;

    // Si hay archivo nuevo, subirlo a Supabase Storage
    if (
      file &&
      typeof file === "object" &&
      "arrayBuffer" in file &&
      file.size > 0
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      file_name = file.name;

      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("documents")
          .upload(`${subjectId}/${unitId}/${Date.now()}_${file.name}`, buffer, {
            contentType: file.type,
            upsert: true,
          });

      if (uploadError) {
        return NextResponse.json(
          { error: "Error al subir el archivo" },
          { status: 500 }
        );
      }

      file_url = uploadData?.path
        ? supabaseAdmin.storage.from("documents").getPublicUrl(uploadData.path)
            .data.publicUrl
        : null;
    }

    // Actualizar el contenido
    const { data, error } = await supabaseAdmin
      .from("subject_content")
      .update({
        title,
        content,
        content_type,
        file_url,
        file_name,
        is_pinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .eq("unit_id", unitId)
      .eq("subject_id", subjectId)
      .select(
        `
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        file_url,
        file_name,
        is_pinned,
        is_active,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al actualizar el contenido" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(
      "Error in PUT /api/subjects/[id]/units/[unitId]/contents:",
      error
    );
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
