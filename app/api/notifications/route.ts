// 🔔 API para gestión de notificaciones
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread_only") === "true";
    const type = searchParams.get("type");

    let query = supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Error al obtener notificaciones" },
        { status: 500 }
      );
    }

    // Obtener estadísticas
    const { data: stats } = await supabaseAdmin.rpc("get_notification_stats", {
      target_user_id: currentUser.id,
    });

    return NextResponse.json({
      notifications: notifications || [],
      stats: stats?.[0] || {
        total_notifications: 0,
        unread_notifications: 0,
        high_priority_unread: 0,
        recent_notifications: 0,
      },
    });
  } catch (error) {
    console.error("Error in GET notifications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Crear una nueva notificación (solo para admins o sistema)
export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"]);

    const {
      user_id,
      user_ids, // Para notificaciones masivas
      title,
      message,
      type,
      priority = "normal",
      data,
      expires_at,
    } = await request.json();

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: "Título, mensaje y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Validar tipo de notificación
    const validTypes = [
      "assignment_new",
      "assignment_due_soon",
      "assignment_graded",
      "assignment_comment",
      "announcement",
      "subject_new_content",
      "system",
      "user_action",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de notificación inválido" },
        { status: 400 }
      );
    }

    // Crear notificación(es)
    const notifications = [];

    if (user_ids && Array.isArray(user_ids)) {
      // Notificación masiva
      for (const userId of user_ids) {
        notifications.push({
          user_id: userId,
          title,
          message,
          type,
          priority,
          data,
          expires_at,
        });
      }
    } else if (user_id) {
      // Notificación individual
      notifications.push({
        user_id,
        title,
        message,
        type,
        priority,
        data,
        expires_at,
      });
    } else {
      return NextResponse.json(
        { error: "Debe especificar user_id o user_ids" },
        { status: 400 }
      );
    }

    const { data: createdNotifications, error } = await supabaseAdmin
      .from("notifications")
      .insert(notifications)
      .select("*");

    if (error) {
      console.error("Error creating notifications:", error);
      return NextResponse.json(
        { error: "Error al crear notificaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json(createdNotifications, { status: 201 });
  } catch (error) {
    console.error("Error in POST notifications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Marcar notificaciones como leídas
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);

    const { notification_ids, mark_all_read } = await request.json();

    if (mark_all_read) {
      // Marcar todas las notificaciones como leídas
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json(
          { error: "Error al marcar notificaciones como leídas" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Todas las notificaciones marcadas como leídas",
      });
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Marcar notificaciones específicas como leídas
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in("id", notification_ids)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error marking notifications as read:", error);
        return NextResponse.json(
          { error: "Error al marcar notificaciones como leídas" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Notificaciones marcadas como leídas",
      });
    } else {
      return NextResponse.json(
        { error: "Debe especificar notification_ids o mark_all_read" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in PUT notifications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Eliminar notificaciones
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("delete_all") === "true";
    const deleteRead = searchParams.get("delete_read") === "true";

    if (deleteAll) {
      // Eliminar todas las notificaciones del usuario
      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error deleting all notifications:", error);
        return NextResponse.json(
          { error: "Error al eliminar notificaciones" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Todas las notificaciones eliminadas",
      });
    } else if (deleteRead) {
      // Eliminar solo las notificaciones leídas
      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("is_read", true);

      if (error) {
        console.error("Error deleting read notifications:", error);
        return NextResponse.json(
          { error: "Error al eliminar notificaciones leídas" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Notificaciones leídas eliminadas" });
    } else if (notificationId) {
      // Eliminar notificación específica
      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json(
          { error: "Error al eliminar notificación" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Notificación eliminada" });
    } else {
      return NextResponse.json(
        { error: "Debe especificar un ID de notificación o una acción" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE notifications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
