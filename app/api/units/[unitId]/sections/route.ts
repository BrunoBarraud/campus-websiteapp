import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { v4 as uuidv4 } from "uuid";

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

    const { data, error } = await supabaseAdmin
      .from("subject_content")
      .select(
        `
        *,
        creator:users ( name )
      `
      )
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching sections:", error);
      return NextResponse.json(
        { error: "Error al obtener las secciones de la unidad" },
        { status: 500 }
      );
    }

    // Modificación: agregar assignment_id, due_date, is_active si es tarea
    const sections = await Promise.all(
      data.map(async (section) => {
        const { creator, ...rest } = section;
        let assignment_id = null;
        let due_date = null;
        let is_active = null;
        if (section.content_type === "assignment") {
          const { data: assignment } = await supabaseAdmin
            .from("assignments")
            .select("id, due_date, is_active")
            .eq("subject_content_id", section.id)
            .single();
          assignment_id = assignment?.id || null;
          due_date = assignment?.due_date || null;
          is_active = assignment?.is_active ?? null;
        }
        return {
          ...rest,
          creator_name: creator ? creator.name : "Desconocido",
          assignment_id,
          due_date,
          is_active,
        };
      })
    );

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

    // Obtener el subject_id de la unidad
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

    // Validar tipos de contenido permitidos
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
      // Selecciona el bucket según el tipo de contenido
      const bucket =
        content_type === "assignment" ? "submission-files" : "assignment-files";
      const filePath = `subject_content/${unitId}/${uuidv4()}-${file.name}`;

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

    // Insertar en subject_content. Despues de crear el subject_content
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

    // Si es tarea, crear también en assignments
    if (content_type === "assignment") {
      const due_date = formData.get("due_date") as string | null;
      const is_active = formData.get("is_active") === "true";

      // Validar fecha de vencimiento
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
          subject_content_id: newContent.id, // <--- RELACIÓN DIRECTA
        });

      if (assignmentError) {
        return NextResponse.json(
          {
            error:
              "Se creó el contenido, pero falló al crear la tarea asociada.",
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
    const user = await requireRole(["teacher", "admin"]);
    const { unitId } = await context.params;
    const { searchParams } = new URL(request.url);
    const subjectContentId = searchParams.get("assignmentId"); // Es realmente el subject_content_id

    console.log("DELETE Request: unitId=", unitId, "subjectContentId=", subjectContentId);

    if (!unitId || !subjectContentId) {
      console.error("DELETE Error: Missing parameters", { unitId, subjectContentId });
      return NextResponse.json(
        { error: "Faltan parámetros unitId o assignmentId" },
        { status: 400 }
      );
    }

    // Verificar si el subject_content existe
    console.log("Verificando si existe subject_content:", {
      table: "subject_content",
      condition: { id: subjectContentId },
    });

    const { data: contentData, error: contentFetchError } = await supabaseAdmin
      .from("subject_content")
      .select("id, content_type")
      .eq("id", subjectContentId)
      .single();

    if (contentFetchError || !contentData) {
      console.error("DELETE Error: Contenido no encontrado", {
        contentFetchError,
        subjectContentId,
      });
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    console.log("Datos del contenido encontrado:", contentData);

    // Si es una tarea, eliminar primero de assignments
    if (contentData.content_type === "assignment") {
      console.log("Eliminando assignment relacionado");
      
      const { error: assignmentDeleteError } = await supabaseAdmin
        .from("assignments")
        .delete()
        .eq("subject_content_id", subjectContentId);

      if (assignmentDeleteError) {
        console.error("DELETE Error al eliminar assignment:", assignmentDeleteError);
        return NextResponse.json(
          { error: assignmentDeleteError.message || "Error al eliminar la tarea" },
          { status: 500 }
        );
      }
    }

    // Luego eliminar de subject_content
    console.log("Eliminando subject_content");
    
    const { error: contentDeleteError } = await supabaseAdmin
      .from("subject_content")
      .delete()
      .eq("id", subjectContentId);

    if (contentDeleteError) {
      console.error("DELETE Error al eliminar subject_content:", contentDeleteError);
      return NextResponse.json(
        { error: contentDeleteError.message || "Error al eliminar el contenido" },
        { status: 500 }
      );
    }

    console.log("DELETE Success: Contenido eliminado exitosamente");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error: Error interno del servidor", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
