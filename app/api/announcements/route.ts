// 📢 API para anuncios del campus
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener anuncios
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const activeOnly = searchParams.get("active_only") !== "false";

    let query = supabaseAdmin
      .from("announcements")
      .select(
        `
        *,
        author:users!announcements_author_id_fkey(
          id,
          email,
          name
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    // Filtrar por rol si no es admin
    if (currentUser.role !== "admin") {
      query = query.or(
        `target_audience.eq.${currentUser.role},target_audience.eq.all,target_audience.is.null`
      );
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error("Error fetching announcements:", error);
      return NextResponse.json(
        { error: "Error al obtener anuncios" },
        { status: 500 }
      );
    }

    return NextResponse.json(announcements || []);
  } catch (error) {
    console.error("Error in GET announcements:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Crear nuevo anuncio (solo admins)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin"]);

    const {
      title,
      content,
      priority = "normal",
      target_roles,
      expires_at,
      is_pinned = false,
    } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Título y contenido son requeridos" },
        { status: 400 }
      );
    }

    // Validar roles objetivo
    const validRoles = ["admin", "teacher", "student"];
    if (target_roles && Array.isArray(target_roles)) {
      const invalidRoles = target_roles.filter(
        (role) => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { error: `Roles inválidos: ${invalidRoles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validar prioridad
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Prioridad inválida" },
        { status: 400 }
      );
    }

    const { data: announcement, error } = await supabaseAdmin
      .from("announcements")
      .insert({
        title,
        content,
        author_id: currentUser.id,
        priority,
        target_roles,
        expires_at,
        is_pinned,
      })
      .select(
        `
        *,
        author:users!announcements_author_id_fkey(
          id,
          email,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating announcement:", error);
      return NextResponse.json(
        { error: "Error al crear anuncio" },
        { status: 500 }
      );
    }

    // Crear notificaciones para los usuarios objetivo
    try {
      const { data: targetUsers, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", target_roles || ["admin", "teacher", "student"]);

      if (!usersError && targetUsers) {
        const notifications = targetUsers.map((user) => ({
          user_id: user.id,
          title: `📢 Nuevo anuncio: ${title}`,
          message:
            content.substring(0, 200) + (content.length > 200 ? "..." : ""),
          type: "announcement",
          priority,
          data: { announcement_id: announcement.id },
        }));

        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch (notificationError) {
      console.error(
        "Error creating notifications for announcement:",
        notificationError
      );
      // No fallar la creación del anuncio por error en notificaciones
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error in POST announcement:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Actualizar anuncio (solo admins)
export async function PUT(request: NextRequest) {
  try {
    await requireRole(["admin"]);

    const {
      id,
      title,
      content,
      priority,
      target_roles,
      expires_at,
      is_pinned,
      is_active,
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID del anuncio es requerido" },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (target_roles !== undefined) updateData.target_roles = target_roles;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: announcement, error } = await supabaseAdmin
      .from("announcements")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        author:users!announcements_author_id_fkey(
          id,
          email,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating announcement:", error);
      return NextResponse.json(
        { error: "Error al actualizar anuncio" },
        { status: 500 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error in PUT announcement:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Eliminar anuncio (solo admins)
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID del anuncio es requerido" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting announcement:", error);
      return NextResponse.json(
        { error: "Error al eliminar anuncio" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Anuncio eliminado correctamente" });
  } catch (error) {
    console.error("Error in DELETE announcement:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
