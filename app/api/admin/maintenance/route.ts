import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// GET: Obtener estado de mantenimiento
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    if (error) {
      // Si no existe, retornar deshabilitado
      return NextResponse.json({ 
        enabled: false, 
        message: 'Estamos realizando mejoras en el Campus. Volvemos pronto.',
        estimated_end: null 
      });
    }

    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json({ enabled: false });
  }
}

// POST: Activar/desactivar modo mantenimiento (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, message, estimated_end } = body;

    const value = {
      enabled: enabled ?? false,
      message: message || 'Estamos realizando mejoras en el Campus. Volvemos pronto.',
      estimated_end: estimated_end || null
    };

    const { error } = await supabaseAdmin
      .from('site_config')
      .upsert({
        key: 'maintenance_mode',
        value,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      });

    if (error) {
      console.error('Error updating maintenance mode:', error);
      return NextResponse.json({ error: 'Error al actualizar modo mantenimiento' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: enabled ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado',
      data: value
    });
  } catch (error) {
    console.error('Error in maintenance API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
