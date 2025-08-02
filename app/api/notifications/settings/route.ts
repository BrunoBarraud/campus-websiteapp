// ⚙️ API para configuraciones de notificaciones
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener configuraciones de notificaciones del usuario
export async function GET() {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);

    const { data: settings, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no data found
      console.error('Error fetching notification settings:', error);
      return NextResponse.json(
        { error: 'Error al obtener configuraciones' },
        { status: 500 }
      );
    }

    // Si no existen configuraciones, crear las por defecto
    if (!settings) {
      const defaultSettings = {
        user_id: currentUser.id,
        email_notifications: true,
        push_notifications: true,
        assignment_notifications: true,
        grade_notifications: true,
        comment_notifications: true,
        announcement_notifications: true,
        system_notifications: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        quiet_hours_enabled: false
      };

      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('notification_settings')
        .insert(defaultSettings)
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating default notification settings:', createError);
        return NextResponse.json(
          { error: 'Error al crear configuraciones por defecto' },
          { status: 500 }
        );
      }

      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error in GET notification settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Actualizar configuraciones de notificaciones
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    
    const {
      email_notifications,
      push_notifications,
      assignment_notifications,
      grade_notifications,
      comment_notifications,
      announcement_notifications,
      system_notifications,
      quiet_hours_start,
      quiet_hours_end,
      quiet_hours_enabled
    } = await request.json();

    // Validar formato de horas si se proporcionan
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (quiet_hours_start && !timePattern.test(quiet_hours_start)) {
      return NextResponse.json(
        { error: 'Formato de hora de inicio inválido (HH:MM)' },
        { status: 400 }
      );
    }
    if (quiet_hours_end && !timePattern.test(quiet_hours_end)) {
      return NextResponse.json(
        { error: 'Formato de hora de fin inválido (HH:MM)' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
    if (push_notifications !== undefined) updateData.push_notifications = push_notifications;
    if (assignment_notifications !== undefined) updateData.assignment_notifications = assignment_notifications;
    if (grade_notifications !== undefined) updateData.grade_notifications = grade_notifications;
    if (comment_notifications !== undefined) updateData.comment_notifications = comment_notifications;
    if (announcement_notifications !== undefined) updateData.announcement_notifications = announcement_notifications;
    if (system_notifications !== undefined) updateData.system_notifications = system_notifications;
    if (quiet_hours_start !== undefined) updateData.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updateData.quiet_hours_end = quiet_hours_end;
    if (quiet_hours_enabled !== undefined) updateData.quiet_hours_enabled = quiet_hours_enabled;

    const { data: updatedSettings, error } = await supabaseAdmin
      .from('notification_settings')
      .update(updateData)
      .eq('user_id', currentUser.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating notification settings:', error);
      return NextResponse.json(
        { error: 'Error al actualizar configuraciones' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Error in PUT notification settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
