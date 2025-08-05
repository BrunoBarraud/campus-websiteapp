// 📄 API para gestión de contenidos de unidades (Profesores y Administradores)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener contenidos de una unidad específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { id: subjectId, unitId } = await params;

    // Verificar que la materia existe
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id, title')
      .eq('id', unitId)
      .eq('subject_id', subjectId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta materia' },
        { status: 403 }
      );
    }

        // Obtener los contenidos de la unidad
    const { data: contents, error } = await supabaseAdmin
      .from('subject_content')
      .select(`
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        file_url,
        file_name,
        created_by,
        is_pinned,
        is_active,
        created_at,
        updated_at,
        creator:users!subject_content_created_by_fkey(id, name, email)
      `)
      .eq('subject_id', subjectId)
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contents:', error);
      return NextResponse.json(
        { error: 'Error al obtener los contenidos' },
        { status: 500 }
      );
    }

    return NextResponse.json(contents || []);

  } catch (error: any) {
    console.error('Error in GET /api/subjects/[id]/units/[unitId]/contents:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo contenido en una unidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, unitId } = await params;

    // Verificar que la materia existe y el profesor tiene acceso
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id')
      .eq('id', unitId)
      .eq('subject_id', subjectId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si es FormData (para archivos) o JSON
    let title, content, content_type, is_pinned, file;
    let file_url = null;
    let file_name = null;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Manejar FormData (con archivos)
      const formData = await request.formData();
      title = formData.get('title') as string;
      content = formData.get('content') as string;
      content_type = formData.get('content_type') as string;
      is_pinned = formData.get('is_pinned') === 'true';
      file = formData.get('file') as File;

      // Si hay archivo, procesarlo
      if (file) {
        try {
          // Generar nombre único para el archivo
          const timestamp = new Date().getTime();
          const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = `subjects/${subjectId}/units/${unitId}/${fileName}`;

          // Subir archivo a Supabase Storage
          const { error: uploadError } = await supabaseAdmin.storage
            .from('documents')
            .upload(filePath, file, {
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
            .from('documents')
            .getPublicUrl(filePath);

          file_url = urlData.publicUrl;
          file_name = file.name;

        } catch (fileError) {
          console.error('Error processing file:', fileError);
          return NextResponse.json(
            { error: 'Error al procesar el archivo' },
            { status: 500 }
          );
        }
      }
    } else {
      // Manejar JSON tradicional
      const body = await request.json();
      title = body.title;
      content = body.content;
      content_type = body.content_type;
      is_pinned = body.is_pinned;
    }

    // Validaciones
    if (!title || !content || !content_type) {
      return NextResponse.json(
        { error: 'Título, contenido y tipo de contenido son requeridos' },
        { status: 400 }
      );
    }

    // Log para debugging
    console.log('📋 Datos recibidos para crear contenido:', {
      title,
      content_type,
      contentLength: content?.length,
      hasFile: !!file,
      file_url,
      file_name
    });

    // IMPORTANTE: La base de datos actualmente solo acepta 'assignment' como content_type
    // Mapear todos los tipos a 'assignment' temporalmente hasta que se pueda actualizar la BD
    const originalContentType = content_type;
    const mappedContentType = 'assignment'; // Forzar a assignment que es el único permitido
    
    console.log(`🔄 Mapeando content_type de "${originalContentType}" a "${mappedContentType}"`);

    // Preservar el tipo original en el contenido si es diferente
    let enhancedContent = content;
    if (originalContentType !== mappedContentType) {
      enhancedContent = `[TIPO: ${originalContentType.toUpperCase()}]\n\n${content}`;
    }

    // Tipos de contenido que el frontend puede enviar
    const frontendContentTypes = ['content', 'document', 'assignment'];
    if (!frontendContentTypes.includes(originalContentType)) {
      return NextResponse.json(
        { error: `Tipo de contenido inválido. Valores permitidos: ${frontendContentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Crear el contenido
    const { data, error } = await supabaseAdmin
      .from('subject_content')
      .insert([{
        subject_id: subjectId,
        unit_id: unitId,
        title,
        content: enhancedContent, // Usar el contenido mejorado
        content_type: mappedContentType, // Usar el tipo mapeado
        file_url,
        file_name,
        created_by: currentUser.id,
        is_pinned: is_pinned || false,
        is_active: true
      }])
      .select(`
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        file_url,
        file_name,
        created_by,
        is_pinned,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating content:', error);
      return NextResponse.json(
        { error: 'Error al crear el contenido' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/subjects/[id]/units/[unitId]/contents:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
