# Guía de Seguridad RLS - Campus Virtual

## 🔒 Resumen de Correcciones de Seguridad

Este documento detalla las correcciones críticas realizadas en las políticas RLS (Row Level Security) de Supabase para el Campus Virtual del IPDVS.

---

## 🚨 Problemas Críticos Corregidos

### 1. **Política Extremadamente Peligrosa Eliminada**
- **Tabla**: `messages`
- **Política**: `allow select all` (qual: "true")
- **Riesgo**: Permitía acceso a TODOS los mensajes sin autenticación
- **Acción**: **ELIMINADA PERMANENTEMENTE**

### 2. **Acceso Público a Usuarios Eliminado**
- **Tabla**: `users`
- **Política**: `Allow read for all` (qual: "true")
- **Riesgo**: Permitía ver información de todos los usuarios sin autenticación
- **Acción**: **ELIMINADA PERMANENTEMENTE**

### 3. **Políticas Duplicadas Consolidadas**
- **Tablas afectadas**: `users`, `messages`, `conversation_participants`
- **Problema**: Múltiples políticas conflictivas causaban comportamiento impredecible
- **Acción**: Eliminadas y reemplazadas por políticas únicas y claras

### 4. **Políticas DELETE Agregadas**
- **Tablas**: `messages`, `conversations`, `conversation_participants`
- **Problema**: Faltaban políticas para operaciones DELETE
- **Acción**: Políticas DELETE creadas con restricciones apropiadas

---

## ✅ Nuevas Políticas RLS Implementadas

### Tabla: `users`

| Operación | Política | Descripción |
|-----------|----------|-------------|
| **SELECT** | `users_select_secure` | Usuarios ven solo su info; admins ven todo |
| **INSERT** | `users_insert_admin_only` | Solo admins pueden crear usuarios |
| **UPDATE** | `users_update_own` | Usuarios solo pueden actualizar su propia info |
| **DELETE** | `users_delete_admin_only` | Solo admins pueden eliminar usuarios |

**Reglas de Seguridad:**
- ✅ Requiere autenticación para todas las operaciones
- ✅ Los usuarios solo acceden a sus propios datos
- ✅ Los admins tienen control total
- ❌ No hay acceso público

---

### Tabla: `conversations`

| Operación | Política | Descripción |
|-----------|----------|-------------|
| **SELECT** | `conversations_select_participants` | Solo participantes activos ven la conversación |
| **INSERT** | `conversations_insert_authenticated` | Usuarios autenticados pueden crear conversaciones |
| **UPDATE** | `conversations_update_participants` | Solo participantes activos pueden actualizar |
| **DELETE** | `conversations_delete_creator_or_admin` | Solo creador o admins pueden eliminar |

**Reglas de Seguridad:**
- ✅ Solo participantes activos (`is_active = true`) tienen acceso
- ✅ El creador mantiene control sobre la conversación
- ✅ Los admins pueden moderar
- ❌ No se puede acceder a conversaciones ajenas

---

### Tabla: `conversation_participants`

| Operación | Política | Descripción |
|-----------|----------|-------------|
| **SELECT** | `participants_select_own` | Usuarios ven solo sus participaciones activas |
| **INSERT** | `participants_insert_self` | Usuarios pueden unirse a conversaciones |
| **UPDATE** | `participants_update_own` | Usuarios actualizan solo su participación |
| **DELETE** | `participants_delete_own` | Usuarios pueden salir de conversaciones |

**Reglas de Seguridad:**
- ✅ Solo se ven participaciones activas (`is_active = true`)
- ✅ Los usuarios controlan su propia participación
- ✅ Soft delete preferido (cambiar `is_active` a `false`)
- ❌ No se puede manipular participación de otros

---

### Tabla: `messages`

| Operación | Política | Descripción |
|-----------|----------|-------------|
| **SELECT** | `messages_select_participants_only` | Solo participantes activos ven mensajes |
| **INSERT** | `messages_insert_participants_only` | Solo participantes activos envían mensajes |
| **UPDATE** | `messages_update_own_only` | Solo el autor puede editar su mensaje |
| **DELETE** | `messages_delete_own_or_admin` | Solo autor o admins pueden eliminar |

**Reglas de Seguridad:**
- ✅ Solo participantes activos de la conversación tienen acceso
- ✅ El `sender_id` debe coincidir con el usuario autenticado
- ✅ Los mensajes están protegidos contra acceso no autorizado
- ❌ **NO HAY ACCESO PÚBLICO** (política peligrosa eliminada)

---

## 🛠️ Cómo Aplicar las Correcciones

### Paso 1: Backup de la Base de Datos
```bash
# Desde el dashboard de Supabase, crear un backup manual
# Settings > Database > Backups > Create backup
```

### Paso 2: Ejecutar el Script de Corrección
1. Abrir Supabase Dashboard
2. Ir a **SQL Editor**
3. Abrir el archivo `docs/fix-rls-security.sql`
4. Copiar y pegar el contenido completo
5. Ejecutar el script

### Paso 3: Verificar las Políticas
El script incluye queries de verificación al final que mostrarán:
- Todas las políticas creadas
- Nombres de políticas
- Operaciones permitidas (SELECT, INSERT, UPDATE, DELETE)
- Condiciones de cada política

### Paso 4: Probar el Sistema
Después de aplicar las correcciones, probar:

