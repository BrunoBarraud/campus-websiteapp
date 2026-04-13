import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { getUnitSections } from "@/app/lib/subjects/unitSections";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await context.params;
    if (!unitId) {
      return NextResponse.json(
        { error: "Falta el ID de la unidad" },
        { status: 400 }
      );
    }

    const sections = await getUnitSections(unitId);
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error interno del servidor en GET:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ unitId: string }> }
) {
  try {
    const user = await requireRole(["teacher", "admin"]);
    const { unitId } = await context.params;

    if (!unitId) {
      return NextResponse.json(
        { error: "Falta el ID de la unidad" },
        { status: 400 }
      );
    }

    const { data: unitData, error: unitError } = await supabaseAdmin
      .from("subject_units")
      .select("subject_id")
      .eq("id", unitId)
      .single();

    if (unitError || !unitData) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const title = formData.get("title") as string;
    const content_type = formData.get("content_type") as string;
    const content = formData.get("content") as string;
    const file = formData.get("file") as File | null;

    if (!title || !content_type) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (título, tipo de contenido)" },
        { status: 400 }
      );
    }

    const allowedContentTypes = ["assignment", "document", "video", "link"];
    if (!allowedContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: "Tipo de contenido no válido" },
        { status: 400 }
      );
    }

    let file_url = null;
    let file_name = null;

    if (file) {
      const bucket = content_type === "assignment" ? "assignment-files" : "documents";
      const sanitizedFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_.\-]/g, "");
      const filePath = `subject_content/${unitId}/${uuidv4()}-${sanitizedFileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        return NextResponse.json(
          { error: "Error al subir el archivo", detalle: uploadError.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(filePath);

      file_url = publicUrlData.publicUrl;
      file_name = file.name;
    }

    const { data: newContent, error: insertError } = await supabaseAdmin
      .from("subject_content")
      .insert({
        subject_id: unitData.subject_id,
        unit_id: unitId,
        title,
        content_type,
        content,
        file_url,
        file_name,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: "Error al crear el contenido en la base de datos",
          detalle: insertError.message,
        },
        { status: 500 }
      );
    }

    if (content_type === "assignment") {
      const due_date = formData.get("due_date") as string | null;
      const is_active = formData.get("is_active") === "true";

      if (due_date && new Date(due_date) < new Date()) {
        return NextResponse.json(
          { error: "La fecha de vencimiento no puede ser anterior a la fecha actual" },
          { status: 400 }
        );
      }

      const { error: assignmentError } = await supabaseAdmin
        .from("assignments")
        .insert({
          title,
          description: content,
          subject_id: unitData.subject_id,
          unit_id: unitId,
          created_by: user.id,
          is_active,
          due_date,
          subject_content_id: newContent.id,
        });

      if (assignmentError) {
        return NextResponse.json(
          {
            error: "Se creó el contenido, pero falló al crear la tarea asociada.",
            detalle: assignmentError.message,
          },
          { status: 500 }
        );
      }
    }

    if (!newContent) {
      return NextResponse.json(
        { error: "Contenido creado pero no se pudo recuperar la información." },
        { status: 500 }
      );
    }

    return NextResponse.json(newContent, { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes("User role")) {
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ unitId: string }> }
) {
  try {
    await requireRole(["teacher", "admin"]);
    const { unitId } = await context.params;
    const { searchParams } = new URL(request.url);
    const subjectContentId = searchParams.get("assignmentId");

    if (!unitId || !subjectContentId) {
      return NextResponse.json(
        { error: "Faltan parámetros unitId o assignmentId" },
        { status: 400 }
      );
    }

    const { data: contentData, error: contentFetchError } = await supabaseAdmin
      .from("subject_content")
      .select("id, content_type")
      .eq("id", subjectContentId)
      .single();

    if (contentFetchError || !contentData) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    if (contentData.content_type === "assignment") {
      const { error: assignmentDeleteError } = await supabaseAdmin
        .from("assignments")
        .delete()
        .eq("subject_content_id", subjectContentId);

      if (assignmentDeleteError) {
        return NextResponse.json(
          { error: assignmentDeleteError.message || "Error al eliminar la tarea" },
          { status: 500 }
        );
      }
    }

    const { error: contentDeleteError } = await supabaseAdmin
      .from("subject_content")
      .delete()
      .eq("id", subjectContentId);

    if (contentDeleteError) {
      return NextResponse.json(
        { error: contentDeleteError.message || "Error al eliminar el contenido" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error: Error interno del servidor", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
