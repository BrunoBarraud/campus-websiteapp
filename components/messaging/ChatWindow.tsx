'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaPhone, FaVideo, FaEllipsisV, FaPaperclip, FaMicrophone, FaPaperPlane, FaCheckDouble } from 'react-icons/fa';
import { useRealtimeMessages } from './useRealtimeMessages';

const ChatWindow: React.FC<{ conversationId?: string; currentUserId?: string }> = ({ conversationId, currentUserId }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, typingUsers, setTyping } = useRealtimeMessages(conversationId || '', currentUserId || '');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    // Obtener participantes de la conversación
    fetch(`/api/conversations?conversationId=${conversationId}`)
      .then(res => res.json())
      .then(async data => {
        if (data && data.length > 0) {
          // Buscar el participante que NO es el actual
          const otherParticipant = data[0].conversation.participants?.find((p: any) => p.user_id !== currentUserId);
          if (otherParticipant?.user_id && typeof otherParticipant.user_id === 'string' && otherParticipant.user_id.length > 0) {
            // Obtener datos completos del usuario destinatario
            const userRes = await fetch(`/api/users/${otherParticipant.user_id}`);
            const userData = await userRes.json();
            setRecipient(userData);
          } else {
            setRecipient(null);
          }
        }
      });
    // Obtener datos del usuario actual
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data));
  }, [conversationId, currentUserId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    if ((!input.trim() && !file) || !conversationId || !currentUserId) {
      setSendError('Faltan datos para enviar el mensaje.');
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
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-rose-950 text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="md:hidden p-1">
            <FaArrowLeft />
          </button>
          <div className="relative">
            <img src={recipient?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${recipient?.name || recipient?.email || 'U'}`} alt={recipient?.name || 'Usuario'} className="w-10 h-10 rounded-full border-2 border-amber-400" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <h2 className="font-bold text-lg">{recipient?.name || recipient?.email || 'Chat Privado'}</h2>
            <p className="text-xs text-amber-300">En línea</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-full hover:bg-rose-900"><FaPhone /></button>
          <button className="p-1 rounded-full hover:bg-rose-900"><FaVideo /></button>
        </div>
      </div>

      {/* Mensajes en tiempo real */}
      <div className="overflow-y-auto p-4 flex-grow bg-gray-50 space-y-4">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-gray-400 animate-pulse">No hay mensajes</div>
        ) : (
          messages.map((msg, idx) => {
            const isCurrentUser = msg.sender_id === currentUserId;
            const avatarUrl = isCurrentUser
              ? (currentUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || currentUser?.email || 'U'}`)
              : (recipient?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${recipient?.name || recipient?.email || 'U'}`);
            return (
              <div key={msg.id || idx} className={`flex ${isCurrentUser ? 'justify-end' : ''}`}>
                {!isCurrentUser && (
                  <img src={avatarUrl} alt={recipient?.name || 'Usuario'} className="w-8 h-8 rounded-full mr-3" />
                )}
                <div>
                  <div className={`p-3 rounded-lg shadow-sm max-w-xs md:max-w-md ${isCurrentUser ? 'bg-amber-400 text-white' : 'bg-white'}`}>
                    <p>{msg.content}</p>
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
                  <span className="text-xs text-gray-500 mt-1 block">{msg.created_at} {isCurrentUser && <FaCheckDouble className="inline text-blue-500 ml-1" />}</span>
                </div>
                {isCurrentUser && (
                  <img src={avatarUrl} alt={currentUser?.name || 'Tú'} className="w-8 h-8 rounded-full ml-3" />
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
      <div className="p-3 border-t bg-white rounded-b-lg">
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
        <form className="flex items-center" onSubmit={handleSend}>
          {sendError && (
            <div className="text-xs text-red-500 mb-2">{sendError}</div>
          )}
          <button type="button" className="p-2 text-gray-500 hover:text-amber-400" onClick={() => fileInputRef.current?.click()} disabled={sending}>
            <FaPaperclip />
          </button>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-grow p-2 px-4 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-amber-400 mx-2"
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
          <button type="button" className="p-2 text-gray-500 hover:text-amber-400"><FaMicrophone /></button>
          <button onClick={handleSend} type="submit" className="p-2 bg-amber-400 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-amber-500 ml-2" disabled={sending}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
