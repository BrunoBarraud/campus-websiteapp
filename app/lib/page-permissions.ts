// Middleware simple para verificar permisos de acceso a páginas
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function checkPageAccess(requiredRole: string | string[]) {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/campus/login');
  }
  
  const userRole = session.user.role || 'guest';
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!allowedRoles.includes(userRole)) {
    // Redirect based on user role
    if (userRole === 'student') {
      redirect('/campus/student');
    } else if (userRole === 'teacher') {
      redirect('/campus/teacher');
    } else if (userRole === 'admin') {
      redirect('/campus/dashboard');
    } else {
      redirect('/campus/login');
    }
  }
  
  return session;
}

export async function redirectToUserDashboard() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/campus/login');
  }
  
  const userRole = session.user.role || 'guest';
  
  if (userRole === 'student') {
    redirect('/campus/student');
  } else if (userRole === 'teacher') {
    redirect('/campus/teacher');
  } else if (userRole === 'admin') {
    redirect('/campus/dashboard');
  } else {
    redirect('/campus/login');
  }
}
