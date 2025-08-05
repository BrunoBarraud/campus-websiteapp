// 📁 API para importar usuarios desde CSV (protegida - solo admins)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';
import bcrypt from 'bcryptjs';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
  duplicates: string[];
}

export async function POST(request: Request) {
  try {
    console.log('📁 API import users from CSV called');

    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for import by:', adminCheck.user?.email);

    // Obtener el archivo CSV del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const updateExisting = formData.get('updateExisting') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un CSV' },
        { status: 400 }
      );
    }

    // Leer el contenido del archivo CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'El archivo CSV debe tener al menos una fila de datos además del header' },
        { status: 400 }
      );
    }

    // Parsear el CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    // Validar headers requeridos
    const requiredHeaders = ['nombre', 'email', 'rol'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase().includes(header))
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { 
          error: `Headers faltantes en el CSV: ${missingHeaders.join(', ')}`,
          requiredHeaders: 'nombre, email, rol, año (opcional), activo (opcional)'
        },
        { status: 400 }
      );
    }

    // Mapear headers a índices
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('nombre'));
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
    const roleIndex = headers.findIndex(h => h.toLowerCase().includes('rol'));
    const yearIndex = headers.findIndex(h => h.toLowerCase().includes('año'));
    const activeIndex = headers.findIndex(h => h.toLowerCase().includes('activo'));

    const result: ImportResult = {
      total: dataLines.length,
      successful: 0,
      failed: 0,
      errors: [],
      duplicates: []
    };

    const defaultPassword = await bcrypt.hash('campus123', 10);

    // Procesar cada línea
    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i];
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        const name = columns[nameIndex]?.trim();
        const email = columns[emailIndex]?.trim().toLowerCase();
        const role = columns[roleIndex]?.trim().toLowerCase();
        const year = yearIndex >= 0 ? parseInt(columns[yearIndex]) : undefined;
        const isActive = activeIndex >= 0 ? 
          ['true', '1', 'activo', 'si', 'sí'].includes(columns[activeIndex]?.toLowerCase()) : true;

        // Validaciones básicas
        if (!name || !email || !role) {
          result.errors.push(`Línea ${i + 2}: Datos incompletos (nombre, email y rol son requeridos)`);
          result.failed++;
          continue;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          result.errors.push(`Línea ${i + 2}: Email inválido (${email})`);
          result.failed++;
          continue;
        }

        // Validar rol
        const validRoles = ['admin', 'teacher', 'student', 'administrador', 'profesor', 'estudiante'];
        if (!validRoles.includes(role)) {
          result.errors.push(`Línea ${i + 2}: Rol inválido (${role}). Roles válidos: admin, teacher, student`);
          result.failed++;
          continue;
        }

        // Normalizar rol
        const normalizedRole = role === 'administrador' ? 'admin' :
                              role === 'profesor' ? 'teacher' :
                              role === 'estudiante' ? 'student' : role;

        // Verificar si el usuario ya existe
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('email', email)
          .single();

        if (existingUser) {
          if (updateExisting) {
            // Actualizar usuario existente
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                name,
                role: normalizedRole,
                year: normalizedRole === 'student' ? year : null,
                is_active: isActive,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingUser.id);

            if (updateError) {
              result.errors.push(`Línea ${i + 2}: Error actualizando usuario ${email}: ${updateError.message}`);
              result.failed++;
            } else {
              result.successful++;
            }
          } else {
            result.duplicates.push(`Línea ${i + 2}: Usuario ya existe (${email})`);
            result.failed++;
          }
          continue;
        }

        // Crear nuevo usuario
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            name,
            email,
            password: defaultPassword,
            role: normalizedRole,
            year: normalizedRole === 'student' ? year : null,
            is_active: isActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          result.errors.push(`Línea ${i + 2}: Error creando usuario ${email}: ${insertError.message}`);
          result.failed++;
        } else {
          result.successful++;
        }

      } catch (error) {
        result.errors.push(`Línea ${i + 2}: Error procesando línea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        result.failed++;
      }
    }

    console.log(`✅ Importación completada:`, result);

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${result.successful} exitosos, ${result.failed} fallidos`,
      result,
      defaultPassword: 'campus123'
    });

  } catch (error) {
    console.error('💥 Error en API import users:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al importar usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
