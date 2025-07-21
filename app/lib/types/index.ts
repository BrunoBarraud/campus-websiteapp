// 📋 Tipos TypeScript para el sistema de roles del Campus Virtual

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  year?: number | null; // Solo para estudiantes
  division?: string | null; // División del curso (A, B, C, etc.) - Solo para estudiantes
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  year: number;
  semester?: number;
  credits: number;
  teacher_id?: string;
  teacher?: User; // Relación con profesor
  units?: SubjectUnit[]; // Unidades de la materia
  image_url?: string; // URL de imagen de la materia
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectUnit {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  description?: string;
  order_index: number;
  documents?: Document[]; // Archivos de la unidad
  content?: SubjectContent[]; // Contenido adicional
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ContentType = 'announcement' | 'resource' | 'assignment' | 'note';

export interface SubjectContent {
  id: string;
  subject_id: string;
  content_type: ContentType;
  title: string;
  content?: string;
  unit_id?: string;
  created_by?: string;
  creator?: User;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EventType = 'exam' | 'assignment' | 'class' | 'holiday' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: EventType;
  subject_id?: string;
  subject?: Subject; // Relación con materia
  created_by?: string;
  creator?: User; // Relación con creador
  year?: number; // Para filtrar por año de estudiantes
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  subject_id?: string;
  subject?: Subject; // Relación con materia
  unit_id?: string; // Nueva relación con unidad
  unit?: SubjectUnit; // Relación con unidad
  uploaded_by?: string;
  uploader?: User; // Relación con quien subió
  year?: number; // Para filtrar por año
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentSubject {
  id: string;
  student_id: string;
  subject_id: string;
  student?: User;
  subject?: Subject;
  enrolled_at: string;
  is_active: boolean;
}

// 🔐 Tipos para permisos y contexto de usuario
export interface UserPermissions {
  canEditCalendar: boolean;
  canEditSubjects: boolean;
  canManageUsers: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canViewAllYears: boolean;
  canAssignTeachers: boolean;
}

export interface UserContext {
  user: User;
  permissions: UserPermissions;
  subjects?: Subject[]; // Materias del usuario (profesor: sus materias, estudiante: materias de su año)
}

// 📝 Tipos para formularios
export interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  year?: number;
  division?: string; // División del curso (A, B, C, etc.)
  phone?: string;
  bio?: string;
}

export interface CreateSubjectForm {
  name: string;
  code: string;
  description?: string;
  year: number;
  semester?: number;
  credits: number;
  teacher_id?: string;
}

export interface CreateEventForm {
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: EventType;
  subject_id?: string;
  year?: number;
}

export interface CreateDocumentForm {
  title: string;
  description?: string;
  file: File;
  subject_id?: string;
  unit_id?: string;
  year?: number;
  is_public: boolean;
}

// 🎨 Tipos para componentes UI
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalDocuments: number;
  upcomingEvents: number;
}

export interface CalendarProps {
  events: CalendarEvent[];
  canEdit: boolean;
  userYear?: number;
  onEventCreate?: (event: CreateEventForm) => void;
  onEventEdit?: (id: string, event: Partial<CalendarEvent>) => void;
  onEventDelete?: (id: string) => void;
}

export interface SubjectCardProps {
  subject: Subject;
  canEdit: boolean;
  onEdit?: (subject: Subject) => void;
  onDelete?: (id: string) => void;
}

// 🔍 Tipos para filtros y búsquedas
export interface DocumentFilter {
  year?: number;
  subject_id?: string;
  type?: string;
  search?: string;
}

export interface EventFilter {
  year?: number;
  subject_id?: string;
  type?: EventType;
  month?: number;
  search?: string;
}

export interface UserFilter {
  role?: UserRole;
  year?: number;
  is_active?: boolean;
  search?: string;
}

// 📊 Tipos para APIs
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 🎯 Utilidades para roles
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    admin: 'Administrador',
    teacher: 'Profesor',
    student: 'Estudiante'
  };
  return roleNames[role];
};

export const getEventTypeDisplayName = (type: EventType): string => {
  const typeNames = {
    exam: 'Examen',
    assignment: 'Tarea/TP',
    class: 'Clase',
    holiday: 'Feriado',
    meeting: 'Reunión'
  };
  return typeNames[type];
};

export const getEventTypeColor = (type: EventType): string => {
  const colors = {
    exam: 'bg-red-500',
    assignment: 'bg-yellow-500',
    class: 'bg-blue-500',
    holiday: 'bg-green-500',
    meeting: 'bg-purple-500'
  };
  return colors[type];
};

export const getUserPermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'admin':
      return {
        canEditCalendar: true,
        canEditSubjects: true,
        canManageUsers: true,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canViewAllYears: true,
        canAssignTeachers: true
      };
    case 'teacher':
      return {
        canEditCalendar: true, // Solo para sus materias
        canEditSubjects: false, // Solo ver
        canManageUsers: false,
        canUploadDocuments: true,
        canDeleteDocuments: true, // Solo sus documentos
        canViewAllYears: false, // Solo sus materias
        canAssignTeachers: false
      };
    case 'student':
      return {
        canEditCalendar: false,
        canEditSubjects: false,
        canManageUsers: false,
        canUploadDocuments: true,
        canDeleteDocuments: false,
        canViewAllYears: false, // Solo su año
        canAssignTeachers: false
      };
    default:
      return {
        canEditCalendar: false,
        canEditSubjects: false,
        canManageUsers: false,
        canUploadDocuments: false,
        canDeleteDocuments: false,
        canViewAllYears: false,
        canAssignTeachers: false
      };
  }
};
