'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  LogOutIcon,
  UserIcon,
  GraduationCapIcon
} from "lucide-react"
import { toast } from "sonner"

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
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/campus/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/campus/dashboard')
        return
      }

      await loadData()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/campus/login')
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
        .eq('is_active', true)
        .order('name')

      setTeachers(teachersData || [])

      // Cargar materias con información del profesor
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          code,
          year,
          teacher_id,
          teacher:users!subjects_teacher_id_fkey(name)
        `)
        .order('year')
        .order('name')

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
          subject_name: `${subject.name} (${subject.code})`,
          teacher_name: subject.teacher_name!
        }))

      setAssignments(currentAssignments)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    }
  }

  const handleAssignment = async () => {
    if (!selectedTeacher || !selectedSubject) {
      toast.error('Por favor selecciona un profesor y una materia')
      return
    }

    setAssignmentLoading(true)
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ teacher_id: selectedTeacher })
        .eq('id', selectedSubject)

      if (error) throw error

      toast.success('Materia asignada correctamente')
      setSelectedTeacher('')
      setSelectedSubject('')
      await loadData() // Recargar datos

    } catch (error) {
      console.error('Error assigning subject:', error)
      toast.error('Error al asignar la materia')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleUnassign = async (subjectId: number) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ teacher_id: null })
        .eq('id', subjectId)

      if (error) throw error

      toast.success('Materia desasignada correctamente')
      await loadData()

    } catch (error) {
      console.error('Error unassigning subject:', error)
      toast.error('Error al desasignar la materia')
    }
  }

  const unassignedSubjects = subjects.filter(subject => !subject.teacher_id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/campus/admin"
                className="text-gray-500 hover:text-gray-700 flex items-center"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Asignar Materias</h1>
                <p className="text-sm text-gray-600">Gestiona las asignaciones de materias a profesores</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => supabase.auth.signOut()}
              className="text-red-600 hover:text-red-700 border-red-200"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profesores</CardTitle>
              <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materias Totales</CardTitle>
              <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">En el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asignadas</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">Con profesor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
              <XCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unassignedSubjects.length}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Nueva Asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Nueva Asignación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teacher-select">Seleccionar Profesor</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Selecciona un profesor --" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-select">Seleccionar Materia</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Selecciona una materia --" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedSubjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.code}) - {subject.year}° año
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleAssignment} 
                  disabled={assignmentLoading || !selectedTeacher || !selectedSubject}
                  className="flex-1"
                >
                  {assignmentLoading ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Asignar Materia
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={loadData}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Asignaciones Actuales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Asignaciones Actuales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asignaciones</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza asignando materias a profesores</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{assignment.subject_name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <GraduationCapIcon className="h-3 w-3" />
                          {assignment.teacher_name}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassign(assignment.subject_id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Desasignar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Materias sin asignar */}
        {unassignedSubjects.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 text-orange-600" />
                Materias Sin Asignar ({unassignedSubjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedSubjects.map(subject => (
                  <div key={subject.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <h4 className="font-medium text-gray-900">{subject.name}</h4>
                    <p className="text-sm text-gray-600">{subject.code}</p>
                    <Badge variant="outline" className="mt-2 bg-orange-100 text-orange-800">
                      {subject.year}° año
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
