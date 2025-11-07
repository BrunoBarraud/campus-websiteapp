

import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { PresenceUser } from './useRealtimePresence';
import { useUnreadMessages } from './useUnreadMessages';
import { supabase } from '@/app/lib/supabaseClient';

interface ChatSidebarProps {
  onSelectConversation?: (id: string) => void;
  selectedConversation?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectConversation, selectedConversation }) => {
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<PresenceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const { unreadCounts, markAsRead } = useUnreadMessages(currentUserId);

  useEffect(() => {
    // Obtener usuario autenticado
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data);
        setCurrentUserId(data.id);
        setLoading(false);
      });
  }, []);

  // Función para cargar conversaciones existentes
  const loadConversations = async () => {
    if (!currentUserId) return;
    
    setConversationsLoading(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        
        // Obtener información de los otros participantes para cada conversación
        const conversationsWithParticipants = await Promise.all(
          data.map(async (conv: any) => {
            try {
              const participantsResponse = await fetch(`/api/conversations?conversationId=${conv.conversation_id}`);
              if (participantsResponse.ok) {
                const participantsData = await participantsResponse.json();
                const otherParticipant = participantsData[0]?.conversation?.participants?.find(
                  (p: any) => p.user_id !== currentUserId
                );
                return {
                  ...conv,
                  otherParticipant: otherParticipant?.user || null
                };
              }
            } catch (error) {
              console.error('Error loading participant for conversation:', conv.conversation_id, error);
            }
            return { ...conv, otherParticipant: null };
          })
        );
        
        setConversations(conversationsWithParticipants.filter(conv => conv.otherParticipant));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  // Cargar conversaciones cuando se obtiene el usuario actual
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  // Suscripción en tiempo real para nuevas conversaciones y mensajes
  useEffect(() => {
    if (!currentUserId) return;

    // Suscribirse a nuevos mensajes para actualizar la lista de conversaciones
    const messagesChannel = supabase
      .channel('new-conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (_payload) => {
          // Cuando llega un nuevo mensaje, recargar conversaciones
          // para asegurar que aparezcan las nuevas conversaciones
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${currentUserId}`
        },
        (_payload) => {
          // Cuando el usuario es agregado a una nueva conversación
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId]);

  // Función para buscar usuarios
  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        console.error('Error searching users:', data.error);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Efecto para buscar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(search);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Función para manejar el cambio en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="contacts-list bg-white rounded-lg shadow-md w-full h-full flex flex-col">
      {/* User Profile - usuario autenticado */}
      {currentUser && (
        <div className="bg-rose-950 text-white p-4 rounded-t-lg flex items-center space-x-3">
          <div className="relative">
            <img src={currentUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name || currentUser.email}`} alt={currentUser.name} className="w-12 h-12 rounded-full border-2 border-amber-400" />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${currentUser.online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
          </div>
          <div>
            <h2 className="font-bold">{currentUser.name}</h2>
            <p className="text-xs text-amber-300">{currentUser.online ? 'En línea' : `Últ. vez: ${new Date(currentUser.last_seen).toLocaleTimeString()}`}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar usuario por nombre o email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 rounded-lg bg-gray-100 focus:ring-2 focus:ring-amber-400"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
        </div>
      </div>

      {/* Lista de conversaciones o usuarios filtrados */}
      <div className="overflow-y-auto max-h-[calc(100dvh-16rem)] sm:max-h-[calc(100dvh-18rem)] pb-2 overscroll-contain">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Cargando...</div>
        ) : search.trim().length < 2 ? (
          // Mostrar conversaciones existentes cuando no hay búsqueda
          conversationsLoading ? (
            <div className="p-4 text-center text-gray-400">Cargando conversaciones...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p className="text-sm">No tienes conversaciones</p>
              <p className="text-xs mt-1 text-gray-500">Busca usuarios para iniciar una conversación</p>
            </div>
          ) : (
            conversations.map((conv: any) => (
              <div
                key={conv.conversation_id}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between ${selectedConversation === conv.otherParticipant?.id ? 'bg-amber-100' : ''}`}
                onClick={() => {
                  if (onSelectConversation && conv.otherParticipant) {
                    onSelectConversation(conv.otherParticipant.id);
                    // Marcar mensajes como leídos cuando se selecciona la conversación
                    if (unreadCounts[conv.conversation_id] > 0) {
                      markAsRead(conv.conversation_id);
                    }
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={conv.otherParticipant?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.otherParticipant?.name || conv.otherParticipant?.email}`} 
                      alt={conv.otherParticipant?.name} 
                      className="w-10 h-10 rounded-full" 
                    />
                    <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${conv.otherParticipant?.online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{conv.otherParticipant?.name}</h3>
                      {unreadCounts[conv.conversation_id] > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCounts[conv.conversation_id]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate w-40">{conv.otherParticipant?.email}</p>
                    <p className="text-xs text-gray-400">
                      {conv.otherParticipant?.online ? (
                        'En línea'
                      ) : (
                        `Últ. vez: ${new Date(conv.otherParticipant?.last_seen).toLocaleTimeString()}`
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{conv.otherParticipant?.role}</span>
              </div>
            ))
          )
        ) : searchLoading ? (
          <div className="p-4 text-center text-gray-400">Buscando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No se encontraron usuarios</p>
            <p className="text-xs mt-1 text-gray-500">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          users.map((user: PresenceUser) => (
            <div
              key={user.id}
              className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between ${selectedConversation === user.id ? 'bg-amber-100' : ''}`}
              onClick={() => {
                if (onSelectConversation) {
                  onSelectConversation(user.id);
                  // Marcar mensajes como leídos cuando se selecciona la conversación
                  if (unreadCounts[user.id] > 0) {
                    markAsRead(user.id);
                  }
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.email}`} alt={user.name} className="w-10 h-10 rounded-full" />
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${user.online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{user.name}</h3>
                    {unreadCounts[user.id] > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {unreadCounts[user.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate w-40">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    {user.typing ? (
                      <span className="text-blue-500 font-medium animate-pulse">Escribiendo...</span>
                    ) : user.online ? (
                      'En línea'
                    ) : (
                      `Últ. vez: ${new Date(user.last_seen).toLocaleTimeString()}`
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{user.role}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
