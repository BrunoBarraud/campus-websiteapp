'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, User, Clock, Send, AlertCircle, CheckCircle, Wrench } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    year: number | null;
    division: string | null;
  };
}

interface MaintenanceMode {
  enabled: boolean;
  message: string;
  estimated_end: string | null;
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [responding, setResponding] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Modo mantenimiento
  const [maintenance, setMaintenance] = useState<MaintenanceMode>({ enabled: false, message: '', estimated_end: null });
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/campus/dashboard');
      return;
    }

    fetchTickets();
    fetchMaintenanceStatus();
  }, [session, status, router]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/admin/maintenance');
      const data = await res.json();
      setMaintenance(data);
      setMaintenanceMessage(data.message || '');
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket) return;
    
    setResponding(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_response: response,
          status: newStatus || selectedTicket.status
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedTicket(null);
        setResponse('');
        setNewStatus('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error responding to ticket:', error);
    } finally {
      setResponding(false);
    }
  };

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !maintenance.enabled,
          message: maintenanceMessage || 'Estamos realizando mejoras en el Campus. Volvemos pronto.'
        })
      });

      const data = await res.json();
      if (data.success) {
        setMaintenance(data.data);
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Abierto</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">En progreso</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Resuelto</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Cerrado</span>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'error': return 'Error';
      case 'sugerencia': return 'Sugerencia';
      case 'consulta': return 'Consulta';
      default: return 'Otro';
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

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Centro de Soporte</h1>
          <p className="text-gray-600 mt-2">
            Gestioná los tickets de soporte y el modo mantenimiento.
          </p>
        </div>

        {/* Modo Mantenimiento */}
        <div className={`mb-8 p-6 rounded-2xl border ${maintenance.enabled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${maintenance.enabled ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Wrench className={`w-6 h-6 ${maintenance.enabled ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Modo Mantenimiento</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {maintenance.enabled 
                    ? 'El campus está en mantenimiento. Los usuarios no pueden acceder.'
                    : 'El campus está funcionando normalmente.'}
                </p>
                
                {!maintenance.enabled && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Mensaje de mantenimiento (opcional)"
                      className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={toggleMaintenance}
              disabled={togglingMaintenance}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                maintenance.enabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {togglingMaintenance ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : maintenance.enabled ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Desactivar
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Activar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-xl border text-left transition ${filter === 'all' ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            <p className="text-sm text-gray-600">Total</p>
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`p-4 rounded-xl border text-left transition ${filter === 'open' ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <p className="text-2xl font-bold text-blue-600">{openCount}</p>
            <p className="text-sm text-gray-600">Abiertos</p>
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`p-4 rounded-xl border text-left transition ${filter === 'in_progress' ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <p className="text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
            <p className="text-sm text-gray-600">En progreso</p>
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`p-4 rounded-xl border text-left transition ${filter === 'resolved' ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <p className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</p>
            <p className="text-sm text-gray-600">Resueltos</p>
          </button>
        </div>

        {/* Lista de tickets */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No hay tickets</h2>
            <p className="text-gray-500">No hay tickets en esta categoría.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="p-6 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResponse(ticket.admin_response || '');
                    setNewStatus(ticket.status);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-yellow-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                          {getStatusBadge(ticket.status)}
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {ticket.user?.name} ({ticket.user?.email}) • {ticket.user?.role === 'student' ? `${ticket.user.year}° ${ticket.user.division || ''}` : ticket.user?.role}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ticket.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de respuesta */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  De: {selectedTicket.user?.name} ({selectedTicket.user?.email})
                </p>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="open">Abierto</option>
                    <option value="in_progress">En progreso</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta</label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Escribí tu respuesta..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRespond}
                    disabled={responding}
                    className="flex-1 py-3 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {responding ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Guardar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setResponse('');
                      setNewStatus('');
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
