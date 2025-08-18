'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  browser: string;
  os: string;
  last_active: string;
  ip_address: string;
  is_current: boolean;
}

/**
 * Componente para mostrar los dispositivos conectados del usuario
 */
export default function ConnectedDevicesList({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/devices`);
        
        if (!response.ok) {
          throw new Error('Error al cargar los dispositivos');
        }
        
        const data = await response.json();
        setDevices(data.devices || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error al cargar dispositivos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [userId]);

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  // Función para cerrar sesión en un dispositivo
  const handleLogoutDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/user/devices/${deviceId}/revoke`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al cerrar sesión en el dispositivo');
      }
      
      // Actualizar la lista de dispositivos
      setDevices(devices.filter(device => device.id !== deviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cerrar sesión en dispositivo:', err);
    }
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return <p className="text-gray-500">Cargando dispositivos...</p>;
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  // Si no hay dispositivos, mostrar mensaje
  if (devices.length === 0) {
    return <p className="text-gray-500">No hay dispositivos conectados.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-gray-200">
        {devices.map((device) => (
          <li key={device.id} className="py-3">
            <div className="flex justify-between">
              <div className="flex items-center">
                <span className="text-xl mr-3">
                  {device.os.includes('iOS') || device.os.includes('Android') ? '📱' : '💻'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {device.browser} en {device.os} 
                    {device.is_current && <span className="text-xs text-green-500 ml-2">(Actual)</span>}
                  </p>
                  <p className="text-sm text-gray-500">IP: {device.ip_address}</p>
                  <p className="text-sm text-gray-500">Último acceso: {formatDate(device.last_active)}</p>
                </div>
              </div>
              {!device.is_current && (
                <button 
                  onClick={() => handleLogoutDevice(device.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}