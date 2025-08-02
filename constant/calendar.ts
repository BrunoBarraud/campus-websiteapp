// 📅 Configuración del Sistema de Calendario

import { EventType, EventVisibility } from "@/lib/types";

// 🎯 Configuración de tipos de eventos y visibilidad
export const CALENDAR_CONFIG = {
  // Tipos de eventos disponibles por rol
  EVENT_TYPES: {
    ADMIN: ["exam", "assignment", "class", "holiday", "meeting"] as EventType[],
    TEACHER: ["exam", "assignment", "class", "meeting"] as EventType[],
    STUDENT: ["personal"] as EventType[],
  },

  // Opciones de visibilidad por rol
  VISIBILITY_OPTIONS: {
    ADMIN: [
      {
        value: "public" as EventVisibility,
        label: "Público (Todos)",
        description: "Visible para todos los usuarios",
      },
      {
        value: "students" as EventVisibility,
        label: "Estudiantes",
        description: "Solo visible para estudiantes",
      },
      {
        value: "teachers" as EventVisibility,
        label: "Profesores",
        description: "Solo visible para profesores",
      },
      {
        value: "private" as EventVisibility,
        label: "Privado",
        description: "Solo visible para ti",
      },
    ],
    TEACHER: [
      {
        value: "public" as EventVisibility,
        label: "Público (Todos)",
        description: "Visible para todos los usuarios",
      },
      {
        value: "students" as EventVisibility,
        label: "Para Estudiantes",
        description: "Solo visible para estudiantes",
      },
      {
        value: "private" as EventVisibility,
        label: "Privado",
        description: "Solo visible para ti",
      },
    ],
    STUDENT: [
      {
        value: "private" as EventVisibility,
        label: "Personal",
        description: "Solo visible para ti",
      },
    ],
  },

  // Colores por tipo de evento
  EVENT_COLORS: {
    exam: "bg-red-500 text-white",
    assignment: "bg-yellow-500 text-white",
    class: "bg-blue-500 text-white",
    holiday: "bg-green-500 text-white",
    meeting: "bg-purple-500 text-white",
    personal: "bg-indigo-500 text-white",
  },

  // Íconos por tipo de evento
  EVENT_ICONS: {
    exam: "📝",
    assignment: "📋",
    class: "📚",
    holiday: "🏖️",
    meeting: "👥",
    personal: "📅",
  },

  // Configuración de permisos
  PERMISSIONS: {
    CAN_CREATE_EVENTS: {
      admin: true,
      teacher: true,
      student: true, // Solo eventos personales
    },
    CAN_EDIT_OWN_EVENTS: {
      admin: true,
      teacher: true,
      student: true,
    },
    CAN_DELETE_OWN_EVENTS: {
      admin: true,
      teacher: true,
      student: true,
    },
    CAN_EDIT_ALL_EVENTS: {
      admin: true,
      teacher: false,
      student: false,
    },
  },
};

// 🛠️ Utilidades para el calendario
export const CalendarUtils = {
  // Obtener tipos de eventos disponibles para un rol
  getEventTypesForRole: (role: string): EventType[] => {
    const roleKey =
      role.toUpperCase() as keyof typeof CALENDAR_CONFIG.EVENT_TYPES;
    return CALENDAR_CONFIG.EVENT_TYPES[roleKey] || [];
  },

  // Obtener opciones de visibilidad para un rol
  getVisibilityOptionsForRole: (role: string) => {
    const roleKey =
      role.toUpperCase() as keyof typeof CALENDAR_CONFIG.VISIBILITY_OPTIONS;
    return CALENDAR_CONFIG.VISIBILITY_OPTIONS[roleKey] || [];
  },

  // Verificar si un usuario puede crear eventos
  canCreateEvents: (role: string): boolean => {
    return (
      CALENDAR_CONFIG.PERMISSIONS.CAN_CREATE_EVENTS[
        role as keyof typeof CALENDAR_CONFIG.PERMISSIONS.CAN_CREATE_EVENTS
      ] || false
    );
  },

  // Verificar si un usuario puede editar sus propios eventos
  canEditOwnEvents: (role: string): boolean => {
    return (
      CALENDAR_CONFIG.PERMISSIONS.CAN_EDIT_OWN_EVENTS[
        role as keyof typeof CALENDAR_CONFIG.PERMISSIONS.CAN_EDIT_OWN_EVENTS
      ] || false
    );
  },

  // Verificar si un usuario puede editar todos los eventos
  canEditAllEvents: (role: string): boolean => {
    return (
      CALENDAR_CONFIG.PERMISSIONS.CAN_EDIT_ALL_EVENTS[
        role as keyof typeof CALENDAR_CONFIG.PERMISSIONS.CAN_EDIT_ALL_EVENTS
      ] || false
    );
  },

  // Obtener color para un tipo de evento
  getEventColor: (type: EventType): string => {
    return CALENDAR_CONFIG.EVENT_COLORS[type] || "bg-gray-500 text-white";
  },

  // Obtener ícono para un tipo de evento
  getEventIcon: (type: EventType): string => {
    return CALENDAR_CONFIG.EVENT_ICONS[type] || "📅";
  },

  // Formatear fecha para display
  formatEventDate: (date: string): string => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Verificar si un evento es próximo (en los próximos 7 días)
  isUpcomingEvent: (date: string): boolean => {
    const eventDate = new Date(date);
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    return eventDate >= today && eventDate <= sevenDaysFromNow;
  },

  // Obtener eventos del mes actual
  getCurrentMonthEvents: (events: any[]): any[] => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  },
};

// 📋 Mensajes del sistema
export const CALENDAR_MESSAGES = {
  NO_EVENTS: "No hay eventos programados",
  LOADING_EVENTS: "Cargando eventos...",
  EVENT_CREATED: "Evento creado exitosamente",
  EVENT_UPDATED: "Evento actualizado exitosamente",
  EVENT_DELETED: "Evento eliminado exitosamente",
  ERROR_CREATING: "Error al crear el evento",
  ERROR_UPDATING: "Error al actualizar el evento",
  ERROR_DELETING: "Error al eliminar el evento",
  PERMISSION_DENIED: "No tienes permisos para realizar esta acción",
  INVALID_DATE: "La fecha seleccionada no es válida",
  FUTURE_DATE_REQUIRED: "La fecha debe ser futura",
  REQUIRED_FIELDS: "Por favor completa todos los campos requeridos",
};
