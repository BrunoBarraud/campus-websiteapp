'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaPhone, FaVideo, FaEllipsisV, FaPaperclip, FaMicrophone, FaPaperPlane, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useRealtimeMessages } from './useRealtimeMessages';

const ChatWindow: React.FC<{ conversationId?: string; currentUserId?: string; onBack?: () => void }> = ({ conversationId, currentUserId, onBack }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, typingUsers, setTyping } = useRealtimeMessages(conversationId || '', currentUserId || '');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<any | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setLoadingRecipient(false);
      return;
    }

    setLoadingRecipient(true);

    // Obtener participantes de la conversación con datos de usuario (online/last_seen)
    fetch(`/api/conversations?conversationId=${conversationId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        if (!text.trim()) {
          throw new Error('Empty response');
        }
        return JSON.parse(text);
      })
      .then(data => {
        if (data && data.length > 0) {
          const otherParticipant = data[0].conversation.participants?.find((p: any) => p.user_id !== currentUserId);
          if (otherParticipant?.user) {
            setRecipient(otherParticipant.user);
          } else {
            setRecipient(null);
          }
        }
      })
      .catch(error => {
        console.error('Error al obtener participantes:', error);
        setRecipient(null);
      })
      .finally(() => {
        setLoadingRecipient(false);
      });

    // Obtener last_read_at del otro participante para estados de mensaje (visto)
    fetch(`/api/conversations/${conversationId}/participants`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const other = data.find((p: any) => p.user_id !== currentUserId);
          setOtherLastReadAt(other?.last_read_at || null);
        }
      })
      .catch(error => {
        console.error('Error al obtener last_read_at de participantes:', error);
        setOtherLastReadAt(null);
      });

    // Obtener datos del usuario actual
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data))
      .catch(error => console.error('Error al obtener usuario actual:', error));
  }, [conversationId, currentUserId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    
    // Validar que hay contenido para enviar
    if (!input.trim() && !file) {
      setSendError('Escribe un mensaje o adjunta un archivo.');
      return;
    }
    
    // Validar que tenemos los datos necesarios
    if (!conversationId || conversationId.trim() === '') {
      setSendError('No hay conversación seleccionada.');
      return;
    }
    
    if (!currentUserId || currentUserId.trim() === '') {
      setSendError('Error de autenticación. Recarga la página.');
      return;
    }
    
    setSending(true);
    const { error } = await sendMessage(input, file ?? undefined, replyTo?.id);
    if (error) {
      setSendError(error.message || 'Error al enviar el mensaje');
      setSending(false);
      return;
    }
    setReplyTo(null);
    setInput('');
    setFile(null);
    setSending(false);
    setTyping(false);
  };

  // Marcar typing cuando el usuario escribe
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInput(e.target.value);
  setTyping(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800">
      {/* Chat Header */}
      <div className="flex items-center justify-between py-3 px-4 bg-amber-900 text-white shadow-md rounded-t-lg">
        <div className="flex items-center space-x-3">
          <button className="md:hidden p-1" type="button" onClick={onBack}>
            <FaArrowLeft />
          </button>
          <div className="relative">
            <img src={recipient?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${recipient?.name || recipient?.email || 'U'}`} alt={recipient?.name || 'Usuario'} className="w-10 h-10 rounded-full border-2 border-amber-400" />
            {recipient?.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {loadingRecipient ? (
                <span className="animate-pulse">Cargando...</span>
              ) : (
                recipient?.name || recipient?.email || 'Usuario'
              )}
            </h2>
            <p className="text-xs text-amber-200">
              {loadingRecipient ? (
                <span className="animate-pulse">...</span>
              ) : (
                recipient?.online
                  ? 'En línea'
                  : recipient?.last_seen
                  ? `Últ. vez: ${new Date(recipient.last_seen).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`
                  : 'Desconectado'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-full hover:bg-amber-800"><FaPhone /></button>
          <button className="p-1 rounded-full hover:bg-amber-800"><FaVideo /></button>
        </div>
      </div>

      {/* Mensajes en tiempo real */}
      <div className="flex flex-col space-y-4 p-3 overflow-y-auto flex-grow bg-gray-100">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-gray-400 animate-pulse">No hay mensajes</div>
        ) : (
          messages.map((msg, idx) => {
            const isCurrentUser = msg.sender_id === currentUserId;
            const isSeen =
              isCurrentUser &&
              otherLastReadAt &&
              new Date(otherLastReadAt) >= new Date(msg.created_at);
            const avatarUrl = isCurrentUser
              ? (currentUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || currentUser?.email || 'U'}`)
              : (recipient?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${recipient?.name || recipient?.email || 'U'}`);
            return (
              <div
                key={msg.id || idx}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <img
                    src={avatarUrl}
                    alt={recipient?.name || 'Usuario'}
                    className="w-8 h-8 rounded-full mr-2 mt-1 flex-shrink-0"
                  />
                )}
                <div className="flex flex-col space-y-1 text-xs max-w-xs mx-2 md:max-w-md">
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <span
                      className={`px-4 py-2 rounded-xl shadow ${
                        isCurrentUser
                          ? 'bg-rose-400 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </span>
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-xs underline"
                      >
                        {msg.file_name || 'Archivo adjunto'}
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block text-right">
                    {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {isCurrentUser && (
                      isSeen ? (
                        <FaCheckDouble className="inline text-blue-500 ml-1" />
                      ) : (
                        <FaCheck className="inline text-gray-500 ml-1" />
                      )
                    )}
                  </span>
                </div>
                {isCurrentUser && (
                  <img
                    src={avatarUrl}
                    alt={currentUser?.name || 'Tú'}
                    className="w-8 h-8 rounded-full ml-2 mt-1 flex-shrink-0"
                  />
                )}
              </div>
            );
          })
        )}
        {/* Estado escribiendo */}
        {typingUsers.length > 0 && (
          <div className="p-2 text-xs text-amber-400">{`Escribiendo...`}</div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex items-center h-16 w-full px-3 bg-white border-t border-gray-200 shadow-lg rounded-b-lg">
        {replyTo && (
          <div className="mb-2 p-2 rounded bg-gray-100 text-xs text-gray-600 border-l-4 border-amber-400 flex justify-between">
            <span>
              <span className="font-semibold">Respondiendo a:</span>{' '}
              {replyTo.content}
            </span>
            <button className="ml-2 text-gray-400 hover:text-red-500" type="button" onClick={() => setReplyTo(null)}>
              <FaEllipsisV />
            </button>
          </div>
        )}
        <form className="flex items-center w-full" onSubmit={handleSend}>
          {sendError && (
            <div className="text-xs text-red-500 mb-2">{sendError}</div>
          )}
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-amber-400"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <FaPaperclip />
          </button>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-grow p-2 px-4 rounded-full border bg-gray-100 focus:bg-white focus:border-rose-400 focus:outline-none mx-2 h-10 text-sm"
            value={input}
            onChange={handleInputChange}
            disabled={sending}
            // El envío solo por submit, no por onKeyDown
          />
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button type="button" className="p-2 text-gray-500 hover:text-amber-400">
            <FaMicrophone />
          </button>
          <button
            onClick={handleSend}
            type="submit"
            className="flex items-center justify-center bg-rose-400 hover:bg-rose-500 rounded-full text-white w-10 h-10 flex-shrink-0 transition duration-300 ml-1"
            disabled={sending}
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
