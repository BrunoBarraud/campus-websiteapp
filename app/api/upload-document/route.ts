import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Recibiendo upload de documento...');
    
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;
    const subjectId = formData.get('subject_id') as string;
    const unitId = formData.get('unit_id') as string;
    const isPublic = formData.get('is_public') === 'true';

    console.log('Datos recibidos:', {
      title,
      description,
      fileName: file?.name,
      fileSize: file?.size,
      subjectId,
      unitId,
      isPublic
    });

    // Validar datos requeridos
    if (!title || !file) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: title, file'
      }, { status: 400 });
    }

    // Por ahora, solo simular la URL del archivo (más corta)
    const fakeUrl = `https://docs.app/${Date.now()}.${file.name.split('.').pop()}`;

    // Truncar valores que pueden ser muy largos
    const truncatedTitle = title.length > 45 ? title.substring(0, 42) + "..." : title;
    const truncatedFileName = file.name.length > 45 ? file.name.substring(0, 42) + "..." : file.name;
    const truncatedDescription = description && description.length > 200 ? description.substring(0, 197) + "..." : description;
    const truncatedFileType = file.type && file.type.length > 45 ? file.type.substring(0, 42) + "..." : file.type;

    console.log('Valores truncados:', {
      originalTitle: title,
      truncatedTitle,
      originalFileName: file.name,
      truncatedFileName,
      originalFileType: file.type,
      truncatedFileType,
      fakeUrl: fakeUrl.length > 50 ? fakeUrl.substring(0, 50) + "..." : fakeUrl,
      originalDescription: description,
      truncatedDescription
    });

    // Intentar insertar directamente en la tabla documents
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: truncatedTitle,
        description: truncatedDescription || '',
        file_name: truncatedFileName,
        file_url: fakeUrl,
        file_type: truncatedFileType,
        file_size: file.size,
        subject_id: subjectId || null,
        unit_id: unitId || null,
        is_public: isPublic,
        uploaded_by: '75fae443-7b6d-4a97-bff8-a93052f10305' // ID del admin por defecto
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting document:', error);
      
      // Proporcionar más detalles sobre el error
      let errorMessage = `Error de base de datos: ${error.message}`;
      
      if (error.message.includes('value too long')) {
        errorMessage += '\n\nDetalles:\n';
        errorMessage += `- Título: "${truncatedTitle}" (${truncatedTitle.length} caracteres)\n`;
        errorMessage += `- Archivo: "${truncatedFileName}" (${truncatedFileName.length} caracteres)\n`;
        errorMessage += `- Descripción: ${truncatedDescription ? `"${truncatedDescription}" (${truncatedDescription.length} caracteres)` : 'Sin descripción'}\n`;
        errorMessage += '- Considera ejecutar el script fix-documents-constraints.sql en Supabase';
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: error,
        debugInfo: {
          truncatedTitle,
          truncatedFileName,
          truncatedDescription,
          originalTitle: title,
          originalFileName: file.name,
          originalDescription: description
        }
      }, { status: 500 });
    }

    console.log('Documento insertado exitosamente:', data);

    return NextResponse.json({
      success: true,
      message: 'Documento subido exitosamente',
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
