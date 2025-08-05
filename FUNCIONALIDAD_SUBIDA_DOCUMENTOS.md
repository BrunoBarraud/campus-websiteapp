# Funcionalidad de Subida de Documentos

## Resumen

Se ha implementado la funcionalidad para que los profesores puedan subir documentos cuando crean una nueva sección y seleccionan el tipo "documento".

## Cambios Implementados

### 🎯 **Frontend - UnitAccordion Component**

#### Mejoras en el Formulario:
- **Campo de archivo obligatorio** cuando se selecciona tipo "documento"
- **Validación visual** con iconos y mensajes informativos
- **Restricción de tipos de archivo**: PDF, Word, PowerPoint, Excel, TXT
- **Vista previa** del archivo seleccionado
- **Validación automática** antes de enviar

#### UX Mejorada:
- Placeholders dinámicos según el tipo de contenido
- Iconos en las opciones de tipo (📝 Contenido, 📄 Documento, ✅ Tarea)
- Limpieza automática de archivo cuando se cambia de "documento" a otro tipo
- Mensajes de éxito/error más descriptivos

### 🔧 **Backend - API de Contents**

#### Nuevas Capacidades:
- **Soporte para FormData**: Maneja tanto JSON como multipart/form-data
- **Subida a Supabase Storage**: Archivos se almacenan en bucket 'documents'
- **Nomenclatura única**: Timestamps + sanitización de nombres
- **URLs públicas**: Generación automática de URLs de descarga
- **Validación de archivos**: Verificación de tipos y tamaños

#### Estructura de Archivos:
```
documents/
  subjects/
    {subjectId}/
      units/
        {unitId}/
          {timestamp}-{fileName}
```

### 🗄️ **Base de Datos**

#### Nuevas Columnas en `subject_content`:
- `file_url` (TEXT): URL pública del archivo
- `file_name` (TEXT): Nombre original del archivo
- Índice para performance en búsquedas por file_url

## Flujo de Uso

### Para el Profesor:

1. **Crear Nueva Sección**:
   - Clic en "Agregar Sección" en cualquier unidad
   - Completar título

2. **Seleccionar Tipo "Documento"**:
   - Aparece mensaje: "Se requiere subir un archivo"
   - Campo de archivo se vuelve obligatorio

3. **Subir Archivo**:
   - Seleccionar archivo (PDF, Word, etc.)
   - Vista previa muestra el nombre del archivo
   - Agregar descripción del documento

4. **Enviar**:
   - Validación automática
   - Subida al servidor
   - Mensaje de confirmación

### Para los Estudiantes:

1. **Ver Documentos**:
   - Secciones de tipo documento muestran icono 📄
   - Badge azul con nombre del archivo
   - Botón de descarga visible

2. **Descargar**:
   - Clic en botón "Descargar"
   - Abre en nueva pestaña
   - Descarga directa del archivo

## Validaciones Implementadas

### Frontend:
- ✅ Título obligatorio
- ✅ Archivo obligatorio para tipo "documento"
- ✅ Fecha obligatoria para tipo "tarea"
- ✅ Tipos de archivo permitidos

### Backend:
- ✅ Verificación de permisos (solo profesor de la materia)
- ✅ Validación de FormData vs JSON
- ✅ Manejo de errores de subida
- ✅ Sanitización de nombres de archivo
- ✅ Generación de URLs únicas

## Tipos de Archivo Soportados

```typescript
accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
```

- **PDF**: Documentos y presentaciones
- **Word**: .doc, .docx
- **PowerPoint**: .ppt, .pptx  
- **Excel**: .xls, .xlsx
- **Texto**: .txt

## Configuración Requerida

### 1. Base de Datos:
```sql
-- Ejecutar: database-add-file-columns.sql
ALTER TABLE subject_content ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE subject_content ADD COLUMN IF NOT EXISTS file_name TEXT;
```

### 2. Supabase Storage:
- Bucket 'documents' debe existir
- Permisos de lectura pública configurados
- Políticas RLS para profesores

### 3. Variables de Entorno:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Estructura de Datos

### Objeto Section con Archivo:
```typescript
interface Section {
  id: string;
  title: string;
  content_type: 'document' | 'assignment' | 'content';
  content?: string;
  file_url?: string;        // ← NUEVO
  file_name?: string;       // ← NUEVO
  due_date?: string;
  is_active: boolean;
  created_at: string;
}
```

### FormData Enviado:
```typescript
formData.append('title', 'Título del documento');
formData.append('content_type', 'document');
formData.append('content', 'Descripción del documento');
formData.append('file', fileObject);
```

## Beneficios

1. **Para Profesores**:
   - Subida fácil de materiales
   - Organización por unidades
   - Control total del contenido

2. **Para Estudiantes**:
   - Acceso directo a documentos
   - Descarga simple y rápida
   - Organización clara por materia/unidad

3. **Para el Sistema**:
   - Almacenamiento escalable
   - URLs públicas optimizadas
   - Backup automático en Supabase

## Testing

### Casos de Prueba:
- [ ] Crear sección tipo "documento" sin archivo → Error
- [ ] Crear sección tipo "documento" con archivo → OK
- [ ] Crear sección tipo "contenido" con archivo → OK (opcional)
- [ ] Descargar documento desde vista de estudiante → OK
- [ ] Cambiar tipo de "documento" a "contenido" → Archivo se limpia
- [ ] Subir archivo muy grande → Error manejado
- [ ] Subir archivo tipo no permitido → Validación frontend

### URLs de Prueba:
- `GET /api/subjects/{id}/units/{unitId}/contents` - Ver contenidos
- `POST /api/subjects/{id}/units/{unitId}/contents` - Crear con archivo

## Próximas Mejoras

1. **Límite de tamaño de archivo**: Implementar validación de tamaño
2. **Preview de archivos**: Vista previa de PDFs en el navegador
3. **Versionado**: Permitir múltiples versiones del mismo documento
4. **Metadata**: Extraer información adicional de los archivos
5. **Compresión**: Optimización automática de archivos grandes
