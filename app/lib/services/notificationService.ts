import { supabaseAdmin } from '@/app/lib/supabaseClient';

export type NotificationType =
  | 'event_created'
  | 'important_event'
  | 'task_delivered'
  | 'unit_created'
  | 'section_created'
  | 'task_created';

interface NotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  details?: Record<string, any>;
}

export async function createNotification(payload: NotificationPayload) {
  await supabaseAdmin.from('notifications').insert([payload]);
}

// Notificar a profesores/administradores sobre eventos importantes (excepto al creador)
export async function notifyImportantEvent({ event, creatorId, professorIds, adminIds }: {
  event: any;
  creatorId: string;
  professorIds: string[];
  adminIds: string[];
}) {
  const recipients = [...professorIds, ...adminIds].filter(id => id !== creatorId);
  for (const user_id of recipients) {
    await createNotification({
      user_id,
      type: 'important_event',
      title: `Nuevo evento importante: ${event.title}`,
      message: `Se agregó el evento "${event.title}" para la fecha ${event.date}.`,
      details: { eventId: event.id }
    });
  }
}

// Notificar a profesor cuando un alumno entrega una tarea
export async function notifyTaskDelivered({ studentName, subjectName, unitName, professorId }: {
  studentName: string;
  subjectName: string;
  unitName: string;
  professorId: string;
}) {
  await createNotification({
    user_id: professorId,
    type: 'task_delivered',
    title: `Entrega de tarea de ${studentName}`,
    message: `${studentName} entregó una tarea en ${subjectName} - ${unitName}.`,
    details: { studentName, subjectName, unitName }
  });
}

// Notificar a estudiantes sobre nuevos eventos (excepto personales)
export async function notifyEventToStudents({ event, studentIds }: {
  event: any;
  studentIds: string[];
}) {
  if (event.is_personal) return;
  for (const user_id of studentIds) {
    await createNotification({
      user_id,
      type: 'event_created',
      title: `Nuevo evento: ${event.title}`,
      message: `Se agregó el evento "${event.title}" para la fecha ${event.date}.`,
      details: { eventId: event.id }
    });
  }
}

// Notificar a estudiantes sobre nuevas unidades/secciones/tareas
export async function notifyUnitOrTaskCreated({ type, title, studentIds, subjectName, unitName }: {
  type: 'unit_created' | 'section_created' | 'task_created';
  title: string;
  studentIds: string[];
  subjectName: string;
  unitName?: string;
}) {
  for (const user_id of studentIds) {
    await createNotification({
      user_id,
      type,
      title: `Nuevo ${type === 'unit_created' ? 'unidad' : type === 'section_created' ? 'sección' : 'tarea'}: ${title}`,
      message: `Se agregó "${title}" en ${subjectName}${unitName ? ' - ' + unitName : ''}.`,
      details: { subjectName, unitName }
    });
  }
}
