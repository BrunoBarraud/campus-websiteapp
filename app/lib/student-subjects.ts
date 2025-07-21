import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para las materias del estudiante
export interface StudentSubject {
  id: string;
  student_id: string;
  subject_id: string;
  enrolled_at: string;
  is_active: boolean;
  subject: {
    id: string;
    name: string;
    code: string;
    description: string;
    year: number;
    image_url: string;
    teacher: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  teacher_id: string | null;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Función para obtener las materias de un estudiante
export async function getStudentSubjects(studentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('student_subjects')
    .select(`
      id,
      student_id,
      subject_id,
      enrolled_at,
      is_active,
      subject:subjects(
        id,
        name,
        code,
        description,
        year,
        image_url,
        teacher:users(
          id,
          name,
          email
        )
      )
    `)
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('enrolled_at', { ascending: true });

  if (error) {
    console.error('Error fetching student subjects:', error);
    throw error;
  }

  return data || [];
}

// Función para obtener todas las materias de un año específico
export async function getSubjectsByYear(year: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('year', year)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching subjects by year:', error);
    throw error;
  }

  return data || [];
}

// Función para asignar materias manualmente a un estudiante (solo para admins)
export async function assignSubjectToStudent(studentId: string, subjectId: string): Promise<boolean> {
  const { error } = await supabase
    .from('student_subjects')
    .insert({
      student_id: studentId,
      subject_id: subjectId
    });

  if (error) {
    console.error('Error assigning subject to student:', error);
    return false;
  }

  return true;
}

// Función para desasignar una materia de un estudiante
export async function unassignSubjectFromStudent(studentId: string, subjectId: string): Promise<boolean> {
  const { error } = await supabase
    .from('student_subjects')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('subject_id', subjectId);

  if (error) {
    console.error('Error unassigning subject from student:', error);
    return false;
  }

  return true;
}

// Función para obtener estadísticas de inscripciones por materia (para profesores/admins)
export async function getSubjectEnrollmentStats(subjectId: string) {
  const { data, error } = await supabase
    .from('student_subjects')
    .select(`
      id,
      enrolled_at,
      student:users(
        id,
        name,
        email,
        year
      )
    `)
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .order('enrolled_at', { ascending: true });

  if (error) {
    console.error('Error fetching subject enrollment stats:', error);
    throw error;
  }

  return {
    total_students: data?.length || 0,
    students: data || []
  };
}

// Función para verificar si un estudiante está inscrito en una materia
export async function isStudentEnrolledInSubject(studentId: string, subjectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('student_subjects')
    .select('id')
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking enrollment:', error);
    return false;
  }

  return !!data;
}

// Función para obtener todas las materias de un profesor
export async function getTeacherSubjects(teacherId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      code,
      description,
      year,
      image_url,
      is_active,
      created_at,
      updated_at
    `)
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('year', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching teacher subjects:', error);
    throw error;
  }

  return data || [];
}

// Función para obtener estudiantes inscritos en las materias de un profesor
export async function getTeacherStudents(teacherId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('student_subjects')
    .select(`
      id,
      enrolled_at,
      is_active,
      student:users!student_subjects_student_id_fkey(
        id,
        name,
        email,
        year
      ),
      subject:subjects!student_subjects_subject_id_fkey(
        id,
        name,
        code,
        year
      )
    `)
    .eq('subject.teacher_id', teacherId)
    .eq('is_active', true)
    .order('subject.year', { ascending: true })
    .order('subject.name', { ascending: true });

  if (error) {
    console.error('Error fetching teacher students:', error);
    throw error;
  }

  return data || [];
}

// Función para obtener estadísticas de un profesor
export async function getTeacherStats(teacherId: string): Promise<any> {
  try {
    // Obtener materias del profesor
    const subjects = await getTeacherSubjects(teacherId);
    
    // Obtener estudiantes por materia
    const studentsPromises = subjects.map(async (subject) => {
      const { data, error } = await supabase
        .from('student_subjects')
        .select('id')
        .eq('subject_id', subject.id)
        .eq('is_active', true);
      
      return {
        subject: subject,
        studentCount: data?.length || 0
      };
    });

    const subjectsWithCounts = await Promise.all(studentsPromises);
    
    const totalStudents = subjectsWithCounts.reduce((sum, item) => sum + item.studentCount, 0);
    
    return {
      totalSubjects: subjects.length,
      totalStudents: totalStudents,
      subjectsWithCounts: subjectsWithCounts,
      yearGroups: subjects.reduce((acc: any, subject) => {
        acc[subject.year] = (acc[subject.year] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    throw error;
  }
}

// Función para llamar a la función SQL de asignación manual
export async function assignSubjectsToStudentByYear(studentId: string, year: number): Promise<number> {
  const { data, error } = await supabase
    .rpc('assign_subjects_to_student', {
      student_user_id: studentId,
      student_year: year
    });

  if (error) {
    console.error('Error calling assign_subjects_to_student:', error);
    throw error;
  }

  return data || 0;
}
