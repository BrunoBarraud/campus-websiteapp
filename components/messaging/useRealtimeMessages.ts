import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
  reply_to_id?: string;
  type?: string;
}

export function useRealtimeMessages(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeouts = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (!conversationId) return;
    // Escuchar mensajes nuevos y actualizaciones
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new as Message]);
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    // Obtener mensajes iniciales
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error al obtener mensajes:', error.message, error.details);
        }
        setMessages(data || []);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId]);

  // Escuchar typing de otros usuarios
  useEffect(() => {
    if (!conversationId) return;
    const typingSub = supabase
      .channel('public:users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        const user = payload.new;
        if (user.typing && user.id !== currentUserId) {
          setTypingUsers((prev) => {
            if (!prev.includes(user.id)) return [...prev, user.id];
            return prev;
          });
          // Remover el estado typing después de 5 segundos
          if (typingTimeouts.current[user.id]) clearTimeout(typingTimeouts.current[user.id]);
          typingTimeouts.current[user.id] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter(id => id !== user.id));
          }, 5000);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(typingSub);
    };
  }, [conversationId, currentUserId]);

  // Función para enviar mensaje
  const sendMessage = async (content: string, file?: File, replyToId?: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        reply_to_id: replyToId,
        type: 'text',
        created_at: new Date().toISOString(),
      });
    // Manejar archivo adjunto si es necesario
    // ...
    return { data, error };
  };

  // Función para marcar typing
  const setTyping = async (isTyping: boolean) => {
    if (currentUserId && typeof currentUserId === 'string' && currentUserId.length > 0) {
      await supabase
        .from('users')
        .update({ typing: isTyping })
        .eq('id', currentUserId);
    }
  };

  return { messages, sendMessage, typingUsers, setTyping };
}
