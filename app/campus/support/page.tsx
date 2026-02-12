'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, CheckCircle, AlertCircle, Clock, MessageSquare } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

export default function SupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'error'
  });

  useEffect(() => {
    if (session?.user) {
      fetchMyTickets();
    }
  }, [session]);

  const fetchMyTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setForm({ subject: '', description: '', category: 'error' });
        fetchMyTickets();
      } else {
        setError(data.error || 'Error al enviar el ticket');
      }
    } catch {
      setError('Error al enviar el ticket');
    } finally {
      setLoading(false);
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
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Soporte</h1>
          <p className="text-slate-600 mt-2">
            ¿Encontraste un error o tenés una sugerencia? Envianos un mensaje.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-yellow-600" />
              Enviar ticket
            </h2>

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 text-sm">¡Ticket enviado! Te responderemos pronto.</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="error">Error / Bug</option>
                  <option value="sugerencia">Sugerencia</option>
                  <option value="consulta">Consulta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Ej: No puedo ver las tareas"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describí el problema o sugerencia con el mayor detalle posible..."
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar ticket
                  </>
                )}
              </button>
            </form>

            {/* Email alternativo */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                También podés escribirnos a{' '}
                <a href="mailto:brunobarraud.contacto@gmail.com" className="text-yellow-700 font-medium hover:underline">
                  brunobarraud.contacto@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Mis tickets */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              Mis tickets
            </h2>

            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No tenés tickets enviados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-slate-900 text-sm">{ticket.subject}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {getCategoryLabel(ticket.category)} • {formatDate(ticket.created_at)}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                    
                    {ticket.admin_response && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                        <p className="text-xs font-medium text-green-700 mb-1">Respuesta del soporte:</p>
                        <p className="text-sm text-green-800">{ticket.admin_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
