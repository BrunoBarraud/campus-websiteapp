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
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Evitar duplicados
            if (prev.some(m => m.id === newMessage.id)) return prev;
            // Agregar al final (más reciente)
            return [...prev, newMessage];
          });
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    // Obtener mensajes iniciales usando la API
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?conversation_id=${conversationId}&limit=50&offset=0`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al obtener mensajes:', errorData.error || `HTTP ${response.status}`);
          return;
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
           // Los mensajes vienen ordenados por created_at DESC, los revertimos para orden cronológico
           setMessages(data.reverse());
         } else {
           console.error('Error al obtener mensajes: Respuesta no válida', data);
         }
      } catch (error) {
        console.error('Error al obtener mensajes:', error);
      }
    };
    
    fetchMessages();

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

  // Función para enviar mensaje usando la API
  const sendMessage = async (content: string, file?: File, replyToId?: string) => {
    try {
      let fileData = {};
      
      // Manejar archivo adjunto si existe
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'messages');
        formData.append('subjectId', conversationId);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          fileData = {
            file_url: uploadResult.url,
            file_name: file.name,
            file_size: file.size
          };
        }
      }
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content,
          reply_to_id: replyToId,
          type: file ? 'file' : 'text',
          ...fileData
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }
      
      return { data: result, error: null };
     } catch (error) {
       console.error('Error al enviar mensaje:', error);
       return { data: null, error: { message: 'Error de conexión' } };
     }
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
