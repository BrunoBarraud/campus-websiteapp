'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

interface UnreadCount {
  conversation_id: string;
  unread_count: number;
}

export const useUnreadMessages = (currentUserId: string) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUnreadCounts = async () => {
      try {
        const response = await fetch('/api/messages/unread');
        if (response.ok) {
          const data = await response.json();
          const counts: Record<string, number> = {};
          data.forEach((item: UnreadCount) => {
            counts[item.conversation_id] = item.unread_count;
          });
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCounts();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=neq.${currentUserId}` // Solo mensajes que no son del usuario actual
        },
        (payload) => {
          const message = payload.new as any;
          if (message.sender_id !== currentUserId) {
            setUnreadCounts(prev => ({
              ...prev,
              [message.conversation_id]: (prev[message.conversation_id] || 0) + 1
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${currentUserId}`
        },
        (_payload) => {
          // Cuando se actualiza last_read_at, recalcular contadores
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    unreadCounts,
    loading,
    markAsRead
  };
};