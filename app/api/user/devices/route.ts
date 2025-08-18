import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * Endpoint para obtener los dispositivos conectados del usuario actual
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Obtener dispositivos conectados del usuario desde sessions
    const { data: devices, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active', { ascending: false });
    
    if (error) {
      console.error('Error al obtener dispositivos conectados:', error);
      return NextResponse.json(
        { error: 'Error al obtener dispositivos conectados' },
        { status: 500 }
      );
    }
    
    // Identificar el dispositivo actual
    const currentSessionToken = (session as any).sessionToken;
    const devicesWithCurrentFlag = devices.map(device => ({
      ...device,
      is_current: device.session_token === currentSessionToken
    }));
    
    return NextResponse.json({ devices: devicesWithCurrentFlag });
  } catch (error) {
    console.error('Error inesperado en API de dispositivos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}