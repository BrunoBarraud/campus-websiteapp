import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// GET: Obtener tickets (admin ve todos, usuarios ven los suyos)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user:users!user_id (id, name, email, role, year, division)
      `)
      .order('created_at', { ascending: false });

    // Si no es admin, solo ve sus propios tickets
    if (session.user.role !== 'admin') {
      query = query.eq('user_id', session.user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error in tickets API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Crear nuevo ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, category, screenshot_url } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: subject, description, category' },
        { status: 400 }
      );
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: session.user.id,
        subject,
        description,
        category,
        screenshot_url: screenshot_url || null,
        status: 'open',
        priority: 'normal'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return NextResponse.json({ error: 'Error al crear ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    console.error('Error in create ticket API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
