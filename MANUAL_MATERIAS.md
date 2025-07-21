# 📚 Sistema de Gestión de Materias - Manual de Uso

## 🎯 **Resumen del Sistema**

El sistema permite gestionar materias con un enfoque modular usando **unidades** y **contenido**. Los administradores y profesores asignados pueden crear, editar y organizar todo el contenido educativo.

---

## 🔐 **Permisos por Rol**

### **👑 Administrador (brunobarraud13@gmail.com)**
- ✅ **Acceso total** a todas las materias
- ✅ Crear, editar y eliminar unidades
- ✅ Gestionar todo tipo de contenido
- ✅ Subir y administrar documentos
- ✅ Asignar profesores a materias

### **👨‍🏫 Profesor**
- ✅ **Acceso completo** a las materias asignadas
- ✅ Crear y gestionar unidades de sus materias
- ✅ Publicar contenido y anuncios
- ✅ Subir documentos y recursos
- ❌ No puede editar materias de otros profesores

### **🎓 Estudiante**
- ✅ **Acceso de solo lectura** a materias de su año
- ✅ Ver contenido y descargar documentos
- ✅ Acceder al calendario de eventos
- ❌ No puede crear ni editar contenido

---

## 🏗️ **Estructura del Sistema**

```
📚 Materia
├── 📋 Información General
├── 📁 Unidades (1, 2, 3...)
│   ├── 📄 Documentos por unidad
│   └── 📝 Contenido específico
└── 💬 Contenido General
    ├── 📢 Anuncios
    ├── 📚 Recursos
    ├── 📝 Tareas
    └── 📄 Notas
```

---

## 🚀 **Cómo Usar el Sistema**

### **Paso 1: Acceder a una Materia**
1. Desde el dashboard, **haz clic en cualquier materia**
2. Verás 3 pestañas principales:
   - **Información General**: Estadísticas y descripción
   - **Unidades**: Contenido organizado por unidades
   - **Contenido**: Publicaciones generales

### **Paso 2: Crear Unidades (Solo Admin/Profesor)**
1. Ve a la pestaña **"Unidades"**
2. Haz clic en **"Nueva Unidad"**
3. Completa los datos:
   - **Número de Unidad**: 1, 2, 3...
   - **Título**: Ej: "Números Reales y Operaciones"
   - **Descripción**: Detalle del contenido de la unidad

### **Paso 3: Subir Documentos por Unidad**
1. En cada unidad, haz clic en **"Subir Archivo"**
2. **Arrastra y suelta** el archivo o selecciona uno
3. Agrega título y descripción
4. Los documentos quedan organizados por unidad

### **Paso 4: Crear Contenido General**
1. Ve a la pestaña **"Contenido"**
2. Haz clic en **"Nuevo Contenido"**
3. Selecciona el tipo:
   - **📢 Anuncio**: Para avisos importantes
   - **📚 Recurso**: Material de estudio
   - **📝 Tarea**: Asignaciones
   - **📄 Nota**: Información general
4. Opcionalmente, asigna a una unidad específica
5. Marca como **"fijado"** para destacarlo

---

## 📂 **Base de Datos Requerida**

Para que el sistema funcione completamente, necesitas ejecutar estas migraciones en Supabase:

### **1. Migración Principal**
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: supabase-roles-migration.sql
```

### **2. Migración de Unidades**
```sql
-- Ejecutar después de la principal
-- Archivo: supabase-units-migration.sql
```

---

## 🔧 **Configuración Técnica**

### **Variables de Entorno Requeridas**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
```

### **Rutas del Sistema**
- **Dashboard**: `/campus/dashboard`
- **Detalle de Materia**: `/campus/subjects/[id]`
- **APIs**: 
  - `/api/subjects/[id]/units`
  - `/api/subjects/[id]/content`
  - `/api/units/[id]`
  - `/api/content/[id]`

---

## 📱 **Funcionalidades Implementadas**

### ✅ **Completadas**
- ✅ Sistema de roles y permisos
- ✅ Navegación clickeable entre materias
- ✅ Gestión completa de unidades
- ✅ Sistema de contenido con tipos
- ✅ Subida de documentos con drag & drop
- ✅ Modales interactivos para gestión
- ✅ Organización por pestañas
- ✅ Estadísticas en tiempo real

### 🔄 **En Desarrollo**
- 🔄 Integración completa con Supabase
- 🔄 Sistema de archivos real
- 🔄 Notificaciones push
- 🔄 Búsqueda avanzada

---

## 🎯 **Ejemplo de Uso Práctico**

### **Escenario: Profesor de Matemática I**

1. **Crear Unidad 1**
   - Título: "Números Reales y Operaciones"
   - Descripción: "Introducción a los números reales..."

2. **Subir Materiales**
   - Teoría en PDF
   - Ejercicios prácticos
   - Presentación PowerPoint

3. **Publicar Anuncio**
   - Tipo: 📢 Anuncio
   - Título: "Examen Parcial - Unidad 1"
   - Contenido: "El examen se realizará el viernes..."
   - Fijar: ✅ Sí

4. **Agregar Tarea**
   - Tipo: 📝 Tarea
   - Asignar a: Unidad 1
   - Fecha límite en descripción

---

## 🚧 **Próximos Pasos**

1. **Ejecutar migraciones** en Supabase
2. **Probar con datos reales** 
3. **Crear usuarios de prueba** con diferentes roles
4. **Configurar almacenamiento** de archivos
5. **Implementar notificaciones**

---

## 📞 **Soporte**

Si necesitas ayuda:
1. Revisa la consola del navegador para errores
2. Verifica que las migraciones estén ejecutadas
3. Confirma las variables de entorno
4. Usa datos mock mientras configuras Supabase

**¡El sistema está listo para ser usado! 🎉**
