// 💬 Hook para gestión de conversaciones y mensajes en tiempo real
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { Conversation, Message } from '@/lib/types';

export function useConversations() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Error al cargar conversaciones');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (participants: string[], type: 'direct' | 'group' = 'direct', title?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          participants,
          title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear conversación');
      }

      const newConversation = await response.json();
      
      // Actualizar lista de conversaciones
      setConversations(prev => [newConversation, ...prev]);
      
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast.error(err instanceof Error ? err.message : 'Error al crear conversación');
      throw err;
    }
  };

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
  };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (beforeId?: string) => {
    if (!conversationId) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '50',
      });
      
      if (beforeId) {
        params.append('before', beforeId);
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar mensajes');
      }

      const data = await response.json();
      
      if (beforeId) {
        // Paginación - agregar mensajes anteriores
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        // Carga inicial
        setMessages(data.messages || []);
      }
      
      setHasMore(data.hasMore || false);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      setHasMore(true);
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string, file?: File, replyToId?: string) => {
    if (!conversationId) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (file) {
        formData.append('file', file);
      }
      
      if (replyToId) {
        formData.append('reply_to_id', replyToId);
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      const newMessage = await response.json();
      
      // Agregar mensaje a la lista
      setMessages(prev => [...prev, newMessage]);
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err instanceof Error ? err.message : 'Error al enviar mensaje');
      throw err;
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al editar mensaje');
      }

      const updatedMessage = await response.json();
      
      // Actualizar mensaje en la lista
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
      
      return updatedMessage;
    } catch (err) {
      console.error('Error editing message:', err);
      toast.error(err instanceof Error ? err.message : 'Error al editar mensaje');
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?message_id=${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar mensaje');
      }

      // Remover mensaje de la lista
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast.success('Mensaje eliminado');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error(err instanceof Error ? err.message : 'Error al eliminar mensaje');
      throw err;
    }
  };

  const loadMoreMessages = () => {
    if (messages.length > 0 && hasMore && !loading) {
      const oldestMessage = messages[0];
      fetchMessages(oldestMessage.id);
    }
  };

  return {
    messages,
    loading,
    hasMore,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    refreshMessages: fetchMessages,
  };
}