#### Como Estudiante:
```javascript
// Debe funcionar: Ver mis propios mensajes
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', myConversationId);

// Debe fallar: Ver mensajes de otras conversaciones
const { error } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', otherConversationId);
// error: "new row violates row-level security policy"
```

#### Como Profesor:
```javascript
// Debe funcionar: Crear conversación con estudiantes
const { data } = await supabase
  .from('conversations')
  .insert({ title: 'Consulta Matemática', created_by: myUserId });

// Debe funcionar: Enviar mensaje en mi conversación
const { data } = await supabase
  .from('messages')
  .insert({ 
    conversation_id: myConversationId,
    sender_id: myUserId,
    content: 'Hola'
  });
```

#### Como Admin:
```javascript
// Debe funcionar: Ver todos los usuarios
const { data } = await supabase
  .from('users')
  .select('*');

// Debe funcionar: Eliminar mensaje inapropiado
const { data } = await supabase
  .from('messages')
  .delete()
  .eq('id', messageId);
```

---

## 🔍 Verificación de Seguridad

### Checklist de Seguridad Post-Implementación

- [ ] **RLS habilitado** en todas las tablas críticas
- [ ] **No hay políticas públicas** (qual: "true") en tablas sensibles
- [ ] **Todas las políticas requieren autenticación** (TO authenticated)
- [ ] **Políticas DELETE implementadas** en todas las tablas
- [ ] **No hay políticas duplicadas** o conflictivas
- [ ] **Usuarios solo acceden a sus datos** (verificado con tests)
- [ ] **Admins tienen privilegios elevados** (verificado)
- [ ] **Participantes inactivos no tienen acceso** (verificado)

### Comandos de Verificación SQL

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'conversations', 'conversation_participants', 'messages');

-- Contar políticas por tabla
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'conversations', 'conversation_participants', 'messages')
GROUP BY tablename;

-- Buscar políticas peligrosas (no debería retornar nada)
SELECT tablename, policyname, qual
FROM pg_policies
WHERE qual = 'true'
AND tablename IN ('users', 'conversations', 'conversation_participants', 'messages');
```

---

## 📊 Comparación Antes/Después

### Tabla: `messages`

| Aspecto | Antes ❌ | Después ✅ |
|---------|----------|------------|
| Acceso público | Permitido (qual: "true") | **BLOQUEADO** |
| Políticas SELECT | 4 conflictivas | 1 clara y segura |
| Políticas INSERT | 3 conflictivas | 1 clara y segura |
| Políticas UPDATE | 2 duplicadas | 1 clara y segura |
| Políticas DELETE | 0 (faltante) | 1 implementada |
| Verificación de participante activo | Inconsistente | **Siempre requerida** |

### Tabla: `users`

| Aspecto | Antes ❌ | Después ✅ |
|---------|----------|------------|
| Acceso público | Permitido (qual: "true") | **BLOQUEADO** |
| Políticas SELECT | 5 conflictivas | 1 clara y segura |
| Control de admins | Inconsistente | **Claramente definido** |
| Políticas DELETE | 0 (faltante) | 1 implementada |

---

## 🚀 Mejores Prácticas Implementadas

### 1. **Principio de Menor Privilegio**
- Los usuarios solo tienen acceso a lo estrictamente necesario
- No hay acceso público a datos sensibles
- Cada rol tiene permisos específicos y limitados

### 2. **Defensa en Profundidad**
- RLS habilitado en todas las tablas
- Verificación de autenticación en todas las políticas
- Validación de participación activa en conversaciones
- Verificación de propiedad en operaciones de modificación

### 3. **Consistencia de Políticas**
- Una política por operación (SELECT, INSERT, UPDATE, DELETE)
- Nombres descriptivos y consistentes
- Condiciones claras y sin ambigüedades

### 4. **Auditoría y Trazabilidad**
- Las políticas permiten rastrear quién accede a qué
- Los admins tienen acceso para moderación
- Los logs de Supabase registran intentos de acceso denegados

---

## ⚠️ Advertencias Importantes

### 1. **No Deshabilitar RLS**
```sql
-- ❌ NUNCA HACER ESTO:
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

### 2. **No Crear Políticas Públicas**
```sql
-- ❌ NUNCA HACER ESTO:
CREATE POLICY "allow_all" ON messages
    FOR SELECT
    USING (true);
```

### 3. **No Omitir Verificación de Participante Activo**
```sql
-- ❌ MAL: No verifica is_active
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.user_id = auth.uid()
    )
)

-- ✅ BIEN: Verifica is_active
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.user_id = auth.uid()
        AND cp.is_active = true
    )
)
```

---

## 📞 Soporte y Mantenimiento

### Monitoreo Continuo
- Revisar logs de Supabase regularmente
- Monitorear intentos de acceso denegados
- Auditar cambios en políticas RLS

### Actualizaciones Futuras
- Documentar cualquier cambio en políticas
- Probar exhaustivamente antes de aplicar en producción
- Mantener backups antes de modificaciones

### Contacto
- **Desarrollador**: Bruno Barraud
- **Proyecto**: Campus Virtual IPDVS
- **Fecha de Implementación**: Enero 2026

---

## 📚 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Access Control Guidelines](https://owasp.org/www-project-top-ten/)

---

**✅ Estado**: Correcciones implementadas y documentadas
**🔒 Nivel de Seguridad**: Alto
**📅 Última Actualización**: Enero 2026
