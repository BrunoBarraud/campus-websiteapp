// 🔐 Helper para autenticación con NextAuth
import { getServerSession } from "next-auth";
import { userService } from '@/app/lib/services';
import { User } from '@/app/lib/types';

export async function getCurrentUser(): Promise<User | null> {
  try {
    // Obtener la sesión de NextAuth
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      console.log('No NextAuth session found');
      return null;
    }

    console.log('NextAuth session found for email:', session.user.email);

    // Obtener datos completos del usuario desde la base de datos
    const currentUser = await userService.getUserByEmail(session.user.email);

    if (!currentUser) {
      console.log('User not found in database for email:', session.user.email);
      return null;
    }

    return currentUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<User> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('No tienes permisos para realizar esta acción');
  }
  return user;
}
