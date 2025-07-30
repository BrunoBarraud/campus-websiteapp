import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole, requireSubjectTeacher } from '@/app/lib/permissions';

// GET - Obtener asignaciones de una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { id: subjectId } = await params;

    // Students can only see assignments for subjects they have access to
    if (currentUser.role === 'student') {
      // Check if student has access to this subject
      const { data: subject, error: subjectError } = await supabaseAdmin
        .from('subjects')
        .select('year, division')
        .eq('id', subjectId)
        .single();

      if (subjectError || !subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }

      // Check if student belongs to this subject's year and division
      if (subject.year !== currentUser.year || subject.division !== currentUser.division) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Teachers can only see assignments for subjects they teach
    if (currentUser.role === 'teacher') {
      await requireSubjectTeacher(subjectId);
    }

    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        subject_id,
        created_by,
        created_at,
        updated_at,
        subject:subjects(name)
      `)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json(
        { error: 'Error al obtener las asignaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json(assignments || []);
  } catch (error: unknown) {
    console.error('Error in assignments GET:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Crear nueva asignación (solo profesores y admin) con soporte para archivos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

    // Teachers can only create assignments for subjects they teach
    if (currentUser.role === 'teacher') {
      await requireSubjectTeacher(subjectId);
    }

    // Verificar si es FormData (con archivo) o JSON
    const contentType = request.headers.get('content-type');
    let data: any = {};
    let file: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      // Manejar FormData con archivos
      const formData = await request.formData();
      
      // Extraer campos del formulario
      data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        due_date: formData.get('due_date') as string,
        max_score: parseInt(formData.get('max_score') as string) || 100,
        instructions: formData.get('instructions') as string || null,
        unit_id: formData.get('unit_id') as string || null,
        is_active: formData.get('is_active') === 'true'
      };

      // Obtener archivo si existe
      file = formData.get('assignment_file') as File;
    } else {
      // Manejar JSON simple
      data = await request.json();
    }

    const { title, description, due_date, max_score = 100, instructions, unit_id, is_active = false } = data;

    if (!title || !description || !due_date) {
      return NextResponse.json(
        { error: 'Título, descripción y fecha de entrega son requeridos' },
        { status: 400 }
      );
    }

    // Validar fecha
    const dueDate = new Date(due_date);
    if (isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { error: 'Fecha de entrega inválida' },
        { status: 400 }
      );
    }

    // Verificar que la unidad existe si se especifica
    if (unit_id && unit_id !== 'null') {
      const { data: unit, error: unitError } = await supabaseAdmin
        .from('subject_units')
        .select('id')
        .eq('id', unit_id)
        .eq('subject_id', subjectId)
        .single();

      if (unitError || !unit) {
        return NextResponse.json(
          { error: 'Unidad no encontrada' },
          { status: 400 }
        );
      }
    }

    // let fileUrl: string | null = null;
    // let fileName: string | null = null;

    // Subir archivo a Supabase Storage si existe
    if (file && file.size > 0) {
      try {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const filePath = `assignments/${subjectId}/${uniqueFileName}`;

        // Convertir File a ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('assignment-files')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return NextResponse.json(
            { error: 'Error al subir el archivo' },
            { status: 500 }
          );
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabaseAdmin.storage
          .from('assignment-files')
          .getPublicUrl(uploadData.path);

        // fileUrl = urlData.publicUrl;
        // fileName = file.name;
        
        console.log('File uploaded successfully:', urlData.publicUrl);

      } catch (uploadError) {
        console.error('Error processing file:', uploadError);
        return NextResponse.json(
          { error: 'Error al procesar el archivo' },
          { status: 500 }
        );
      }
    }

    // Crear la asignación (temporalmente sin soporte de archivos hasta agregar columnas)
    const { data: assignment, error } = await supabaseAdmin
      .from('assignments')
      .insert([{
        subject_id: subjectId,
        title,
        description,
        due_date: dueDate.toISOString(),
        max_score,
        instructions,
        unit_id: unit_id && unit_id !== 'null' ? unit_id : null,
        is_active,
        // Comentado temporalmente hasta agregar columnas
        // file_url: fileUrl,
        // file_name: fileName,
        created_by: currentUser.id
      }])
      .select(`
        id,
        title,
        description,
        due_date,
        max_score,
        instructions,
        is_active,
        unit_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return NextResponse.json(
        { error: 'Error al crear la asignación' },
        { status: 500 }
      );
    }

    return NextResponse.json(assignment, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/subjects/[id]/assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Actualizar asignación existente (solo profesores y admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

    // Teachers can only update assignments for subjects they teach
    if (currentUser.role === 'teacher') {
      await requireSubjectTeacher(subjectId);
    }

    const body = await request.json();
    const { id: assignmentId, ...updateData } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'ID de asignación es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la asignación existe y pertenece a la materia
    const { data: existingAssignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id, subject_id')
      .eq('id', assignmentId)
      .eq('subject_id', subjectId)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar la asignación
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select(`
        id,
        title,
        description,
        due_date,
        max_score,
        instructions,
        is_active,
        unit_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la asignación' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PUT /api/subjects/[id]/assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar asignación (solo profesores y admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

    // Teachers can only delete assignments for subjects they teach
    if (currentUser.role === 'teacher') {
      await requireSubjectTeacher(subjectId);
    }

    const body = await request.json();
    const { id: assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'ID de asignación es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la asignación existe y pertenece a la materia
    const { data: existingAssignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id, subject_id, file_url')
      .eq('id', assignmentId)
      .eq('subject_id', subjectId)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar primero las entregas asociadas
    await supabaseAdmin
      .from('assignment_submissions')
      .delete()
      .eq('assignment_id', assignmentId);

    // Eliminar archivo de Supabase Storage si existe
    /* Comentado temporalmente hasta agregar soporte de archivos a la BD
    if (existingAssignment.file_url) {
      try {
        // Extraer la ruta del archivo de la URL
        const url = new URL(existingAssignment.file_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // assignments/subjectId/filename
        
        await supabaseAdmin.storage
          .from('assignment-files')
          .remove([filePath]);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continuar con la eliminación de la asignación aunque falle el archivo
      }
    }
    */

    // Eliminar la asignación
    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la asignación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Asignación eliminada exitosamente' });

  } catch (error) {
    console.error('Error in DELETE /api/subjects/[id]/assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}