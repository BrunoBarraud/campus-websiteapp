// 📱 API para push notifications
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST - Suscribirse a push notifications
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);

    const {
      endpoint,
      keys, // { p256dh, auth }
      user_agent,
      device_type = "web",
    } = await request.json();

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Endpoint y keys (p256dh, auth) son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una suscripción para este endpoint
    const { data: existing } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("endpoint", endpoint)
      .single();

    if (existing) {
      // Actualizar suscripción existente
      const { data: subscription, error } = await supabaseAdmin
        .from("push_subscriptions")
        .update({
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          user_agent,
          device_type,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating push subscription:", error);
        return NextResponse.json(
          { error: "Error al actualizar suscripción" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        subscription,
        message: "Suscripción actualizada correctamente",
      });
    } else {
      // Crear nueva suscripción
      const { data: subscription, error } = await supabaseAdmin
        .from("push_subscriptions")
        .insert({
          user_id: currentUser.id,
          endpoint,
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          user_agent,
          device_type,
          is_active: true,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error creating push subscription:", error);
        return NextResponse.json(
          { error: "Error al crear suscripción" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          subscription,
          message: "Suscripción creada correctamente",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error in POST push subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET - Obtener suscripciones activas del usuario
export async function GET() {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching push subscriptions:", error);
      return NextResponse.json(
        { error: "Error al obtener suscripciones" },
        { status: 500 }
      );
    }

    return NextResponse.json(subscriptions || []);
  } catch (error) {
    console.error("Error in GET push subscriptions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Desuscribirse de push notifications
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const subscriptionId = searchParams.get("id");
    const unsubscribeAll = searchParams.get("all") === "true";

    if (unsubscribeAll) {
      // Desactivar todas las suscripciones del usuario
      const { error } = await supabaseAdmin
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error deactivating all push subscriptions:", error);
        return NextResponse.json(
          { error: "Error al desactivar suscripciones" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Todas las suscripciones desactivadas",
      });
    } else if (endpoint) {
      // Desactivar suscripción específica por endpoint
      const { error } = await supabaseAdmin
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", currentUser.id)
        .eq("endpoint", endpoint);

      if (error) {
        console.error(
          "Error deactivating push subscription by endpoint:",
          error
        );
        return NextResponse.json(
          { error: "Error al desactivar suscripción" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Suscripción desactivada" });
    } else if (subscriptionId) {
      // Desactivar suscripción específica por ID
      const { error } = await supabaseAdmin
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", currentUser.id)
        .eq("id", subscriptionId);

      if (error) {
        console.error("Error deactivating push subscription by ID:", error);
        return NextResponse.json(
          { error: "Error al desactivar suscripción" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Suscripción desactivada" });
    } else {
      return NextResponse.json(
        { error: "Debe especificar endpoint, id o all=true" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE push subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
