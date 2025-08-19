'use client'

import React, { useState } from 'react';
import ChatSidebar from '../../../components/messaging/ChatSidebar';
import ChatWindow from '../../../components/messaging/ChatWindow';

const MensajeriaPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // Obtener el usuario actual al montar el componente
  React.useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        if (data?.id) setCurrentUserId(data.id);
      });
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
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="container mx-auto py-8 px-2 flex flex-row gap-8 flex-grow">
        {/* Sidebar */}
        <div className="min-w-[320px] max-w-[350px] w-full">
          <ChatSidebar onSelectConversation={handleSelectUser} selectedConversation={selectedUser} />
        </div>
        {/* Chat window */}
        <div className="flex-1 flex flex-col">
          {loadingChat ? (
            <div className="flex flex-1 items-center justify-center text-amber-400 text-2xl animate-pulse">
              Cargando chat...
            </div>
          ) : conversationId && currentUserId ? (
            <ChatWindow conversationId={conversationId} currentUserId={currentUserId} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400 text-2xl">
              Selecciona un usuario para comenzar a chatear
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MensajeriaPage;
