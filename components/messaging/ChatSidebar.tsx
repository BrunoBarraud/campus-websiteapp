

import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useRealtimePresence, PresenceUser } from './useRealtimePresence';

interface ChatSidebarProps {
  onSelectConversation?: (id: string) => void;
  selectedConversation?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectConversation, selectedConversation }) => {
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<PresenceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const users = useRealtimePresence(currentUserId);

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

  const filtered = users.filter((user: PresenceUser) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-2 pl-10 rounded-lg bg-gray-100 focus:ring-2 focus:ring-amber-400"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
        </div>
      </div>

      {/* Lista de usuarios en tiempo real */}
      <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Cargando usuarios...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No se encontraron usuarios</div>
        ) : (
          filtered.filter(u => u.id !== currentUserId).map((user: PresenceUser) => (
            <div
              key={user.id}
              className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between ${selectedConversation === user.id ? 'bg-amber-100' : ''}`}
              onClick={() => onSelectConversation && onSelectConversation(user.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.email}`} alt={user.name} className="w-10 h-10 rounded-full" />
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${user.online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                </div>
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-xs text-gray-500 truncate w-40">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.typing ? 'Escribiendo...' : user.online ? 'En línea' : `Últ. vez: ${new Date(user.last_seen).toLocaleTimeString()}`}</p>
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
