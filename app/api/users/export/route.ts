// 📤 API para exportar usuarios a Excel (protegida - solo admins)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    console.log('📤 API export users to Excel called');

    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for export by:', adminCheck.user?.email);

    // Obtener parámetros de filtros
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeSubjects = searchParams.get('includeSubjects') === 'true';

    // Construir query para obtener todos los usuarios (sin paginación para export)
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, year, is_active, created_at, updated_at')
      .order('name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('❌ Error fetching users for export:', error);
      return NextResponse.json(
        { error: 'Error al obtener los usuarios para exportar' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron usuarios para exportar' },
        { status: 404 }
      );
    }

    // Si se incluyen materias y hay profesores, obtener sus materias asignadas
    let teacherSubjects: { [key: string]: any[] } = {};
    if (includeSubjects && users.some(u => u.role === 'teacher')) {
      const teacherIds = users.filter(u => u.role === 'teacher').map(u => u.id);
      
      const { data: subjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, code, year, teacher_id, is_active')
        .in('teacher_id', teacherIds)
        .eq('is_active', true)
        .order('year, name');

      if (subjectsError) {
        console.error('❌ Error fetching teacher subjects:', subjectsError);
      } else if (subjects) {
        // Agrupar materias por teacher_id
        teacherSubjects = subjects.reduce((acc, subject) => {
          if (!acc[subject.teacher_id]) {
            acc[subject.teacher_id] = [];
          }
          acc[subject.teacher_id].push(subject);
          return acc;
        }, {} as { [key: string]: any[] });
      }
    }

    // Crear workbook de Excel
    const wb = XLSX.utils.book_new();

    // Hoja 1: Usuarios principales
    const usersData = users.map((user, index) => {
      const baseData: any = {
        'Nº': index + 1,
        'Nombre': user.name,
        'Email': user.email,
        'Rol': user.role === 'admin' ? 'Administrador' : 
               user.role === 'teacher' ? 'Profesor' : 'Estudiante',
        'Año Académico': user.year || '-',
        'Estado': user.is_active ? 'Activo' : 'Inactivo',
        'Fecha Creación': new Date(user.created_at).toLocaleDateString('es-ES'),
        'Última Actualización': user.updated_at ? 
          new Date(user.updated_at).toLocaleDateString('es-ES') : '-'
      };

      // Si es profesor y se incluyen materias, agregar resumen de materias
      if (user.role === 'teacher' && includeSubjects) {
        const subjects = teacherSubjects[user.id] || [];
        baseData['Materias Asignadas'] = subjects.length;
        baseData['Años que Enseña'] = [...new Set(subjects.map(s => s.year))].sort().join(', ') || '-';
      }

      return baseData;
    });

    const usersWS = XLSX.utils.json_to_sheet(usersData);

    // Configurar ancho de columnas para usuarios
    const userColWidths = [
      { wch: 5 },  // Nº
      { wch: 25 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Rol
      { wch: 15 }, // Año
      { wch: 10 }, // Estado
      { wch: 15 }, // Fecha Creación
      { wch: 20 }  // Última Actualización
    ];

    if (includeSubjects && users.some(u => u.role === 'teacher')) {
      userColWidths.push({ wch: 15 }); // Materias Asignadas
      userColWidths.push({ wch: 20 }); // Años que Enseña
    }

    usersWS['!cols'] = userColWidths;
    XLSX.utils.book_append_sheet(wb, usersWS, 'Usuarios');

    // Hoja 2: Detalle de materias por profesor (solo si se incluyen materias)
    if (includeSubjects && Object.keys(teacherSubjects).length > 0) {
      const subjectsData: any[] = [];
      
      Object.entries(teacherSubjects).forEach(([teacherId, subjects]) => {
        const teacher = users.find(u => u.id === teacherId);
        if (teacher) {
          subjects.forEach((subject) => {
            subjectsData.push({
              'Profesor': teacher.name,
              'Email Profesor': teacher.email,
              'Materia': subject.name,
              'Código': subject.code || '-',
              'Año': subject.year,
              'Estado Materia': subject.is_active ? 'Activa' : 'Inactiva'
            });
          });
        }
      });

      if (subjectsData.length > 0) {
        const subjectsWS = XLSX.utils.json_to_sheet(subjectsData);
        
        // Configurar ancho de columnas para materias
        const subjectColWidths = [
          { wch: 25 }, // Profesor
          { wch: 30 }, // Email Profesor
          { wch: 35 }, // Materia
          { wch: 15 }, // Código
          { wch: 10 }, // Año
          { wch: 15 }  // Estado Materia
        ];
        subjectsWS['!cols'] = subjectColWidths;
        
        XLSX.utils.book_append_sheet(wb, subjectsWS, 'Materias por Profesor');
      }
    }

    // Generar archivo Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `usuarios_campus_${timestamp}.xlsx`;

    console.log(`✅ Excel generado exitosamente: ${users.length} usuarios exportados`);

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('💥 Error en API export users:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al exportar usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
