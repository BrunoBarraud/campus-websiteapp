'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiSave, FiX, FiUser, FiCalendar, FiBook, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  assignment_id?: string;
  grade_type: 'assignment' | 'exam' | 'participation' | 'project' | 'quiz';
  score: number;
  max_score: number;
  percentage: number;
  comments?: string;
  graded_by: string;
  graded_at: string;
  created_at: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  assignment?: {
    id: string;
    title: string;
    due_date: string;
  };
  grader?: {
    id: string;
    name: string;
  };
}

interface Student {
  id: string;
  name: string;
  email: string;
  year?: number;
}

interface Assignment {
  id: string;
  title: string;
  max_score: number;
  due_date: string;
}

interface GradeSystemProps {
  subjectId: string;
  userRole: 'admin' | 'teacher' | 'student';
  currentUserId?: string;
}

interface GradeForm {
  student_id: string;
  assignment_id?: string;
  grade_type: 'assignment' | 'exam' | 'participation' | 'project' | 'quiz';
  score: number;
  max_score: number;
  comments: string;
}

export default function GradeSystem({ 
  subjectId, 
  userRole, 
  currentUserId 
}: GradeSystemProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'student' | 'date' | 'score'>('date');

  const [gradeForm, setGradeForm] = useState<GradeForm>({
    student_id: '',
    assignment_id: '',
    grade_type: 'assignment',
    score: 0,
    max_score: 100,
    comments: ''
  });

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [gradesRes, studentsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/subjects/${subjectId}/grades`),
        fetch(`/api/subjects/${subjectId}/students`),
        fetch(`/api/subjects/${subjectId}/assignments`)
      ]);

      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar calificaciones
  const filteredGrades = grades
    .filter(grade => {
      const matchesStudent = filterStudent === 'all' || grade.student_id === filterStudent;
      const matchesType = filterType === 'all' || grade.grade_type === filterType;
      
      // Si es estudiante, solo mostrar sus propias calificaciones
      if (userRole === 'student' && currentUserId) {
        return grade.student_id === currentUserId && matchesType;
      }
      
      return matchesStudent && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'student':
          return (a.student?.name || '').localeCompare(b.student?.name || '');
        case 'score':
          return b.percentage - a.percentage;
        case 'date':
        default:
          return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime();
      }
    });

  // Calcular estadísticas por estudiante
  const studentStats = students.map(student => {
    const studentGrades = grades.filter(g => g.student_id === student.id);
    const totalScore = studentGrades.reduce((sum, g) => sum + g.percentage, 0);
    const average = studentGrades.length > 0 ? totalScore / studentGrades.length : 0;
    
    const gradesByType = studentGrades.reduce((acc, grade) => {
      if (!acc[grade.grade_type]) acc[grade.grade_type] = [];
      acc[grade.grade_type].push(grade);
      return acc;
    }, {} as Record<string, Grade[]>);

    return {
      student,
      grades: studentGrades,
      average,
      gradesByType,
      totalGrades: studentGrades.length
    };
  });

  // Manejar creación/edición de calificación
  const handleSaveGrade = async () => {
    try {
      const url = editingGrade 
        ? `/api/subjects/${subjectId}/grades/${editingGrade.id}`
        : `/api/subjects/${subjectId}/grades`;
      
      const method = editingGrade ? 'PUT' : 'POST';
      
      const body = {
        ...gradeForm,
        percentage: (gradeForm.score / gradeForm.max_score) * 100
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Error al guardar calificación');
      }

      await loadData();
      setShowGradeModal(false);
      setEditingGrade(null);
      resetForm();

    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Error al guardar la calificación');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setGradeForm({
      student_id: '',
      assignment_id: '',
      grade_type: 'assignment',
      score: 0,
      max_score: 100,
      comments: ''
    });
  };

  // Abrir modal para editar
  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setGradeForm({
      student_id: grade.student_id,
      assignment_id: grade.assignment_id || '',
      grade_type: grade.grade_type,
      score: grade.score,
      max_score: grade.max_score,
      comments: grade.comments || ''
    });
    setShowGradeModal(true);
  };

  // Eliminar calificación
  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta calificación?')) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}/grades/${gradeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar calificación');
      }

      setGrades(prev => prev.filter(g => g.id !== gradeId));
    } catch (error) {
      console.error('Error deleting grade:', error);
      alert('Error al eliminar la calificación');
    }
  };

  // Exportar calificaciones
  const handleExportGrades = () => {
    const csvContent = [
      ['Estudiante', 'Email', 'Tipo', 'Tarea', 'Puntaje', 'Puntaje Máximo', 'Porcentaje', 'Comentarios', 'Fecha'].join(','),
      ...filteredGrades.map(grade => [
        grade.student?.name || '',
        grade.student?.email || '',
        grade.grade_type,
        grade.assignment?.title || '',
        grade.score,
        grade.max_score,
        grade.percentage.toFixed(2) + '%',
        grade.comments || '',
        new Date(grade.graded_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calificaciones_${subjectId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtener color por porcentaje
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Obtener letra de calificación
  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Renderizar modal de calificación
  const renderGradeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {editingGrade ? 'Editar Calificación' : 'Nueva Calificación'}
          </h3>
          <button 
            onClick={() => {
              setShowGradeModal(false);
              setEditingGrade(null);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="student">Estudiante</Label>
            <select
              id="student"
              value={gradeForm.student_id}
              onChange={(e) => setGradeForm(prev => ({ ...prev, student_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar estudiante</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="grade_type">Tipo de Calificación</Label>
            <select
              id="grade_type"
              value={gradeForm.grade_type}
              onChange={(e) => setGradeForm(prev => ({ ...prev, grade_type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="assignment">Tarea</option>
              <option value="exam">Examen</option>
              <option value="quiz">Quiz</option>
              <option value="project">Proyecto</option>
              <option value="participation">Participación</option>
            </select>
          </div>

          {gradeForm.grade_type === 'assignment' && (
            <div>
              <Label htmlFor="assignment">Tarea (opcional)</Label>
              <select
                id="assignment"
                value={gradeForm.assignment_id}
                onChange={(e) => {
                  const assignment = assignments.find(a => a.id === e.target.value);
                  setGradeForm(prev => ({ 
                    ...prev, 
                    assignment_id: e.target.value,
                    max_score: assignment?.max_score || prev.max_score
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar tarea</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} (Máx: {assignment.max_score})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="score">Puntaje Obtenido</Label>
              <Input
                type="number"
                id="score"
                value={gradeForm.score}
                onChange={(e) => setGradeForm(prev => ({ ...prev, score: Number(e.target.value) }))}
                min="0"
                max={gradeForm.max_score}
                step="0.1"
                required
              />
            </div>
            <div>
              <Label htmlFor="max_score">Puntaje Máximo</Label>
              <Input
                type="number"
                id="max_score"
                value={gradeForm.max_score}
                onChange={(e) => setGradeForm(prev => ({ ...prev, max_score: Number(e.target.value) }))}
                min="1"
                step="0.1"
                required
              />
            </div>
          </div>

          {gradeForm.max_score > 0 && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Porcentaje: <span className="font-medium">
                  {((gradeForm.score / gradeForm.max_score) * 100).toFixed(1)}%
                </span> - Letra: <span className="font-medium">
                  {getGradeLetter((gradeForm.score / gradeForm.max_score) * 100)}
                </span>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="comments">Comentarios (opcional)</Label>
            <textarea
              id="comments"
              value={gradeForm.comments}
              onChange={(e) => setGradeForm(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Retroalimentación para el estudiante..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowGradeModal(false);
                setEditingGrade(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={!gradeForm.student_id || gradeForm.max_score <= 0}
            >
              <FiSave className="w-4 h-4 mr-2" />
              {editingGrade ? 'Actualizar' : 'Guardar'} Calificación
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Calificaciones</h2>
          <p className="text-gray-600">
            {filteredGrades.length} calificación{filteredGrades.length !== 1 ? 'es' : ''} registrada{filteredGrades.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          {filteredGrades.length > 0 && (
            <Button variant="outline" onClick={handleExportGrades}>
              <FiDownload className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          )}
          
          {(userRole === 'admin' || userRole === 'teacher') && (
            <Button onClick={() => setShowGradeModal(true)}>
              <FiEdit className="w-4 h-4 mr-2" />
              Nueva Calificación
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas generales */}
      {userRole !== 'student' && studentStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FiUser className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Estudiantes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FiBook className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">Calificaciones</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FiTrendingUp className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-gray-600">Promedio General</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {grades.length > 0 
                ? (grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length).toFixed(1) + '%'
                : '0%'
              }
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FiCalendar className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm text-gray-600">Tareas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-4">
        {userRole !== 'student' && (
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estudiantes</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los tipos</option>
          <option value="assignment">Tareas</option>
          <option value="exam">Exámenes</option>
          <option value="quiz">Quizzes</option>
          <option value="project">Proyectos</option>
          <option value="participation">Participación</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Fecha</option>
          <option value="student">Estudiante</option>
          <option value="score">Puntaje</option>
        </select>
      </div>

      {/* Vista de estudiante: Resumen personal */}
      {userRole === 'student' && currentUserId && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Mi Progreso</h3>
          {(() => {
            const myStats = studentStats.find(s => s.student.id === currentUserId);
            if (!myStats || myStats.totalGrades === 0) {
              return <p className="text-gray-600">Aún no tienes calificaciones registradas.</p>;
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{myStats.average.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Promedio General</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{getGradeLetter(myStats.average)}</p>
                  <p className="text-sm text-gray-600">Calificación</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{myStats.totalGrades}</p>
                  <p className="text-sm text-gray-600">Evaluaciones</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Lista de calificaciones */}
      {filteredGrades.length === 0 ? (
        <div className="text-center py-12">
          <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay calificaciones</h3>
          <p className="text-gray-600">
            {userRole === 'student' 
              ? 'Aún no tienes calificaciones registradas en esta materia.' 
              : 'Aún no se han registrado calificaciones para esta materia.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {userRole !== 'student' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarea/Evaluación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  {(userRole === 'admin' || userRole === 'teacher') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    {userRole !== 'student' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {grade.student?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {grade.student?.email}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {grade.grade_type === 'assignment' && 'Tarea'}
                        {grade.grade_type === 'exam' && 'Examen'}
                        {grade.grade_type === 'quiz' && 'Quiz'}
                        {grade.grade_type === 'project' && 'Proyecto'}
                        {grade.grade_type === 'participation' && 'Participación'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grade.assignment?.title || 'Evaluación general'}
                      </div>
                      {grade.comments && (
                        <div className="text-sm text-gray-500 mt-1">
                          {grade.comments}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grade.score} / {grade.max_score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${getGradeColor(grade.percentage)}`}>
                        {grade.percentage.toFixed(1)}% ({getGradeLetter(grade.percentage)})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.graded_at).toLocaleDateString()}
                    </td>
                    {(userRole === 'admin' || userRole === 'teacher') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditGrade(grade)}
                          >
                            <FiEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <FiX className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de calificación */}
      {showGradeModal && renderGradeModal()}
    </div>
  );
}
