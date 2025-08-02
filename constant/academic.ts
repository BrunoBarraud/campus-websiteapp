// 📚 Configuración Académica del IPDVS
// Constantes académicas centralizadas para evitar hardcodeo

export const ACADEMIC_CONFIG = {
  // Configuración de la institución
  INSTITUTION: {
    name: 'IPDVS',
    fullName: 'Instituto Privado Domingo Victorio Sarmiento',
    logo: '/images/ipdvs-logo.png',
    contactEmail: 'soporte@ipdvs.edu.ar',
    supportEmail: 'soporte@ipdvs.edu.ar'
  },

  // Años académicos disponibles
  ACADEMIC_YEARS: [1, 2, 3, 4, 5, 6] as const,
  
  // Semestres disponibles
  SEMESTERS: [1, 2] as const,

  // Divisiones de curso disponibles
  DIVISIONS: ['A', 'B', 'C', 'D', 'E'] as const,

  // Configuración de roles
  ROLES: {
    ADMIN: 'admin',
    TEACHER: 'teacher', 
    STUDENT: 'student'
  } as const,

  // Nombres de roles en español
  ROLE_NAMES: {
    admin: 'Administrador',
    teacher: 'Profesor',
    student: 'Estudiante'
  } as const,

  // Configuración de archivos
  FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ],
    SIZE_UNITS: ['Bytes', 'KB', 'MB', 'GB'] as const
  },

  // Configuración de calendario
  CALENDAR: {
    DAY_NAMES: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const,
    MONTH_NAMES: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ] as const
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    TYPES: {
      TASK: 'task',
      ANNOUNCEMENT: 'announcement', 
      SYSTEM: 'system',
      MESSAGE: 'message',
      GRADE: 'grade'
    } as const,
    DEFAULT_LIMIT: 20
  },

  // Configuración de conversaciones
  CONVERSATIONS: {
    TYPES: {
      DIRECT: 'direct',
      GROUP: 'group'
    } as const
  }
} as const;

// Funciones de utilidad para manejar años académicos
export const AcademicUtils = {
  // Generar opciones de años para selects
  getYearOptions: () => {
    return ACADEMIC_CONFIG.ACADEMIC_YEARS.map(year => ({
      value: year.toString(),
      label: `${year}° Año`,
      shortLabel: `${year}°`
    }));
  },

  // Generar opciones de semestres para selects
  getSemesterOptions: () => {
    return ACADEMIC_CONFIG.SEMESTERS.map(semester => ({
      value: semester.toString(),
      label: `${semester}° Semestre`,
      shortLabel: `${semester}°`
    }));
  },

  // Generar opciones de divisiones para selects
  getDivisionOptions: () => {
    return ACADEMIC_CONFIG.DIVISIONS.map(division => ({
      value: division,
      label: `División ${division}`,
      shortLabel: division
    }));
  },

  // Generar opciones de divisiones por año académico
  getDivisionOptionsByYear: (year: number) => {
    // Los años 5° y 6° no tienen divisiones
    if (year === 5 || year === 6) {
      return [];
    }
    // Los años 1° a 4° tienen divisiones A y B
    return ACADEMIC_CONFIG.DIVISIONS.map(division => ({
      value: division,
      label: `División ${division}`,
      shortLabel: division
    }));
  },

  // Verificar si un año académico tiene divisiones
  yearHasDivisions: (year: number): boolean => {
    return year >= 1 && year <= 4;
  },

  // Generar opciones de roles para selects
  getRoleOptions: () => {
    return Object.entries(ACADEMIC_CONFIG.ROLE_NAMES).map(([key, name]) => ({
      value: key,
      label: name
    }));
  },

  // Formatear año académico
  formatYear: (year: number) => `${year}° Año`,

  // Formatear semestre
  formatSemester: (semester: number) => `${semester}° Semestre`,

  // Formatear división
  formatDivision: (division: string) => `División ${division}`,

  // Validar año académico
  isValidYear: (year: number): boolean => {
    return ACADEMIC_CONFIG.ACADEMIC_YEARS.includes(year as any);
  },

  // Validar semestre
  isValidSemester: (semester: number): boolean => {
    return ACADEMIC_CONFIG.SEMESTERS.includes(semester as any);
  },

  // Validar división
  isValidDivision: (division: string): boolean => {
    return ACADEMIC_CONFIG.DIVISIONS.includes(division as any);
  },

  // Validar división según año académico
  isValidDivisionForYear: (division: string, year: number): boolean => {
    // Los años 5° y 6° no deben tener división
    if (year === 5 || year === 6) {
      return division === '' || division === null || division === undefined;
    }
    // Los años 1° a 4° deben tener división válida
    return ACADEMIC_CONFIG.DIVISIONS.includes(division as any);
  },

  // Formatear tamaño de archivo
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ACADEMIC_CONFIG.FILE.SIZE_UNITS;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Obtener nombre del rol
  getRoleName: (role: string): string => {
    return ACADEMIC_CONFIG.ROLE_NAMES[role as keyof typeof ACADEMIC_CONFIG.ROLE_NAMES] || role;
  }
};

// Tipos TypeScript para mayor seguridad
export type AcademicYear = typeof ACADEMIC_CONFIG.ACADEMIC_YEARS[number];
export type Semester = typeof ACADEMIC_CONFIG.SEMESTERS[number];
export type Division = typeof ACADEMIC_CONFIG.DIVISIONS[number];
export type Role = typeof ACADEMIC_CONFIG.ROLES[keyof typeof ACADEMIC_CONFIG.ROLES];
export type NotificationType = typeof ACADEMIC_CONFIG.NOTIFICATIONS.TYPES[keyof typeof ACADEMIC_CONFIG.NOTIFICATIONS.TYPES];
export type ConversationType = typeof ACADEMIC_CONFIG.CONVERSATIONS.TYPES[keyof typeof ACADEMIC_CONFIG.CONVERSATIONS.TYPES];
