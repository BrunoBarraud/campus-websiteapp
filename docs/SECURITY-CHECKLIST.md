# ✅ Checklist de Seguridad - Campus Virtual

## 🚀 Pasos para Aplicar las Correcciones de Seguridad

### 1. **Preparación** (5 minutos)
- [ ] Leer `RLS-SECURITY-GUIDE.md` completo
- [ ] Crear backup manual en Supabase Dashboard
- [ ] Notificar a usuarios sobre mantenimiento (opcional)
- [ ] Tener acceso al SQL Editor de Supabase

### 2. **Aplicar Correcciones** (10 minutos)
- [ ] Abrir Supabase Dashboard → SQL Editor
- [ ] Copiar contenido de `docs/fix-rls-security.sql`
- [ ] Pegar en SQL Editor
- [ ] **Ejecutar el script completo**
- [ ] Verificar que no hay errores en la ejecución

### 3. **Verificación Inmediata** (5 minutos)
- [ ] Revisar output del script (debe mostrar las políticas creadas)
- [ ] Verificar que RLS está habilitado en todas las tablas
- [ ] Confirmar que no hay políticas con `qual = 'true'`
- [ ] Verificar conteo de políticas por tabla

### 4. **Testing Funcional** (15 minutos)

#### Como Estudiante:
- [ ] Login exitoso
- [ ] Ver solo mis conversaciones
- [ ] Enviar mensaje en mi conversación
- [ ] **NO** ver mensajes de otras conversaciones (debe fallar)
- [ ] Ver mi perfil
- [ ] **NO** ver perfiles de otros usuarios (debe fallar)

#### Como Profesor:
- [ ] Login exitoso
- [ ] Crear nueva conversación
- [ ] Agregar estudiantes a conversación
- [ ] Enviar mensajes
- [ ] Ver solo mis conversaciones

#### Como Admin:
- [ ] Login exitoso
- [ ] Ver todos los usuarios
- [ ] Eliminar mensaje inapropiado
- [ ] Eliminar conversación si es necesario
- [ ] Acceder a todas las funcionalidades

### 5. **Monitoreo Post-Implementación** (Continuo)
- [ ] Revisar logs de Supabase por errores RLS
- [ ] Monitorear intentos de acceso denegados
- [ ] Verificar performance (las políticas RLS pueden afectar)
- [ ] Recopilar feedback de usuarios

---

## 🔒 Verificaciones de Seguridad Críticas

### Políticas Eliminadas (CRÍTICO)
- [x] `allow select all` en `messages` - **ELIMINADA**
- [x] `Allow read for all` en `users` - **ELIMINADA**
- [x] Todas las políticas duplicadas - **ELIMINADAS**

### Políticas Creadas
- [x] 4 políticas en `users` (SELECT, INSERT, UPDATE, DELETE)
- [x] 4 políticas en `conversations` (SELECT, INSERT, UPDATE, DELETE)
- [x] 4 políticas en `conversation_participants` (SELECT, INSERT, UPDATE, DELETE)
- [x] 4 políticas en `messages` (SELECT, INSERT, UPDATE, DELETE)

### Verificaciones de Seguridad
- [x] Todas las políticas requieren autenticación (`TO authenticated`)
- [x] No hay acceso público a datos sensibles
- [x] Verificación de `is_active = true` en participantes
- [x] Verificación de propiedad en operaciones de modificación
- [x] Admins tienen privilegios elevados donde es necesario

---

## 🧪 Comandos de Testing

### Test 1: Verificar RLS Habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'conversations', 'conversation_participants', 'messages');
```
**Resultado esperado**: Todas las tablas deben tener `rowsecurity = true`

### Test 2: Buscar Políticas Peligrosas
```sql
SELECT tablename, policyname, qual
FROM pg_policies
WHERE qual = 'true'
AND tablename IN ('users', 'conversations', 'conversation_participants', 'messages');
```
**Resultado esperado**: 0 filas (no debe retornar nada)

### Test 3: Contar Políticas por Tabla
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'conversations', 'conversation_participants', 'messages')
GROUP BY tablename;
```
**Resultado esperado**: 4 políticas por tabla

### Test 4: Verificar Políticas DELETE
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE cmd = 'DELETE'
AND tablename IN ('users', 'conversations', 'conversation_participants', 'messages');
```
**Resultado esperado**: 4 políticas DELETE (una por tabla)

---

## 📊 Métricas de Éxito

### Antes de las Correcciones ❌
- Políticas peligrosas: **2** (acceso público total)
- Políticas duplicadas: **8+**
- Políticas DELETE: **0**
- Nivel de seguridad: **CRÍTICO**

### Después de las Correcciones ✅
- Políticas peligrosas: **0**
- Políticas duplicadas: **0**
- Políticas DELETE: **4**
- Nivel de seguridad: **ALTO**

---

## 🚨 Troubleshooting

### Problema: "Error: policy already exists"
**Solución**: El script ya fue ejecutado. Verificar políticas existentes.

### Problema: "Error: relation does not exist"
**Solución**: Verificar que las tablas existen en Supabase.

### Problema: Usuarios no pueden acceder a sus datos
**Solución**: 
1. Verificar que el usuario está autenticado
2. Verificar que `auth.uid()` retorna el ID correcto
3. Revisar logs de Supabase para ver qué política está fallando

### Problema: Performance lenta después de aplicar RLS
**Solución**:
1. Verificar que existen índices en columnas usadas en políticas
2. Agregar índices si es necesario:
```sql
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
```

---

## 📞 Contacto de Emergencia

Si encuentras problemas críticos después de aplicar las correcciones:

1. **Rollback inmediato**: Restaurar desde el backup creado
2. **Revisar logs**: Supabase Dashboard → Logs
3. **Contactar desarrollador**: Bruno Barraud
4. **Documentar el problema**: Crear issue en GitHub

---

## ✅ Confirmación Final

Una vez completados todos los pasos:

- [ ] Script SQL ejecutado sin errores
- [ ] Todas las verificaciones pasadas
- [ ] Testing funcional completado
- [ ] No hay errores en logs de Supabase
- [ ] Usuarios pueden acceder normalmente
- [ ] Sistema de mensajería funciona correctamente
- [ ] Documentación actualizada

**Fecha de implementación**: _______________
**Implementado por**: _______________
**Verificado por**: _______________

---

**🎉 ¡Seguridad RLS implementada exitosamente!**
