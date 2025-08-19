// 📤 API para exportar usuarios a Excel (protegida - solo admins)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';
import ExcelJS from 'exceljs';

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

    // Crear workbook de Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Hoja 1: Usuarios principales
    const usersSheet = workbook.addWorksheet('Usuarios');

    // Definir columnas
    const userColumns: any[] = [
      { header: 'Nº', key: 'no', width: 5 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'rol', width: 15 },
      { header: 'Año Académico', key: 'anio', width: 15 },
      { header: 'Estado', key: 'estado', width: 10 },
      { header: 'Fecha Creación', key: 'fecha_creacion', width: 15 },
      { header: 'Última Actualización', key: 'ultima_actualizacion', width: 20 }
    ];

    if (includeSubjects && users.some((u: any) => u.role === 'teacher')) {
      userColumns.push({ header: 'Materias Asignadas', key: 'materias_asignadas', width: 15 });
      userColumns.push({ header: 'Años que Enseña', key: 'anos_que_ensea', width: 20 });
    }

    usersSheet.columns = userColumns;

    users.forEach((user: any, index: number) => {
      const rowData: any = {
        no: index + 1,
        nombre: user.name,
        email: user.email,
        rol: user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Profesor' : 'Estudiante',
        anio: user.year || '-',
        estado: user.is_active ? 'Activo' : 'Inactivo',
        fecha_creacion: user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : '-',
        ultima_actualizacion: user.updated_at ? new Date(user.updated_at).toLocaleDateString('es-ES') : '-'
      };

      if (user.role === 'teacher' && includeSubjects) {
        const subjects = teacherSubjects[user.id] || [];
        rowData.materias_asignadas = subjects.length;
        rowData.anos_que_ensea = [...new Set(subjects.map((s: any) => s.year))].sort().join(', ') || '-';
      }

      usersSheet.addRow(rowData);
    });

    // Hoja 2: Detalle de materias por profesor (solo si se incluyen materias)
    if (includeSubjects && Object.keys(teacherSubjects).length > 0) {
      const subjectsSheet = workbook.addWorksheet('Materias por Profesor');
      subjectsSheet.columns = [
        { header: 'Profesor', key: 'profesor', width: 25 },
        { header: 'Email Profesor', key: 'email_profesor', width: 30 },
        { header: 'Materia', key: 'materia', width: 35 },
        { header: 'Código', key: 'codigo', width: 15 },
        { header: 'Año', key: 'anio', width: 10 },
        { header: 'Estado Materia', key: 'estado_materia', width: 15 }
      ];

      Object.entries(teacherSubjects).forEach(([teacherId, subjects]: any) => {
        const teacher = users.find((u: any) => u.id === teacherId);
        if (teacher) {
          subjects.forEach((subject: any) => {
            subjectsSheet.addRow({
              profesor: teacher.name,
              email_profesor: teacher.email,
              materia: subject.name,
              codigo: subject.code || '-',
              anio: subject.year,
              estado_materia: subject.is_active ? 'Activa' : 'Inactiva'
            });
          });
        }
      });
    }

    // Generar buffer con workbook
    const buffer = await workbook.xlsx.writeBuffer();

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `usuarios_campus_${timestamp}.xlsx`;

    console.log(`✅ Excel generado exitosamente: ${users.length} usuarios exportados`);

    // Retornar archivo Excel
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
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
