// 📝 API para gestión de tareas/asignaciones
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener tareas
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { searchParams } = new URL(request.url);
    
    const subjectId = searchParams.get('subject_id');
    const teacherId = searchParams.get('teacher_id');
    const status = searchParams.get('status'); // 'published', 'draft', 'all'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('assignments')
      .select(`
        *,
        subject:subjects(id, name, code),
        teacher:users!assignments_teacher_id_fkey(id, name, email),
        _count_submissions:submissions(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros según el rol
    if (currentUser.role === 'student') {
      // Estudiantes solo ven tareas publicadas de sus materias
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', currentUser.id);
      
      const subjectIds = enrollments?.map(e => e.subject_id) || [];
      
      query = query
        .eq('is_published', true)
        .in('subject_id', subjectIds);
    } else if (currentUser.role === 'teacher') {
      // Profesores ven sus propias tareas o las de materias donde enseñan
      if (!teacherId || teacherId === currentUser.id) {
        query = query.eq('teacher_id', currentUser.id);
      }
    }

    // Filtros adicionales
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (status && status !== 'all') {
      if (status === 'published') {
        query = query.eq('is_published', true);
      } else if (status === 'draft') {
        query = query.eq('is_published', false);
      }
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json(
        { error: 'Error al obtener tareas' },
        { status: 500 }
      );
    }

    // Si es estudiante, agregar información de entrega
    if (currentUser.role === 'student') {
      const assignmentIds = assignments.map(a => a.id);
      
      const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('assignment_id, status, submitted_at, grades(*)')
        .eq('student_id', currentUser.id)
        .in('assignment_id', assignmentIds);

      // Combinar datos
      const assignmentsWithSubmissions = assignments.map(assignment => ({
        ...assignment,
        submission: submissions?.find(s => s.assignment_id === assignment.id) || null,
        is_overdue: new Date() > new Date(assignment.due_date),
        days_remaining: Math.ceil((new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));

      return NextResponse.json(assignmentsWithSubmissions);
    }

    return NextResponse.json(assignments);

  } catch (error) {
    console.error('Error in assignments GET:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(["teacher", "admin"]);
    const body = await request.json();

    const {
      subject_id,
      title,
      description,
      instructions,
      max_score = 100,
      due_date,
      allow_late_submission = true,
      late_penalty_percent = 10,
      file_allowed = true,
      max_file_size_mb = 10,
      allowed_file_types = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
      is_published = false
    } = body;

    // Validaciones
    if (!subject_id || !title || !description || !due_date) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el profesor puede crear tareas en esta materia
    if (currentUser.role === 'teacher') {
      const { data: subject, error } = await supabaseAdmin
        .from('subjects')
        .select('teacher_id')
        .eq('id', subject_id)
        .single();

      if (error || subject.teacher_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'No tienes permiso para crear tareas en esta materia' },
          { status: 403 }
        );
      }
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        subject_id,
        teacher_id: currentUser.id,
        title,
        description,
        instructions,
        max_score,
        due_date,
        allow_late_submission,
        late_penalty_percent,
        file_allowed,
        max_file_size_mb,
        allowed_file_types,
        is_published
      })
      .select(`
        *,
        subject:subjects(id, name, code),
        teacher:users!assignments_teacher_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return NextResponse.json(
        { error: 'Error al crear tarea' },
        { status: 500 }
      );
    }

    // Si se publica, crear notificaciones para estudiantes
    if (is_published) {
      const { data: students } = await supabaseAdmin
        .from('enrollments')
        .select('student_id, students:users!enrollments_student_id_fkey(id, name, email)')
        .eq('subject_id', subject_id);

      if (students && students.length > 0) {
        const notifications = students.map(enrollment => ({
          user_id: enrollment.student_id,
          title: 'Nueva tarea asignada',
          message: `Se ha asignado la tarea "${title}" en ${assignment.subject.name}`,
          type: 'assignment_new',
          priority: 'normal',
          data: {
            assignment_id: assignment.id,
            subject_id: subject_id,
            due_date: due_date
          }
        }));

        await supabaseAdmin
          .from('notifications')
          .insert(notifications);
      }
    }

    return NextResponse.json(assignment);

  } catch (error) {
    console.error('Error in assignments POST:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireRole(["teacher", "admin"]);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de tarea requerido' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('assignments')
      .select('teacher_id, is_published')
      .eq('id', id)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    if (currentUser.role === 'teacher' && assignment.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta tarea' },
        { status: 403 }
      );
    }

    const { data: updatedAssignment, error } = await supabaseAdmin
      .from('assignments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        subject:subjects(id, name, code),
        teacher:users!assignments_teacher_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json(
        { error: 'Error al actualizar tarea' },
        { status: 500 }
      );
    }

    // Si se acaba de publicar, notificar a estudiantes
    if (!assignment.is_published && updateData.is_published) {
      const { data: students } = await supabaseAdmin
        .from('enrollments')
        .select('student_id')
        .eq('subject_id', updatedAssignment.subject_id);

      if (students && students.length > 0) {
        const notifications = students.map(enrollment => ({
          user_id: enrollment.student_id,
          title: 'Nueva tarea asignada',
          message: `Se ha asignado la tarea "${updatedAssignment.title}" en ${updatedAssignment.subject.name}`,
          type: 'assignment_new',
          priority: 'normal',
          data: {
            assignment_id: updatedAssignment.id,
            subject_id: updatedAssignment.subject_id,
            due_date: updatedAssignment.due_date
          }
        }));

        await supabaseAdmin
          .from('notifications')
          .insert(notifications);
      }
    }

    return NextResponse.json(updatedAssignment);

  } catch (error) {
    console.error('Error in assignments PUT:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
