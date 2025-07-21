// 📄 API para gestión de documentos
import { NextResponse } from 'next/server';
import { documentService, userService } from '@/app/lib/services';

// GET - Obtener documentos según el rol del usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const subjectId = searchParams.get('subject_id');
    const search = searchParams.get('search');

    // Obtener usuario actual para determinar qué documentos mostrar
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const filter = {
      year: year ? parseInt(year) : undefined,
      subject_id: subjectId || undefined,
      search: search || undefined
    };

    const documents = await documentService.getDocuments(
      currentUser.role, 
      currentUser.id, 
      currentUser.year || undefined, 
      filter
    );

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error: any) {
    console.error('Error getting documents:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al obtener documentos' 
      },
      { status: 500 }
    );
  }
}

// POST - Subir nuevo documento
export async function POST(request: Request) {
  try {
    // Obtener usuario actual
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;
    const subjectId = formData.get('subject_id') as string;
    const year = formData.get('year') as string;
    const isPublic = formData.get('is_public') === 'true';

    // Validar datos requeridos
    if (!title || !file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: title, file' 
        },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido' },
        { status: 400 }
      );
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo no puede superar los 10MB' },
        { status: 400 }
      );
    }

    const documentData = {
      title,
      description,
      file,
      subject_id: subjectId || undefined,
      year: year ? parseInt(year) : undefined,
      is_public: isPublic
    };

    const newDocument = await documentService.uploadDocument(documentData, currentUser.id);

    return NextResponse.json({
      success: true,
      message: 'Documento subido exitosamente',
      data: newDocument
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al subir documento' 
      },
      { status: 500 }
    );
  }
}
