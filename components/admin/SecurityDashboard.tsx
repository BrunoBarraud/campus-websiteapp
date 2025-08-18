/**
 * Panel de administración de seguridad
 */

'use client';

import { useState, useEffect } from 'react';
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
    
    fetchAuditLogs();
  }, [fetchWithCsrf]);

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
    <div className="bg-white shadow rounded-lg p-6">
      {error && (
        <SecurityAlert 
          type="error" 
          title="Error" 
          message={error} 
        />
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            Registros de Auditoría
          </h2>
          
          <button 
            onClick={() => {
              setLoading(true);
              fetchWithCsrf('/api/admin/security/audit-logs')
                .then(response => response.json())
                .then(data => {
                  setAuditLogs(data);
                  setLoading(false);
                })
                .catch(err => {
                  setError('Error al actualizar los registros');
                  setLoading(false);
                });
            }}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </button>
        </div>
        
        <div className="flex space-x-4 mb-4 items-center">
          <Filter className="h-4 w-4 text-gray-500 mr-1" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('login')}
            className={`px-3 py-1 rounded text-sm ${filter === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Inicios de sesión
          </button>
          <button
            onClick={() => setFilter('security')}
            className={`px-3 py-1 rounded text-sm ${filter === 'security' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Seguridad
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Cargando registros...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No hay registros disponibles</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details ? (
                      <div className="tooltip" title={JSON.stringify(log.details, null, 2)}>
                        {typeof log.details === 'object' 
                          ? Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
                                {String(value).length > 30 ? '...' : ''}
                              </div>
                            ))
                          : JSON.stringify(log.details).substring(0, 50) + '...'}
                      </div>
                    ) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6">
        <SecurityStats className="mb-6" />
      </div>
    </div>
  );
};

export default SecurityDashboard;