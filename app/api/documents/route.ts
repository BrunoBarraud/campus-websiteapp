// 📄 API para gestión de documentos
import { NextResponse } from 'next/server';
import { documentService } from '@/app/lib/services';
import { requireRole } from '@/app/lib/permissions';

// GET - Obtener documentos según el rol del usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const subjectId = searchParams.get('subject_id');
    const search = searchParams.get('search');

    // Get authenticated user using role-based authentication
    const currentUser = await requireRole(['admin', 'teacher', 'student']);

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

  } catch (error: unknown) {
    console.error('Error getting documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener documentos';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// POST - Subir nuevo documento
export async function POST(request: Request) {
  try {
    // Get authenticated user using role-based authentication
    const currentUser = await requireRole(['admin', 'teacher']);

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;
    const subjectId = formData.get('subject_id') as string;
    const unitId = formData.get('unit_id') as string;
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
      unit_id: unitId || undefined,
      year: year ? parseInt(year) : undefined,
      is_public: isPublic
    };

    const newDocument = await documentService.uploadDocument(documentData, currentUser.id);

    return NextResponse.json({
      success: true,
      message: 'Documento subido exitosamente',
      data: newDocument
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error uploading document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al subir documento';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
