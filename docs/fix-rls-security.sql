-- ============================================================================
-- SCRIPT DE CORRECCIÓN DE SEGURIDAD RLS - CAMPUS VIRTUAL
-- ============================================================================
-- Este script corrige los problemas críticos de seguridad identificados en
-- las políticas RLS (Row Level Security) de Supabase.
--
-- ADVERTENCIA: Este script eliminará políticas existentes y creará nuevas.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Fecha: Enero 2026
-- Autor: Bruno Barraud
-- ============================================================================

-- ============================================================================
-- PASO 1: ELIMINAR POLÍTICAS PELIGROSAS Y DUPLICADAS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabla: users
-- Problema: Múltiples políticas conflictivas y acceso público total
-- ---------------------------------------------------------------------------

-- Eliminar política CRÍTICA que permite acceso sin autenticación
DROP POLICY IF EXISTS "Allow read for all" ON users;

-- Eliminar políticas duplicadas/redundantes
DROP POLICY IF EXISTS "Allow read for authenticated" ON users;
DROP POLICY IF EXISTS "Allow read users for authenticated" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Eliminar otras políticas existentes para reconstruir
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;

-- ---------------------------------------------------------------------------
-- Tabla: messages
-- Problema: Política EXTREMADAMENTE PELIGROSA que permite acceso total
-- ---------------------------------------------------------------------------

-- CRÍTICO: Eliminar política que permite acceso sin autenticación
DROP POLICY IF EXISTS "allow select all" ON messages;

-- Eliminar políticas duplicadas de SELECT
DROP POLICY IF EXISTS "Allow read messages for participants" ON messages;
DROP POLICY IF EXISTS "Allow select for participants" ON messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;

-- Eliminar políticas duplicadas de INSERT
DROP POLICY IF EXISTS "Allow insert for participants" ON messages;
DROP POLICY IF EXISTS "Allow insert messages for participants" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

-- Eliminar políticas duplicadas de UPDATE
DROP POLICY IF EXISTS "Allow update own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Eliminar políticas de DELETE si existen
DROP POLICY IF EXISTS "Allow delete own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- ---------------------------------------------------------------------------
-- Tabla: conversation_participants
-- Problema: Políticas duplicadas e inconsistentes
-- ---------------------------------------------------------------------------

-- Eliminar políticas duplicadas de SELECT
DROP POLICY IF EXISTS "Allow access to own active participation" ON conversation_participants;
DROP POLICY IF EXISTS "Allow participants to view their records" ON conversation_participants;

-- Eliminar políticas duplicadas de INSERT
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;

-- Eliminar políticas duplicadas de UPDATE
DROP POLICY IF EXISTS "Allow participants to update their records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;

-- Eliminar políticas de DELETE si existen
DROP POLICY IF EXISTS "Allow participants to leave" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

-- ---------------------------------------------------------------------------
-- Tabla: conversations
-- Problema: Falta de políticas DELETE
-- ---------------------------------------------------------------------------

-- Eliminar políticas existentes para reconstruir
DROP POLICY IF EXISTS "Allow read for participants" ON conversations;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON conversations;
DROP POLICY IF EXISTS "Allow update for participants" ON conversations;
DROP POLICY IF EXISTS "Allow delete for creator" ON conversations;

-- ============================================================================
-- PASO 2: CREAR POLÍTICAS RLS SEGURAS Y SIMPLIFICADAS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabla: users
-- Políticas: Solo usuarios autenticados pueden ver/editar su propia info
-- ---------------------------------------------------------------------------

-- SELECT: Los usuarios pueden ver su propia información y admins pueden ver todos
CREATE POLICY "users_select_secure" ON users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- INSERT: Solo admins pueden crear usuarios (el registro se hace por API)
CREATE POLICY "users_insert_admin_only" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- UPDATE: Los usuarios pueden actualizar su propia información
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE: Solo admins pueden eliminar usuarios
CREATE POLICY "users_delete_admin_only" ON users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- Tabla: conversations
-- Políticas: Solo participantes activos pueden acceder
-- ---------------------------------------------------------------------------

-- SELECT: Solo participantes activos pueden ver la conversación
CREATE POLICY "conversations_select_participants" ON conversations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- INSERT: Usuarios autenticados pueden crear conversaciones
CREATE POLICY "conversations_insert_authenticated" ON conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Solo participantes activos pueden actualizar
CREATE POLICY "conversations_update_participants" ON conversations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- DELETE: Solo el creador o admins pueden eliminar conversaciones
CREATE POLICY "conversations_delete_creator_or_admin" ON conversations
    FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- Tabla: conversation_participants
-- Políticas: Control estricto de participación
-- ---------------------------------------------------------------------------

-- SELECT: Los usuarios pueden ver sus propias participaciones activas
CREATE POLICY "participants_select_own" ON conversation_participants
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        AND is_active = true
    );

-- INSERT: Los usuarios pueden unirse a conversaciones
CREATE POLICY "participants_insert_self" ON conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND is_active = true
    );

-- UPDATE: Los usuarios pueden actualizar su propia participación
CREATE POLICY "participants_update_own" ON conversation_participants
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Los usuarios pueden salir de conversaciones (soft delete preferido)
CREATE POLICY "participants_delete_own" ON conversation_participants
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Tabla: messages
-- Políticas: Solo participantes activos pueden ver/enviar mensajes
-- ---------------------------------------------------------------------------

-- SELECT: Solo participantes activos de la conversación pueden ver mensajes
CREATE POLICY "messages_select_participants_only" ON messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- INSERT: Solo participantes activos pueden enviar mensajes
CREATE POLICY "messages_insert_participants_only" ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- UPDATE: Solo el autor puede editar su propio mensaje
CREATE POLICY "messages_update_own_only" ON messages
    FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- DELETE: Solo el autor o admins pueden eliminar mensajes
CREATE POLICY "messages_delete_own_or_admin" ON messages
    FOR DELETE
    TO authenticated
    USING (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ============================================================================
-- PASO 3: VERIFICAR QUE RLS ESTÁ HABILITADO EN TODAS LAS TABLAS
-- ============================================================================

-- Habilitar RLS en todas las tablas críticas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 4: VERIFICACIÓN DE POLÍTICAS CREADAS
-- ============================================================================

-- Listar todas las políticas de users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Listar todas las políticas de conversations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- Listar todas las políticas de conversation_participants
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'conversation_participants'
ORDER BY policyname;

-- Listar todas las políticas de messages
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- ============================================================================
-- PASO 5: NOTAS IMPORTANTES
-- ============================================================================

-- IMPORTANTE: Después de ejecutar este script:
-- 
-- 1. Verificar que todas las políticas se crearon correctamente
-- 2. Probar el sistema de mensajería con diferentes roles
-- 3. Verificar que los usuarios solo pueden ver sus propios datos
-- 4. Confirmar que los admins tienen acceso completo
-- 5. Revisar logs de Supabase para detectar errores de permisos
--
-- SEGURIDAD:
-- - Todas las políticas requieren autenticación (TO authenticated)
-- - No hay acceso público a datos sensibles
-- - Los usuarios solo pueden ver/editar sus propios datos
-- - Los admins tienen privilegios elevados donde es necesario
-- - Las políticas son consistentes y no conflictivas
--
-- TESTING:
-- - Probar login como estudiante, profesor y admin
-- - Intentar acceder a mensajes de otras conversaciones (debe fallar)
-- - Verificar que solo participantes activos pueden ver mensajes
-- - Confirmar que usuarios pueden salir de conversaciones
--
-- ============================================================================
