'use client'

import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import ChatSidebar from '../../../components/messaging/ChatSidebar';
import ChatWindow from '../../../components/messaging/ChatWindow';

const MensajeriaPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(true);

  // Obtener el usuario actual al montar el componente
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.id) {
            setCurrentUserId(data.id);
          } else {
            console.error('No se pudo obtener el ID del usuario:', data);
          }
        } else {
          console.error('Error al obtener usuario actual:', res.status);
        }
      } catch (error) {
        console.error('Error al obtener usuario actual:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Cuando seleccionas un usuario, busca o crea la conversación
  const handleSelectUser = async (userIdOrConversationId: string) => {
    // Limpiar estado anterior inmediatamente
    setSelectedUser(null);
    setConversationId(undefined);
    setLoadingChat(true);
    
    // En móviles, ocultar sidebar cuando se selecciona un chat
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
    
    // Verificar si es un conversationId (formato UUID) o un userId
    const isConversationId = userIdOrConversationId.includes('-') && userIdOrConversationId.length > 30;
    
    if (isConversationId) {
      // Es un conversationId directo
      setConversationId(userIdOrConversationId);
      // Obtener información de la conversación para setear el selectedUser
      try {
        const res = await fetch(`/api/conversations?conversationId=${userIdOrConversationId}`);
        const data = await res.json();
        if (data && data.otherParticipant) {
          setSelectedUser(data.otherParticipant.id);
        }
      } catch (error) {
        console.error('Error al obtener información de la conversación:', error);
      }
    } else {
      // Es un userId, buscar o crear conversación
      const res = await fetch(`/api/conversations?userId=${userIdOrConversationId}`);
      const data = await res.json();
      let convId;
      if (data && data.length > 0) {
        convId = data[0].conversation_id;
      } else {
        // Si no existe, crearla
        const createRes = await fetch(`/api/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participant_ids: [userIdOrConversationId], type: 'direct', title: null, description: null })
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          alert('Error al crear conversación: ' + (createData.error || JSON.stringify(createData)));
          setLoadingChat(false);
          return;
        }
        convId = createData.conversation_id;
      }
      setConversationId(convId);
      setSelectedUser(userIdOrConversationId);
    }
    
    setLoadingChat(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex flex-grow overflow-hidden pb-16 lg:pb-0">
        {/* Sidebar - Responsive */}
        <div className={`${
          showSidebar ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 lg:w-96 bg-white border-r border-gray-200`}>
          <ChatSidebar onSelectConversation={handleSelectUser} selectedConversation={conversationId} />
        </div>
        
        {/* Chat window - Responsive */}
        <div className={`${
          !showSidebar ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col relative`}>
          {/* Mobile back button */}
          {!showSidebar && (
            <div className="md:hidden bg-rose-950 text-white p-3 flex items-center">
              <button 
                onClick={() => setShowSidebar(true)}
                className="p-1 mr-3 hover:bg-rose-900 rounded"
              >
                <FaArrowLeft />
              </button>
              <h2 className="font-semibold">Mensajes</h2>
            </div>
          )}
          
          {loadingChat ? (
            <div className="flex flex-1 items-center justify-center text-amber-400 text-xl md:text-2xl animate-pulse p-4">
              Cargando chat...
            </div>
          ) : conversationId && currentUserId && conversationId.trim() !== '' && currentUserId.trim() !== '' ? (
            <ChatWindow conversationId={conversationId} currentUserId={currentUserId} />
          ) : currentUserId ? (
            <div className="flex flex-1 items-center justify-center text-gray-400 text-xl md:text-2xl p-4 text-center">
              <div>
                <p>Selecciona un usuario para comenzar a chatear</p>
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden mt-4 px-4 py-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500"
                >
                  Ver contactos
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-amber-400 text-xl md:text-2xl animate-pulse p-4">
              Cargando usuario...
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MensajeriaPage;
