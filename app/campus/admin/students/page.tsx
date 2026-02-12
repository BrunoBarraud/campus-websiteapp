'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, User, Calendar, Building } from 'lucide-react';

interface PendingStudent {
  id: string;
  email: string;
  name: string;
  year: number | null;
  division: string | null;
  created_at: string;
  approval_status: string;
}

export default function AdminStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/campus/dashboard');
      return;
    }

    fetchPendingStudents();
  }, [session, status, router]);

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/students/pending');
      const json = await res.json();
      
      if (json.success) {
        setStudents(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    setActionLoading(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/approve`, {
        method: 'POST',
      });
      const json = await res.json();
      
      if (json.success) {
        setStudents(students.filter(s => s.id !== studentId));
      } else {
        alert(json.error || 'Error al aprobar estudiante');
      }
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Error al aprobar estudiante');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (studentId: string) => {
    if (!confirm('¿Estás seguro de rechazar a este estudiante?')) return;
    
    setActionLoading(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reject`, {
        method: 'POST',
      });
      const json = await res.json();
      
      if (json.success) {
        setStudents(students.filter(s => s.id !== studentId));
      } else {
        alert(json.error || 'Error al rechazar estudiante');
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('Error al rechazar estudiante');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Estudiantes Pendientes</h1>
          <p className="text-gray-600 mt-2">
            Aprobá o rechazá a los estudiantes que se registraron recientemente.
          </p>
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No hay estudiantes pendientes</h2>
            <p className="text-gray-500">Todos los estudiantes han sido revisados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                {students.length} estudiante{students.length !== 1 ? 's' : ''} pendiente{students.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {students.map((student) => (
                <div key={student.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-yellow-600" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          {student.year ? (
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {student.year}° Año {student.division ? `"${student.division}"` : ''}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Building className="w-4 h-4" />
                              Sin año asignado
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(student.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(student.id)}
                        disabled={actionLoading === student.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Aprobar
                      </button>
                      
                      <button
                        onClick={() => handleReject(student.id)}
                        disabled={actionLoading === student.id}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
