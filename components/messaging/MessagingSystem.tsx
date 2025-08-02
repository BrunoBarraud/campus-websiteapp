"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircleIcon,
  SendIcon,
  PlusIcon,
  SearchIcon,
  FileIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  ReplyIcon,
  PaperclipIcon,
} from "lucide-react";
import { useConversations, useMessages } from '@/hooks/useMessaging';
import { toast } from 'sonner';
import type { Conversation, Message, User } from '@/lib/types';

interface MessagingSystemProps {
  className?: string;
}

export default function MessagingSystem({ className }: MessagingSystemProps) {
  const { data: session } = useSession();
  const { conversations, loading: conversationsLoading, createConversation } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Estados para crear nueva conversación
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    hasMore,
  } = useMessages(selectedConversation?.id || null);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Buscar usuarios para nueva conversación
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (searchUsers.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`/api/users/search?search=${encodeURIComponent(searchUsers)}&limit=10`);
        if (response.ok) {
          const users = await response.json();
          setSearchResults(users);
        }
      } catch {
        console.error('Error searching users');
      }
    };

    const timeout = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeout);
  }, [searchUsers]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation) return;

    try {
      await sendMessage(messageInput.trim(), selectedFile || undefined, replyingTo?.id);
      setMessageInput('');
      setSelectedFile(null);
      setReplyingTo(null);
    } catch {
      toast.error('Error al enviar mensaje');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máximo 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }

    try {
      const conversation = await createConversation(
        selectedUsers.map(u => u.id),
        selectedUsers.length === 1 ? 'direct' : 'group'
      );
      
      setSelectedConversation(conversation);
      setShowNewConversation(false);
      setSelectedUsers([]);
      setSearchUsers('');
      setSearchResults([]);
      toast.success('Conversación creada');
    } catch {
      toast.error('Error al crear la conversación');
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await editMessage(editingMessage.id, editContent.trim());
      setEditingMessage(null);
      setEditContent('');
      toast.success('Mensaje editado');
    } catch {
      toast.error('Error al editar el mensaje');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.title || 'Grupo sin nombre';
    }
    return conversation.other_participant_name || 'Conversación';
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Comentando validación temporal para debugging
  // if (!session?.user) {
  //   return (
  //     <div className={`p-6 text-center border rounded-lg ${className}`}>
  //       <MessageCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
  //       <p className="text-gray-600">Inicia sesión para acceder a los mensajes</p>
  //     </div>
  //   );
  // }

  return (
    <div className={`flex h-[600px] bg-background rounded-lg border ${className}`}>
      {/* Lista de conversaciones */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Mensajes</h3>
            <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Conversación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Usuarios seleccionados */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <Badge key={user.id} variant="secondary" className="px-2 py-1">
                          {user.name}
                          <button
                            onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Resultados de búsqueda */}
                  {searchResults.length > 0 && (
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {searchResults
                          .filter(user => !selectedUsers.find(su => su.id === user.id))
                          .map(user => (
                            <div
                              key={user.id}
                              onClick={() => setSelectedUsers(prev => [...prev, user])}
                              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewConversation(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateConversation} disabled={selectedUsers.length === 0}>
                      Crear Conversación
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100%-80px)]">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay conversaciones</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(getConversationTitle(conversation))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {getConversationTitle(conversation)}
                        </p>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message_content || 'Sin mensajes'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {conversation.last_message_at && formatMessageTime(conversation.last_message_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header de conversación */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getUserInitials(getConversationTitle(selectedConversation))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{getConversationTitle(selectedConversation)}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.type === 'group' ? 'Grupo' : 'Conversación directa'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4">
              {hasMore && (
                <div className="text-center mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={messagesLoading}
                  >
                    {messagesLoading ? 'Cargando...' : 'Cargar mensajes anteriores'}
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === session?.user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.sender_id === session?.user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100'
                      } rounded-lg p-3`}
                    >
                      {/* Reply indicator */}
                      {message.reply_to && (
                        <div className="text-xs opacity-70 mb-2 p-2 bg-black/10 rounded">
                          <p className="font-medium">{message.reply_to.sender?.name}</p>
                          <p className="truncate">{message.reply_to.content}</p>
                        </div>
                      )}

                      {/* Archivo/imagen */}
                      {message.file_url && (
                        <div className="mb-2">
                          {message.type === 'image' ? (
                            <img
                              src={message.file_url}
                              alt={message.file_name || 'Imagen'}
                              className="max-w-full h-auto rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-black/10 rounded">
                              <FileIcon className="h-4 w-4" />
                              <span className="text-sm">{message.file_name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(message.file_url, '_blank')}
                              >
                                Ver
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contenido del mensaje */}
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}

                      {/* Footer del mensaje */}
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>
                          {message.sender_id !== session?.user?.id && message.sender?.name}
                          {message.is_edited && ' (editado)'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{formatMessageTime(message.created_at)}</span>
                          
                          {/* Opciones del mensaje */}
                          {message.sender_id === session?.user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <MoreVerticalIcon className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingMessage(message);
                                    setEditContent(message.content);
                                  }}
                                >
                                  <EditIcon className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setReplyingTo(message)}
                                >
                                  <ReplyIcon className="h-4 w-4 mr-2" />
                                  Responder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMessage(message.id)}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="p-4 border-t">
              {/* Indicador de respuesta */}
              {replyingTo && (
                <div className="mb-2 p-2 bg-gray-100 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Respondiendo a {replyingTo.sender?.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyingTo(null)}
                    >
                      ×
                    </Button>
                  </div>
                  <p className="text-gray-600 truncate">{replyingTo.content}</p>
                </div>
              )}

              {/* Archivo seleccionado */}
              {selectedFile && (
                <div className="mb-2 p-2 bg-gray-100 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFile(null)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Escribe un mensaje..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    className="min-h-[40px] max-h-32 resize-none"
                  />
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && !selectedFile}
                  size="sm"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Selecciona una conversación para empezar</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para editar mensaje */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mensaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMessage(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditMessage}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
