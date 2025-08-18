import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * Endpoint para verificar el estado de la autenticación de dos factores de un usuario
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el ID del usuario de la consulta
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Verificar que el usuario solicitado sea el mismo que está autenticado
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado para acceder a esta información' }, { status: 403 });
    }

    // Consultar el estado de 2FA del usuario en la base de datos
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('two_factor_enabled, two_factor_secret')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al consultar estado de 2FA:', error);
      return NextResponse.json({ error: 'Error al consultar estado de 2FA' }, { status: 500 });
    }

    // Devolver el estado de 2FA
    return NextResponse.json({
      enabled: data?.two_factor_enabled || false,
      hasSecret: !!data?.two_factor_secret
    });
  } catch (error) {
    console.error('Error en el endpoint de estado de 2FA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}