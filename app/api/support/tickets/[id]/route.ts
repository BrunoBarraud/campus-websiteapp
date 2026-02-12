import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// PATCH: Actualizar ticket (admin puede responder, cambiar estado)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { status, admin_response, priority } = body;

    const updateData: Record<string, any> = {};
    
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (admin_response) {
      updateData.admin_response = admin_response;
      updateData.responded_by = session.user.id;
      updateData.responded_at = new Date().toISOString();
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error in update ticket API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
