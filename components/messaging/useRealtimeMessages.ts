import { useEffect, useState, useRef, useCallback } from 'react';

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
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastMessageId = useRef<string | null>(null);

  // Limpiar mensajes cuando cambia la conversación
  useEffect(() => {
    console.log('🔄 Cambiando conversación:', { conversationId, currentUserId });
    setMessages([]);
    setTypingUsers([]);
    lastMessageId.current = null;
    // Limpiar timeouts de typing
    Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
    typingTimeouts.current = {};
    // Limpiar polling anterior
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, [conversationId]);

  // Función para obtener mensajes desde la API
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
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
        const sortedMessages = data.reverse();
        setMessages(sortedMessages);
        
        // Actualizar el último mensaje ID para polling
        if (sortedMessages.length > 0) {
          lastMessageId.current = sortedMessages[sortedMessages.length - 1].id;
        }
      } else {
        console.error('Error al obtener mensajes: Respuesta no válida', data);
      }
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
    }
  }, [conversationId]);

  // Función para verificar nuevos mensajes (polling)
  const checkForNewMessages = useCallback(async () => {
    if (!conversationId || !lastMessageId.current) return;
    
    try {
      const response = await fetch(`/api/messages?conversation_id=${conversationId}&limit=10&offset=0`);
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const sortedMessages = data.reverse();
        const newMessages = sortedMessages.filter(msg => {
          return msg.id !== lastMessageId.current;
        });
        
        if (newMessages.length > 0) {
          console.log('📨 Nuevos mensajes encontrados:', newMessages.length);
          setMessages(prev => {
            // Filtrar mensajes que no existen ya
            const filteredNewMessages = newMessages.filter(newMsg => 
              !prev.some(existingMsg => existingMsg.id === newMsg.id)
            );
            
            if (filteredNewMessages.length > 0) {
              // Actualizar último mensaje ID
              lastMessageId.current = filteredNewMessages[filteredNewMessages.length - 1].id;
              return [...prev, ...filteredNewMessages];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error al verificar nuevos mensajes:', error);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    
    console.log('🔄 Iniciando sistema de mensajería con polling para:', conversationId);

    // Obtener mensajes iniciales
    fetchMessages();
    
    // Configurar polling para nuevos mensajes cada 3 segundos
    pollingInterval.current = setInterval(() => {
      checkForNewMessages();
    }, 3000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [conversationId]);

  // Nota: Funcionalidad de typing deshabilitada temporalmente
  // Se puede implementar con polling si es necesario en el futuro

  // Función para enviar mensaje usando la API
  const sendMessage = async (content: string, replyToId?: string, file?: File) => {
    if (!conversationId || !currentUserId) {
      throw new Error('Faltan datos requeridos para enviar mensaje');
    }

    try {
      let fileData = null;
      
      // Si hay archivo, subirlo primero
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Error al subir archivo');
        }
        
        fileData = await uploadResponse.json();
      }
      
      // Enviar mensaje
      const messageData = {
        conversation_id: conversationId,
        content,
        reply_to_id: replyToId || null,
        file_url: fileData?.url || null,
        file_name: fileData?.name || null,
        file_size: fileData?.size || null,
        file_type: fileData?.type || null,
      };
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }
      
      const newMessage = await response.json();
      console.log('✅ Mensaje enviado exitosamente:', newMessage);
      
      // Agregar inmediatamente el mensaje a la lista local para respuesta instantánea
      setMessages(prev => {
        // Evitar duplicados
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      
      // Actualizar último mensaje ID
      lastMessageId.current = newMessage.id;
      
      return newMessage;
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      throw error;
    }
  };

  // Función para marcar typing (simplificada sin Realtime)
  const setTyping = async (isTyping: boolean) => {
    // Funcionalidad de typing deshabilitada temporalmente
    // Se puede implementar con polling si es necesario
    console.log('Typing status:', isTyping);
  };

  return {
    messages,
    typingUsers,
    sendMessage,
    setTyping,
  };
}
