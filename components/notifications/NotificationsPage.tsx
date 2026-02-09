'use client'

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/lib/supabaseClient';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  is_read: boolean;
  icon?: string;
  iconColor?: string;
}

const iconMap: Record<string, { icon: string; color: string }> = {
  mention: { icon: 'fas fa-at', color: 'text-purple-500' },
  like: { icon: 'fas fa-heart', color: 'text-red-500' },
  system: { icon: 'fas fa-cog', color: 'text-blue-500' },
  message: { icon: 'fas fa-envelope', color: 'text-green-500' },
  reminder: { icon: 'fas fa-bell', color: 'text-yellow-500' },
  event_created: { icon: 'fas fa-calendar-plus', color: 'text-blue-500' },
  important_event: { icon: 'fas fa-exclamation-circle', color: 'text-red-500' },
  task_delivered: { icon: 'fas fa-file-upload', color: 'text-green-500' },
  unit_created: { icon: 'fas fa-layer-group', color: 'text-indigo-500' },
  section_created: { icon: 'fas fa-list', color: 'text-blue-500' },
  task_created: { icon: 'fas fa-tasks', color: 'text-yellow-500' },
};

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'No leídas' },
  { key: 'mentions', label: 'Menciones' },
  { key: 'system', label: 'Sistema' },
];

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      fetchUnreadCount();

      const userId = (session.user as any).id as string | undefined;
      const channel = userId
        ? supabase
            .channel(`notifications:list:${userId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
              },
              () => {
                fetchNotifications();
                fetchUnreadCount();
              }
            )
            .subscribe()
        : null;

      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?page=1&limit=30');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/count');
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter(n => !n.is_read).map(n => markAsRead(n.id))
    );
    fetchNotifications();
    fetchUnreadCount();
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  };

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    fetchNotifications();
    fetchUnreadCount();
  };

  const clearAll = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      await fetch('/api/notifications', { method: 'DELETE' });
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const loadMore = async () => {
    // Implementar paginación real si lo necesitas
    fetchNotifications();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    if (filter === 'mentions') return n.type === 'mention';
    if (filter === 'system') return n.type === 'system';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Notificaciones</h1>
          <p className="text-gray-500">Mantente al tanto de tu actividad</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={markAllRead} className="text-blue-500 hover:text-blue-700 transition-colors">
            <i className="fas fa-check-double mr-1"></i> Marcar todas como leídas
          </button>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowSettings(s => !s); }} className="text-gray-500 hover:text-gray-700 transition-colors">
              <i className="fas fa-cog text-xl"></i>
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Configuración</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Preferencias</a>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn px-4 py-2 rounded-full font-medium ${filter === f.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {/* Contador */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500"><span id="unread-count">{unreadCount}</span> notificaciones sin leer</p>
        <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700">Limpiar todas</button>
      </div>
      {/* Lista de notificaciones */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="notification-scroll max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No hay notificaciones para mostrar</p>
            </div>
          ) : filteredNotifications.map(notification => (
            <div key={notification.id} className={`notification-item border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'unread bg-blue-50' : ''}`}>
              <div className="flex items-start p-4 md:p-6">
                <div className="flex-shrink-0 mt-1">
                  <div className={`h-10 w-10 rounded-full ${iconMap[notification.type]?.color || 'text-gray-400'} bg-opacity-20 flex items-center justify-center`}>
                    <i className={iconMap[notification.type]?.icon || 'fas fa-bell'}></i>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-800">{notification.title}</h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      className="action-btn text-xs font-medium text-blue-500 hover:text-blue-700"
                      onClick={() => { markAsRead(notification.id); fetchNotifications(); fetchUnreadCount(); }}
                    >
                      {notification.is_read ? <><i className="fas fa-check mr-1"></i> Leída</> : <><i className="far fa-check-circle mr-1"></i> Marcar como leída</>}
                    </button>
                    <button
                      className="action-btn text-xs font-medium text-gray-500 hover:text-gray-700"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <i className="fas fa-trash-alt mr-1"></i> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <button onClick={loadMore} className="text-blue-500 hover:text-blue-700 font-medium flex items-center justify-center w-full">
            <i className="fas fa-sync-alt mr-2"></i> Cargar más notificaciones
          </button>
        </div>
      </div>
    </div>
  );
}
