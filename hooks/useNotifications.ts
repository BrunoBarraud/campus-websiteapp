"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationStats {
  total_notifications: number;
  unread_notifications: number;
  high_priority_unread: number;
  recent_notifications: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_notifications: 0,
    unread_notifications: 0,
    high_priority_unread: 0,
    recent_notifications: 0
  });
  const [loading, setLoading] = useState(true);

  // Función para cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (!response.ok) throw new Error('Error al cargar notificaciones');
      
      const data = await response.json();
      setNotifications(data.notifications);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para marcar como leída
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: notificationIds })
      });

      if (!response.ok) throw new Error('Error al marcar como leída');
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setStats(prev => ({
        ...prev,
        unread_notifications: Math.max(0, prev.unread_notifications - notificationIds.length),
        high_priority_unread: Math.max(0, prev.high_priority_unread - 
          notificationIds.filter(id => {
            const notif = notifications.find(n => n.id === id);
            return notif && (notif.priority === 'high' || notif.priority === 'urgent');
          }).length
        )
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }, [notifications]);

  // Función para eliminar notificación
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar notificación');
      
      // Actualizar estado local
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.is_read) {
        setStats(prev => ({
          ...prev,
          unread_notifications: Math.max(0, prev.unread_notifications - 1),
          total_notifications: Math.max(0, prev.total_notifications - 1),
          high_priority_unread: (deletedNotif.priority === 'high' || deletedNotif.priority === 'urgent') 
            ? Math.max(0, prev.high_priority_unread - 1) 
            : prev.high_priority_unread
        }));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [notifications]);

  // Configurar suscripción en tiempo real
  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      // Cargar notificaciones iniciales
      await loadNotifications();

      // Configurar suscripción en tiempo real
      subscription = supabase
        .channel('notifications_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          (payload: any) => {
            const newNotification = payload.new as Notification;
            
            // Agregar nueva notificación al estado
            setNotifications(prev => [newNotification, ...prev].slice(0, 20));
            
            // Actualizar estadísticas
            setStats(prev => ({
              ...prev,
              total_notifications: prev.total_notifications + 1,
              unread_notifications: prev.unread_notifications + 1,
              high_priority_unread: (newNotification.priority === 'high' || newNotification.priority === 'urgent')
                ? prev.high_priority_unread + 1
                : prev.high_priority_unread,
              recent_notifications: prev.recent_notifications + 1
            }));

            // Mostrar notificación del navegador si está habilitada
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico',
                tag: newNotification.id
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications'
          },
          (payload: any) => {
            const updatedNotification = payload.new as Notification;
            
            // Actualizar notificación en el estado
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === updatedNotification.id ? updatedNotification : notif
              )
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications'
          },
          (payload: any) => {
            const deletedId = payload.old.id;
            
            // Remover notificación del estado
            setNotifications(prev => prev.filter(notif => notif.id !== deletedId));
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [loadNotifications]);

  // Solicitar permisos de notificación del navegador
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    notifications,
    stats,
    loading,
    loadNotifications,
    markAsRead,
    deleteNotification,
    requestNotificationPermission
  };
};
