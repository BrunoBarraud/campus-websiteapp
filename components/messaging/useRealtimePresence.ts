function isPresenceUser(obj: any): obj is PresenceUser {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.email === 'string';
}
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  online: boolean;
  last_seen: string;
  typing: boolean;
  role: string;
}

export function useRealtimePresence(currentUserId: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    // Suscribirse a cambios en la tabla users (online/last_seen)
    const subscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        setUsers((prev: PresenceUser[]) => {
          if (!isPresenceUser(payload.new)) return prev;
          const userNew = payload.new as PresenceUser;
          const idx = prev.findIndex((u) => u.id === userNew.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...payload.new };
            return updated;
          }
          // Si es un usuario nuevo, lo agregamos
          return [...prev, payload.new];
        });
      })
      .subscribe();

    // Obtener usuarios iniciales
    supabase
      .from('users')
      .select('id, name, email, avatar_url, online, last_seen, typing, role')
      .then(({ data }) => {
        setUsers(data || []);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Actualizar presencia del usuario actual
  useEffect(() => {
    if (!currentUserId) return;
    const updateOnline = async () => {
      await supabase
        .from('users')
        .update({ online: true, last_seen: new Date().toISOString() })
        .eq('id', currentUserId);
    };
    updateOnline();
    const interval = setInterval(updateOnline, 30000); // Actualiza cada 30s
    return () => clearInterval(interval);
  }, [currentUserId]);

  return users;
}
