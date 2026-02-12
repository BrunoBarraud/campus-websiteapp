# Migración: Sistema de Soporte y Modo Mantenimiento

## 1. Tabla de configuración del sitio (para modo mantenimiento)

```sql
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insertar configuración inicial
INSERT INTO site_config (key, value) VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "Estamos realizando mejoras en el Campus. Volvemos pronto.", "estimated_end": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

## 2. Tabla de tickets de soporte

```sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('error', 'sugerencia', 'consulta', 'otro')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  screenshot_url TEXT,
  admin_response TEXT,
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
```

## 3. Función para actualizar updated_at automáticamente

```sql
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trigger_update_support_ticket_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_ticket_timestamp();
```

## Notas

- **Modo mantenimiento**: Se controla desde `site_config` con la key `maintenance_mode`
- **Tickets de soporte**: Los usuarios pueden crear tickets, los admins pueden responder
- El admin puede activar/desactivar mantenimiento desde el panel de admin
