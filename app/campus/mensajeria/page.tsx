'use client'

import React, { useState } from 'react';
import ChatSidebar from '../../../components/messaging/ChatSidebar';
import ChatWindow from '../../../components/messaging/ChatWindow';

const MensajeriaPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

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
  const handleSelectUser = async (userId: string) => {
    setLoadingChat(true);
    setSelectedUser(null);
    setConversationId(undefined);
    // Buscar si ya existe una conversación entre el usuario actual y el seleccionado
    const res = await fetch(`/api/conversations?userId=${userId}`);
    const data = await res.json();
    let convId;
    if (data && data.length > 0) {
      convId = data[0].conversation_id;
    } else {
      // Si no existe, crearla
      const createRes = await fetch(`/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_ids: [userId], type: 'direct', title: null, description: null })
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
    setSelectedUser(userId);
    setLoadingChat(false);
    setMobileView('chat');
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <main className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Card principal de mensajería */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col h-[calc(100vh-7rem)]">
            <div className="flex flex-1 flex-col lg:flex-row">
              {/* Sidebar */}
              <div
                className={`w-full lg:w-[320px] lg:min-w-[280px] lg:max-w-[360px] border-b lg:border-b-0 lg:border-r border-gray-200 ${
                  mobileView === 'chat' ? 'hidden lg:block' : 'block'
                }`}
              >
                <ChatSidebar onSelectConversation={handleSelectUser} selectedConversation={selectedUser} />
              </div>

              {/* Chat window */}
              <div
                className={`flex-1 min-w-0 flex flex-col ${
                  mobileView === 'list' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {loadingChat ? (
                  <div className="flex flex-1 items-center justify-center text-amber-400 text-2xl animate-pulse">
                    Cargando chat...
                  </div>
                ) : conversationId && currentUserId && conversationId.trim() !== '' && currentUserId.trim() !== '' ? (
                  <ChatWindow
                    conversationId={conversationId}
                    currentUserId={currentUserId}
                    onBack={() => setMobileView('list')}
                  />
                ) : currentUserId ? (
                  <div className="flex flex-1 items-center justify-center text-gray-400 text-center text-lg sm:text-xl px-6">
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">No hay una conversación seleccionada</p>
                      <p className="text-sm text-gray-500">
                        Elige un contacto en la lista de la izquierda para comenzar una conversación en el campus.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-amber-400 text-2xl animate-pulse">
                    Cargando usuario...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MensajeriaPage;
