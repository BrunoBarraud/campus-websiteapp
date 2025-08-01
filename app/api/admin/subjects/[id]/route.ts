// 📚 API para gestión individual de materias (PUT/DELETE)
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener una materia específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireRole(["admin", "teacher"]);

    console.log("🔍 GET Subject - Usuario autorizado:", currentUser.email);

    const { data, error } = await supabaseAdmin
      .from("subjects")
      .select(
        `
        *,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (currentUser.role === "student" && data.year !== currentUser.year) {
      return NextResponse.json(
        { error: "No tienes permiso para ver esta materia" },
        { status: 403 }
      );
    }

    if (currentUser.role === "teacher" && data.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: "No tienes permiso para ver esta materia" },
        { status: 403 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/admin/subjects/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar materia (Administradores y profesores propietarios)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireRole(["admin", "teacher"]);

    console.log("🔄 PUT Subject - Usuario autorizado:", currentUser.email);

    const requestData = await request.json();

    // Verificar que la materia existe y permisos
    const { data: existingSubject } = await supabaseAdmin
      .from("subjects")
      .select("id, teacher_id")
      .eq("id", id)
      .single();

    if (!existingSubject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que sea el propietario de la materia
    if (
      currentUser.role === "teacher" &&
      existingSubject.teacher_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta materia" },
        { status: 403 }
      );
    }

    let updateData: any;

    if (currentUser.role === "teacher") {
      // Los profesores solo pueden actualizar nombre e imagen
      const { name, image_url } = requestData;

      if (!name) {
        return NextResponse.json(
          { error: "El nombre es requerido" },
          { status: 400 }
        );
      }

      updateData = {
        name,
        image_url: image_url || null,
        updated_at: new Date().toISOString(),
      };

      console.log("🔄 PUT Subject (Teacher) - Datos a actualizar:", updateData);
    } else {
      // Los administradores pueden actualizar todo
      const {
        name,
        code,
        description,
        year,
        semester,
        credits,
        division,
        teacher_id,
        image_url,
      } = requestData;

      console.log("🔄 PUT Subject (Admin) - Datos recibidos:", {
        name,
        code,
        description,
        year,
        semester,
        credits,
        division,
        teacher_id,
        image_url,
      });

      // Validaciones para admin
      if (!name || !code || !year) {
        return NextResponse.json(
          { error: "Nombre, código y año son requeridos" },
          { status: 400 }
        );
      }

      if (year < 1 || year > 6) {
        return NextResponse.json(
          { error: "El año debe estar entre 1 y 6" },
          { status: 400 }
        );
      }

      // Verificar que el código no exista en otra materia
      const { data: existingCode } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("code", code)
        .neq("id", id)
        .single();

      if (existingCode) {
        return NextResponse.json(
          { error: "Ya existe otra materia con ese código" },
          { status: 400 }
        );
      }

      // Verificar que el profesor existe si se asigna uno
      if (teacher_id) {
        const { data: teacher } = await supabaseAdmin
          .from("users")
          .select("id, role")
          .eq("id", teacher_id)
          .eq("role", "teacher")
          .single();

        if (!teacher) {
          return NextResponse.json(
            {
              error:
                "El profesor seleccionado no existe o no tiene rol de profesor",
            },
            { status: 400 }
          );
        }
      }

      updateData = {
        name,
        code,
        description,
        year,
        semester: semester || 1,
        credits: credits || 3,
        division: division || null,
        teacher_id: teacher_id || null,
        image_url: image_url || null,
        updated_at: new Date().toISOString(),
      };
    }

    // Actualizar la materia
    const { data, error } = await supabaseAdmin
      .from("subjects")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `
      )
      .single();

    if (error) {
      console.error("Error updating subject:", error);
      return NextResponse.json(
        { error: "Error al actualizar la materia" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in PUT /api/admin/subjects/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar materia (Solo administradores)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireRole(["admin"]);

    console.log("🗑️ DELETE Subject - Usuario autorizado:", currentUser.email);

    // Verificar que la materia existe
    const { data: subject } = await supabaseAdmin
      .from("subjects")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si hay unidades o contenido asociado
    const { data: units } = await supabaseAdmin
      .from("subject_units")
      .select("id")
      .eq("subject_id", id)
      .limit(1);

    const { data: events } = await supabaseAdmin
      .from("calendar_events")
      .select("id")
      .eq("subject_id", id)
      .limit(1);

    if (units && units.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la materia porque tiene unidades asociadas",
        },
        { status: 400 }
      );
    }

    if (events && events.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la materia porque tiene eventos asociados",
        },
        { status: 400 }
      );
    }

    // Eliminar la materia
    const { error } = await supabaseAdmin
      .from("subjects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subject:", error);
      return NextResponse.json(
        { error: "Error al eliminar la materia" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Materia eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/subjects/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
