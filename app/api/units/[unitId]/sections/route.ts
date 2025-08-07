import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  context: { params: { unitId: string } }
) {
  try {
    const { unitId } = await context.params;
    console.log("GET /api/units/[unitId]/sections - unitId:", unitId);

    if (!unitId) {
      console.log("Falta el ID de la unidad");
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
      console.error("Error fetching sections:", error.message);
      return NextResponse.json(
        { error: "Error al obtener las secciones de la unidad" },
        { status: 500 }
      );
    }

    const sections = data.map((section) => {
      const { creator, ...rest } = section;
      return {
        ...rest,
        creator_name: creator ? creator.name : "Desconocido",
      };
    });

    return NextResponse.json(sections);
  } catch (error: any) {
    console.error("Error en GET /api/units/[unitId]/sections:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { unitId: string } }
) {
  console.log("Entrando al POST /api/units/[unitId]/sections");
  try {
    const user = await requireRole(["teacher", "admin"]);
    console.log("Usuario autenticado:", user);

    const { unitId } = await context.params;
    console.log("unitId recibido:", unitId);

    if (!unitId) {
      console.log("Falta el ID de la unidad");
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

    console.log("unitData:", unitData, "unitError:", unitError);

    if (unitError || !unitData) {
      console.error("Error fetching unit or unit not found:", unitError);
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    console.log("Obteniendo formData...");
    const formData = await request.formData();
    console.log("formData obtenido");

    const title = formData.get("title") as string;
    const content_type = formData.get("content_type") as string;
    const content = formData.get("content") as string;
    const file = formData.get("file") as File | null;

    console.log("Datos recibidos:", { title, content_type, content, file });

    if (!title || !content_type) {
      console.log("Faltan campos requeridos");
      return NextResponse.json(
        { error: "Faltan campos requeridos (título, tipo de contenido)" },
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
      console.log("Subiendo archivo a bucket:", bucket, "con path:", filePath);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error subiendo archivo:", uploadError);
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
      console.log("Archivo subido. file_url:", file_url);
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
      console.error("Error insertando contenido:", insertError);
      return NextResponse.json(
        {
          error: "Error al crear el contenido en la base de datos",
          detalle: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log("Contenido creado:", newContent);

    if (content_type === "assignment") {
      // Log para depuración
      console.log("Intentando crear assignment con:", {
        title,
        description: content,
        subject_id: unitData.subject_id,
        unit_id: unitId,
        created_by: user.id,
        is_active: true,
      });

      const { error: assignmentError } = await supabaseAdmin
        .from("assignments")
        .insert({
          title,
          description: content,
          subject_id: unitData.subject_id,
          unit_id: unitId,
          created_by: user.id,
          is_active: true,
          due_date: new Date().toISOString(),
        });

      if (assignmentError) {
        console.error("Error creating assignment entry:", assignmentError);
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
      console.error(
        "Contenido creado pero no se pudo recuperar la información."
      );
      return NextResponse.json(
        { error: "Contenido creado pero no se pudo recuperar la información." },
        { status: 500 }
      );
    }

    console.log("POST /api/units/[unitId]/sections finalizado OK");
    return NextResponse.json(newContent, { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/units/[unitId]/sections:", error);
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

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(["teacher", "admin"]);
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Falta el ID de la tarea" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      return NextResponse.json(
        { error: "Error al eliminar la tarea", detalle: error.message },
        { status: 500 }
      );
    }

    // También borra la sección en subject_content
    await supabaseAdmin.from("subject_content").delete().eq("id", assignmentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: error?.message },
      { status: 500 }
    );
  }
}
