# 🔐 Configuración de Google OAuth

## Variables de Entorno Necesarias

Para habilitar el inicio de sesión con Google, necesitas agregar las siguientes variables a tu archivo `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui

# Opcional: Restringir a dominios específicos (separados por coma)
ALLOWED_GOOGLE_DOMAINS=ejemplo.com,otroejem.com

# Opcional: Emails de administradores (separados por coma)
ADMIN_EMAILS=admin@ejemplo.com,otro@ejemplo.com
```

---

## 📋 Pasos para Obtener las Credenciales

### 1. Ir a Google Cloud Console
- Visita: https://console.cloud.google.com/

### 2. Crear un Proyecto (si no tienes uno)
- Clic en el selector de proyectos (arriba)
- Clic en "Nuevo Proyecto"
- Nombre: "Campus Virtual IPDVS" (o el que prefieras)
- Clic en "Crear"

### 3. Habilitar Google+ API
- En el menú lateral → "APIs y servicios" → "Biblioteca"
- Buscar "Google+ API"
- Clic en "Habilitar"

### 4. Configurar Pantalla de Consentimiento OAuth
- Menú lateral → "APIs y servicios" → "Pantalla de consentimiento de OAuth"
- Seleccionar "Externo" (o "Interno" si tienes Google Workspace)
- Completar:
  - **Nombre de la aplicación**: Campus Virtual IPDVS
  - **Correo de asistencia**: tu-email@ejemplo.com
  - **Dominios autorizados**: tu-dominio.com (si aplica)
  - **Correo del desarrollador**: tu-email@ejemplo.com
- Guardar y continuar
- En "Scopes", agregar:
  - `openid`
  - `email`
  - `profile`
- Guardar y continuar

### 5. Crear Credenciales OAuth 2.0
- Menú lateral → "APIs y servicios" → "Credenciales"
- Clic en "+ CREAR CREDENCIALES" → "ID de cliente de OAuth 2.0"
- Tipo de aplicación: **Aplicación web**
- Nombre: "Campus Virtual Web Client"
- **Orígenes de JavaScript autorizados**:
  ```
  http://localhost:3000
  https://tu-dominio.com
  ```
- **URIs de redireccionamiento autorizados**:
  ```
  http://localhost:3000/api/auth/callback/google
  https://tu-dominio.com/api/auth/callback/google
  ```
- Clic en "Crear"

### 6. Copiar las Credenciales
- Se mostrará un modal con:
  - **ID de cliente**: Copiar a `GOOGLE_CLIENT_ID`
  - **Secreto de cliente**: Copiar a `GOOGLE_CLIENT_SECRET`

---

## 🚀 Flujo de Autenticación Implementado

### Para Estudiantes (Registro con Google)

1. **Usuario hace clic en "Registrarse con Google"**
   - Se abre ventana de Google para seleccionar cuenta
   - Usuario autoriza la aplicación

2. **Sistema crea usuario automáticamente**
   - Rol: `student` (por defecto)
   - Año: `null` (sin asignar)
   - División: `null`

3. **Redirección a selección de año**
   - Usuario es redirigido a `/campus/auth/select-year`
   - Debe seleccionar su año (1° a 6°)
   - Opcionalmente puede indicar división (A, B, C, etc.)

4. **Auto-inscripción en materias**
   - Al seleccionar el año, se inscribe automáticamente en todas las materias activas de ese año
   - Redirige al dashboard

### Para Profesores/Admins (Login con Google)

1. **Usuario hace clic en "Iniciar sesión con Google"**
   - Se abre ventana de Google para seleccionar cuenta
   - Usuario autoriza la aplicación

2. **Sistema verifica el rol**
   - Si el email está en `ADMIN_EMAILS` → rol `admin`
   - Si no → rol `student` (puede ser cambiado manualmente en la BD)

3. **Redirección al dashboard**
   - Profesores y admins van directo al dashboard
   - No necesitan seleccionar año

---

## 🔒 Seguridad

### Restricción por Dominio
Si configuras `ALLOWED_GOOGLE_DOMAINS`, solo usuarios con emails de esos dominios podrán registrarse:

```env
ALLOWED_GOOGLE_DOMAINS=ipdvs.edu.ar,estudiantes.ipdvs.edu.ar
```

### Emails de Administradores
Los emails en `ADMIN_EMAILS` siempre tendrán rol `admin`, sin importar el dominio:

```env
ADMIN_EMAILS=director@ipdvs.edu.ar,admin@ipdvs.edu.ar
```

---

## 🧪 Probar en Desarrollo

1. Asegúrate de tener las variables en `.env.local`
2. Reinicia el servidor: `npm run dev`
3. Ve a: http://localhost:3000/campus/auth/login
4. Clic en "Iniciar sesión con Google"
5. Selecciona tu cuenta de Google
6. Si eres estudiante nuevo, selecciona tu año
7. ¡Listo! Deberías estar en el dashboard

---

## 📝 Notas Importantes

- **Desarrollo**: Usa `http://localhost:3000` en las URIs
- **Producción**: Usa tu dominio real (ej: `https://campus.ipdvs.edu.ar`)
- **Seguridad**: Nunca compartas tu `GOOGLE_CLIENT_SECRET`
- **Cambios**: Si cambias las URIs, actualiza en Google Cloud Console

---

## ❓ Problemas Comunes

### Error: "redirect_uri_mismatch"
- Verifica que la URI de redirección esté exactamente igual en Google Cloud Console
- Formato: `http://localhost:3000/api/auth/callback/google`

### Error: "Access blocked: This app's request is invalid"
- Completa la pantalla de consentimiento OAuth
- Agrega los scopes necesarios (openid, email, profile)

### Usuario no puede registrarse
- Verifica `ALLOWED_GOOGLE_DOMAINS` si está configurado
- Revisa los logs del servidor para más detalles

---

**¡Sistema de Google OAuth Implementado!** ✅
