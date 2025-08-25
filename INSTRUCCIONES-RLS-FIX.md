# 🚨 CORRECCIÓN CRÍTICA - Políticas RLS del Sistema de Mensajería

## ⚠️ PROBLEMA IDENTIFICADO

El sistema de mensajería no funciona en tiempo real debido a **políticas RLS conflictivas y peligrosas** en Supabase:

- **CRÍTICO**: Política `allow select all` permite acceso total a todos los mensajes sin autenticación
- Múltiples políticas conflictivas causan comportamiento impredecible
- Las suscripciones en tiempo real están bloqueadas

**NOTA**: El script ha sido actualizado para manejar políticas existentes sin generar errores de duplicación.

## 🔧 SOLUCIÓN

### Paso 1: Acceder al SQL Editor de Supabase
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva consulta

### Paso 2: Ejecutar el Script de Corrección
1. Copia todo el contenido del archivo `fix-messaging-rls.sql`
2. Pégalo en el SQL Editor
3. Haz clic en **Run** para ejecutar

### Paso 3: Verificar la Corrección
El script incluye verificaciones automáticas que mostrarán:
- Lista de políticas actualizadas
- Mensaje de confirmación

## 📋 QUÉ HACE EL SCRIPT

### ❌ ELIMINA (Políticas Peligrosas):
- `allow select all` - **EXTREMADAMENTE PELIGROSA**
- `Allow read for all` - Acceso público total
- Políticas duplicadas y conflictivas

### ✅ CREA (Políticas Seguras):
- **messages_select_participants**: Solo participantes activos ven mensajes
- **messages_insert_participants**: Solo participantes activos envían mensajes
- **messages_update_own**: Solo autor actualiza sus mensajes
- **messages_delete_own**: Solo autor elimina sus mensajes
- **participants_select_own**: Solo ver participaciones propias
- **participants_insert_authenticated**: Usuarios autenticados se unen
- **participants_update_own**: Solo actualizar participación propia
- **participants_delete_own**: Solo salir de conversaciones propias

## 🎯 RESULTADO ESPERADO

Después de ejecutar el script:
- ✅ Mensajes aparecerán en tiempo real
- ✅ No más contenido de chat anterior al cambiar conversaciones
- ✅ Seguridad mejorada (sin acceso público a mensajes)
- ✅ Suscripciones de Supabase funcionarán correctamente

## 🚀 SIGUIENTE PASO

Una vez ejecutado el script:
1. Regresa a la aplicación
2. Prueba el sistema de mensajería
3. Los mensajes deberían aparecer instantáneamente
4. El cambio entre chats debería ser limpio

---

**⚡ URGENTE**: Este script corrige un problema crítico de seguridad y funcionalidad. Ejecutar lo antes posible.