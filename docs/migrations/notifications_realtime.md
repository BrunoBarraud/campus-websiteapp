# Migración: Notificaciones en Tiempo Real

## 1. Crear tabla de notificaciones

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('content_added', 'assignment_created', 'assignment_graded', 'forum_reply', 'announcement', 'approval_status')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para mejor rendimiento
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
```

## 2. Habilitar Realtime para la tabla

```sql
-- Habilitar realtime para la tabla notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## 3. Función para crear notificaciones

```sql
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID 
LANGUAGE plpgsql
AS $func$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$func$;
```

## 4. Trigger para notificar cuando se agrega contenido a una unidad

```sql
CREATE OR REPLACE FUNCTION notify_content_added() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $func$
DECLARE
  v_unit RECORD;
  v_student RECORD;
BEGIN
  -- Obtener info de la unidad y materia
  SELECT su.*, s.name as subject_name, s.year, s.division
  INTO v_unit
  FROM subject_units su
  JOIN subjects s ON s.id = su.subject_id
  WHERE su.id = NEW.unit_id;
  
  -- Notificar a todos los estudiantes inscriptos en la materia
  FOR v_student IN 
    SELECT ss.student_id 
    FROM student_subjects ss 
    WHERE ss.subject_id = v_unit.subject_id 
    AND ss.is_active = true
  LOOP
    PERFORM create_notification(
      v_student.student_id,
      'content_added',
      'Nuevo contenido en ' || v_unit.subject_name,
      'Se agregó "' || NEW.title || '" en la unidad "' || v_unit.title || '"',
      '/campus/student/subjects/' || v_unit.subject_id,
      jsonb_build_object('subject_id', v_unit.subject_id, 'unit_id', NEW.unit_id, 'content_id', NEW.id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trigger_notify_content_added
AFTER INSERT ON subject_content
FOR EACH ROW
EXECUTE FUNCTION notify_content_added();
```

## 5. Trigger para notificar cuando se crea una tarea

```sql
CREATE OR REPLACE FUNCTION notify_assignment_created() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $func$
DECLARE
  v_subject RECORD;
  v_student RECORD;
BEGIN
  -- Obtener info de la materia
  SELECT * INTO v_subject FROM subjects WHERE id = NEW.subject_id;
  
  -- Notificar a todos los estudiantes inscriptos
  FOR v_student IN 
    SELECT ss.student_id 
    FROM student_subjects ss 
    WHERE ss.subject_id = NEW.subject_id 
    AND ss.is_active = true
  LOOP
    PERFORM create_notification(
      v_student.student_id,
      'assignment_created',
      'Nueva tarea en ' || v_subject.name,
      'Se asignó "' || NEW.title || '" con fecha de entrega ' || to_char(NEW.due_date, 'DD/MM/YYYY'),
      '/campus/student/subjects/' || NEW.subject_id || '/assignments/' || NEW.id,
      jsonb_build_object('subject_id', NEW.subject_id, 'assignment_id', NEW.id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trigger_notify_assignment_created
AFTER INSERT ON assignments
FOR EACH ROW
EXECUTE FUNCTION notify_assignment_created();
```

## Notas

- Las notificaciones se crean automáticamente cuando:
  - Se agrega contenido a una unidad
  - Se crea una nueva tarea
- Los estudiantes reciben notificaciones en tiempo real sin recargar la página
- Las notificaciones se pueden marcar como leídas
