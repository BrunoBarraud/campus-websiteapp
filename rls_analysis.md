# Análisis de Políticas RLS - Sistema de Mensajería

## Problemas Identificados

### 1. Tabla `users` - Políticas Conflictivas

**Problema:** Múltiples políticas SELECT conflictivas:
- `Allow read for all` (qual: "true") - Permite acceso total
- `Allow read for authenticated` (qual: "auth.role() = 'authenticated'")
- `Allow read users for authenticated` (qual: "auth.uid() IS NOT NULL")
- `users_select_own` (qual: "auth.uid() = id")
- `users_select_policy` (qual: "auth.uid() IS NULL OR auth.uid() = id OR get_user_role() = ANY...")

**Impacto:** Las políticas se superponen y pueden causar comportamiento impredecible.

### 2. Tabla `conversation_participants` - Políticas Duplicadas

**Problema:** Políticas duplicadas para INSERT y UPDATE:
- INSERT: `Allow authenticated users to insert` y `Users can join conversations`
- UPDATE: `Allow participants to update their records` y `Users can update their own participation`
- SELECT: `Allow access to own active participation` y `Allow participants to view their records`

**Impacto:** Redundancia que puede causar conflictos de evaluación.

### 3. Tabla `messages` - Políticas Críticas Conflictivas

**Problema Crítico:** Múltiples políticas conflictivas y una política extremadamente permisiva:

#### Políticas INSERT Conflictivas:
- `Allow insert for participants` (requiere `is_active = true`)
- `Allow insert messages for participants` (NO requiere `is_active = true`)
- `Users can send messages to their conversations` (requiere `is_active = true` Y `sender_id = auth.uid()`)

#### Políticas SELECT Conflictivas:
- `Allow read messages for participants` (NO requiere `is_active = true`)
- `Allow select for participants` (requiere `is_active = true`)
- `Users can view messages from their conversations` (requiere `is_active = true`)
- **`allow select all`** (qual: "true") - **EXTREMADAMENTE PELIGROSA**

#### Políticas UPDATE Duplicadas:
- `Allow update own messages` (sender_id = auth.uid())
- `Users can update their own messages` (sender_id = auth.uid()) - DUPLICADA

**Impacto:** 
- La política `allow select all` permite acceso total a TODOS los mensajes sin autenticación
- Las políticas conflictivas causan comportamiento impredecible
- Falta de políticas DELETE para mensajes

### 4. Problemas Específicos Identificados

#### A. Políticas de `users` muy permisivas
- La política `Allow read for all` (qual: "true") permite acceso total sin autenticación
- Esto puede ser un riesgo de seguridad

#### B. Inconsistencia en `conversation_participants`
- La política SELECT `Allow access to own active participation` requiere `is_active = true`
- Pero la política `Allow participants to view their records` no tiene esta restricción
- Esto puede causar resultados inconsistentes

#### C. Falta de políticas DELETE
- No hay políticas DELETE para `conversations` ni `conversation_participants`
- Esto impedirá eliminar conversaciones o participantes

## Recomendaciones de Corrección URGENTES

### 1. **CRÍTICO - Eliminar política peligrosa de `messages`**
**ELIMINAR INMEDIATAMENTE:** `allow select all` (qual: "true")
- Esta política permite acceso total a todos los mensajes sin autenticación
- Es un riesgo de seguridad crítico

### 2. Simplificar y consolidar políticas de `messages`
**Mantener solo estas políticas:**
- SELECT: `Users can view messages from their conversations` (requiere `is_active = true`)
- INSERT: `Users can send messages to their conversations` (más restrictiva)
- UPDATE: `Users can update their own messages` (eliminar duplicada)
- AGREGAR: Política DELETE para el autor del mensaje

### 3. Simplificar políticas de `users`
Eliminar políticas redundantes, especialmente `Allow read for all`:
- Mantener solo políticas específicas para usuarios autenticados
- Eliminar acceso público total

### 4. Consolidar políticas de `conversation_participants`
Eliminar duplicados y mantener consistencia con `is_active = true`:
- Una política SELECT (con `is_active = true`)
- Una política INSERT
- Una política UPDATE
- Agregar política DELETE

### 5. Agregar políticas DELETE faltantes
- `messages`: Solo autor o admin pueden eliminar
- `conversations`: Solo creador puede eliminar
- `conversation_participants`: Solo el propio usuario puede salir

## Próximos Pasos

1. Obtener políticas RLS de la tabla `messages`
2. Crear script de corrección de políticas RLS
3. Implementar políticas simplificadas y consistentes
4. Probar el sistema de mensajería después de las correcciones