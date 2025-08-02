// Re-exportar configuración académica para compatibilidad
export { ACADEMIC_CONFIG, AcademicUtils } from './academic';
export type { AcademicYear, Semester, Division, Role, NotificationType, ConversationType } from './academic';

interface NavLink {
  id: number;
  url: string;
  label: string;
}

// Enlaces de navegación principales (legacy - para compatibilidad)
const navLinks: NavLink[] = [
  // Links eliminados: Dashboard, Calendario, Perfil y Configuración
  // ya están disponibles en el menú lateral izquierdo
];

// Enlaces de navegación del campus por rol
export const CAMPUS_NAVIGATION = {
  common: [
    { id: 1, url: '/campus/dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 2, url: '/campus/messages', label: 'Mensajes', icon: '💬' },
    { id: 3, url: '/campus/notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 4, url: '/campus/calendar', label: 'Calendario', icon: '📅' },
    { id: 5, url: '/campus/profile', label: 'Perfil', icon: '👤' },
    { id: 6, url: '/campus/settings', label: 'Configuración', icon: '⚙️' }
  ],
  admin: [
    { id: 7, url: '/campus/admin', label: 'Administración', icon: '👑' },
    { id: 8, url: '/campus/admin/users', label: 'Gestión de Usuarios', icon: '👥' },
    { id: 9, url: '/campus/admin/subjects', label: 'Gestión de Materias', icon: '📚' }
  ],
  teacher: [
    { id: 10, url: '/campus/teacher/subjects', label: 'Mis Materias', icon: '📝' },
    { id: 11, url: '/campus/teacher/grades', label: 'Calificaciones', icon: '📊' }
  ],
  student: [
    { id: 12, url: '/campus/student/subjects', label: 'Mis Cursos', icon: '🎓' },
    { id: 13, url: '/campus/student/grades', label: 'Mis Calificaciones', icon: '📋' }
  ]
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Campus IPDVS',
  version: '1.0.0',
  description: 'Plataforma educativa del Instituto Privado Domingo Victorio Sarmiento',
  defaultTheme: 'light',
  supportedLocales: ['es', 'en'] as const,
  defaultLocale: 'es',
  
  // Configuración de sesión
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60 // 24 horas
  },

  // Configuración de paginación
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    availablePageSizes: [10, 20, 50, 100] as const
  },

  // Configuración de tiempo
  time: {
    timezone: 'America/Argentina/Buenos_Aires',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm'
  }
} as const;

export default navLinks;