/**
 * Panel de administración de seguridad
 */

'use client';

import { useState, useEffect, useRef } from 'react';

import { useCsrfToken } from '@/components/common/CsrfToken';
import SecurityAlert from '@/components/ui/SecurityAlert';
import SecurityStats from './SecurityStats';
import { Shield, Filter, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const SecurityDashboard = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { fetchWithCsrf } = useCsrfToken();

  const hasFetchedRef = useRef(false);

  // Cargar registros de auditoría
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const response = await fetchWithCsrf('/api/admin/security/audit-logs');
        
        if (!response.ok) {
          throw new Error('Error al cargar los registros de auditoría');
        }
        
        const data = await response.json();
        setAuditLogs(data);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar los registros de auditoría');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Evitar ejecuciones múltiples del efecto en desarrollo (StrictMode)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchAuditLogs();
  }, []);

  // Filtrar registros por tipo
  const filteredLogs = filter === 'all' 
    ? auditLogs 
    : auditLogs.filter(log => log.action.includes(filter));

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white shadow-soft rounded-xl p-6 border border-gray-100">
      {error && (
        <SecurityAlert
          type="error"
          title="Error"
          message={error}
        />
      )}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center text-rose-950">
              <Shield className="h-5 w-5 text-[var(--primary)] mr-2" />
              Registros de auditoría
            </h2>
            <p className="text-sm text-gray-500">
              Actividad reciente relacionada con seguridad y autenticación.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchWithCsrf('/api/admin/security/audit-logs')
                .then((response) => response.json())
                .then((data) => {
                  setAuditLogs(data);
                  setLoading(false);
                })
                .catch(() => {
                  setError('Error al actualizar los registros');
                  setLoading(false);
                });
            }}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-rose-950 bg-amber-100 hover:bg-amber-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center text-sm text-gray-500 mr-2">
            <Filter className="h-4 w-4 mr-1" />
            <span>Filtrar por tipo</span>
          </div>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === 'all'
                ? 'bg-rose-950 text-amber-300 border-rose-950'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('login')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === 'login'
                ? 'bg-rose-950 text-amber-300 border-rose-950'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Inicios de sesión
          </button>
          <button
            onClick={() => setFilter('security')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === 'security'
                ? 'bg-rose-950 text-amber-300 border-rose-950'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Seguridad
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
          Cargando registros...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 text-sm">
          <p className="font-medium mb-1">No hay registros disponibles</p>
          <p className="text-xs text-gray-400">
            Los eventos de seguridad recientes aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-100 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Acción</th>
                  <th className="px-6 py-3">IP</th>
                  <th className="px-6 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                      {log.email || 'N/A'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-rose-900 border border-amber-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-3 text-gray-600 align-top">
                      {log.details ? (
                        <details className="group text-xs cursor-pointer">
                          <summary className="text-rose-900 font-medium group-open:mb-1">
                            Ver detalles
                          </summary>
                          <div className="mt-1 max-h-40 overflow-y-auto rounded bg-gray-50 p-2 border border-gray-100">
                            <pre className="whitespace-pre-wrap text-[11px] text-gray-700">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6">
        <SecurityStats className="mb-6" />
      </div>
    </div>
  );
};

export default SecurityDashboard;