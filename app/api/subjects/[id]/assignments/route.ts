import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { id: subjectId } = await params;

    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        max_score,
        instructions,
        is_active,
        created_at,
        unit:subject_units(title)
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json(
        { error: 'Error al obtener las tareas' },
        { status: 500 }
      );
    }

    return NextResponse.json(assignments || []);
  } catch (error: unknown) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;
    const body = await request.json();

    if (!body.title || !body.description || !body.due_date) {
      return NextResponse.json(
        { error: 'Título, descripción y fecha de entrega son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        subject_id: subjectId,
        unit_id: body.unit_id || null,
        title: body.title,
        description: body.description,
        due_date: body.due_date,
        max_score: body.max_score || 100,
        instructions: body.instructions || null,
        created_by: currentUser.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return NextResponse.json(
        { error: 'Error al crear la tarea' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}