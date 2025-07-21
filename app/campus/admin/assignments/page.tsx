'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import Link from 'next/link'

interface Teacher {
  id: string
  name: string
  email: string
}

interface Subject {
  id: number
  name: string
  code: string
  year: number
  teacher_id: string | null
  teacher_name?: string
}

interface Assignment {
  subject_id: number
  teacher_id: string
  subject_name: string
  teacher_name: string
}

export default function AssignmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/campus/auth/login')
        return
      }

      // Verificar que sea admin
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        router.push('/campus/dashboard')
        return
      }

      setUser(userData)
      await loadData()
    } catch (error) {
      console.error('Error:', error)
      router.push('/campus/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      // Cargar profesores
      const { data: teachersData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'teacher')
        .order('name')

      setTeachers(teachersData || [])

      // Cargar materias con información del profesor asignado
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select(`
          *,
          teacher:users(name)
        `)
        .order('year', { ascending: true })
        .order('name', { ascending: true })

      const processedSubjects = subjectsData?.map((subject: any) => ({
        ...subject,
        teacher_name: subject.teacher?.name || null
      })) || []

      setSubjects(processedSubjects)

      // Crear lista de asignaciones para mostrar
      const currentAssignments = processedSubjects
        .filter((subject: any) => subject.teacher_id)
        .map((subject: any) => ({
          subject_id: subject.id,
          teacher_id: subject.teacher_id!,
          subject_name: `${subject.name} (${subject.year}° año)`,
          teacher_name: subject.teacher_name!
        }))

      setAssignments(currentAssignments)

    } catch (error) {
      console.error('Error loading data:', error)
      setMessage({ type: 'error', text: 'Error al cargar los datos' })
    }
  }

  const handleAssignment = async () => {
    if (!selectedTeacher || !selectedSubject) {
      setMessage({ type: 'error', text: 'Por favor selecciona un profesor y una materia' })
      return
    }

    setAssignmentLoading(true)
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ teacher_id: selectedTeacher })
        .eq('id', selectedSubject)

      if (error) throw error

      setMessage({ type: 'success', text: 'Materia asignada correctamente' })
      setSelectedTeacher('')
      setSelectedSubject('')
      await loadData() // Recargar datos

    } catch (error) {
      console.error('Error assigning subject:', error)
      setMessage({ type: 'error', text: 'Error al asignar la materia' })
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleUnassign = async (subjectId: number) => {
    if (!confirm('¿Estás seguro de que quieres desasignar esta materia?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .update({ teacher_id: null })
        .eq('id', subjectId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Materia desasignada correctamente' })
      await loadData() // Recargar datos

    } catch (error) {
      console.error('Error unassigning subject:', error)
      setMessage({ type: 'error', text: 'Error al desasignar la materia' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Filtrar materias no asignadas
  const unassignedSubjects = subjects.filter((subject: Subject) => !subject.teacher_id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/campus/admin" className="mr-4 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Asignar Materias a Profesores</h1>
                <p className="text-gray-600">Gestiona las asignaciones de materias</p>
              </div>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Asignación */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Nueva Asignación</h2>
            
            <div className="space-y-4">
              {/* Selector de Profesor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Profesor
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona un profesor --</option>
                  {Array.isArray(teachers) && teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Materia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Materia
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona una materia --</option>
                  {unassignedSubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} - {subject.year}° año ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAssignment}
                disabled={assignmentLoading || !selectedTeacher || !selectedSubject}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {assignmentLoading ? 'Asignando...' : 'Asignar Materia'}
              </button>
            </div>

            {/* Información */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <div className="flex">
                <svg className="flex-shrink-0 w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Información</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>• Solo se muestran materias sin profesor asignado</p>
                    <p>• Puedes desasignar materias desde la lista de asignaciones</p>
                    <p>• Los cambios se reflejan inmediatamente en el sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Asignaciones Actuales */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Asignaciones Actuales</h2>
            
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asignaciones</h3>
                <p className="mt-1 text-sm text-gray-500">Comienza asignando materias a profesores</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{assignment.subject_name}</h3>
                      <p className="text-sm text-gray-600">Profesor: {assignment.teacher_name}</p>
                    </div>
                    <button
                      onClick={() => handleUnassign(assignment.subject_id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Desasignar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
            <div className="text-sm text-gray-500">Profesores</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{subjects.length}</div>
            <div className="text-sm text-gray-500">Materias Totales</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
            <div className="text-sm text-gray-500">Asignadas</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{unassignedSubjects.length}</div>
            <div className="text-sm text-gray-500">Sin Asignar</div>
          </div>
        </div>
      </div>
    </div>
  )
}
