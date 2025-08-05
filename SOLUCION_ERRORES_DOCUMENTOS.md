# 🚨 Guía de Solución de Errores - Subida de Documentos

## Errores Detectados y Soluciones

### ❌ **Error 1: `column subject_content.file_url does not exist`**

**Causa:** Las columnas `file_url` y `file_name` no existen en la tabla `subject_content`.

**Solución:**
1. Ejecutar el script `database-add-file-columns.sql` en Supabase SQL Editor
2. El script ahora incluye verificaciones automáticas y mensajes de éxito/error

### ❌ **Error 2: `Bucket not found`**

**Causa:** El bucket 'documents' no existe en Supabase Storage.

**Solución:**
1. Ejecutar el script `create-supabase-storage-bucket.sql` en Supabase
2. O crear manualmente desde la interfaz web de Supabase

### ❌ **Error 3: API GET no retorna campos de archivo**

**Causa:** El SELECT de la API GET no incluía `file_url` y `file_name`.

**Solución:** ✅ Ya corregido en el código

---

## 📋 **Pasos para Resolver (En Orden)**

### 1. **Ejecutar Script de Base de Datos**
```sql
-- En Supabase SQL Editor, ejecutar:
-- database-add-file-columns.sql
```

### 2. **Crear Bucket de Storage**

**Opción A - Manual (Recomendado):**
1. Ir a Supabase Dashboard → Storage
2. Crear nuevo bucket llamado 'documents'
3. Configurar como público
4. Establecer límite de 50MB

**Opción B - SQL:**
```sql
-- En Supabase SQL Editor, ejecutar:
-- create-supabase-storage-bucket.sql
```

### 3. **Verificar Configuración**
```sql
-- Verificar columnas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'subject_content' 
AND column_name IN ('file_url', 'file_name');

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'documents';
```

### 4. **Reiniciar Servidor**
```bash
# En terminal
npm run dev
```

---

## ✅ **Verificación Post-Solución**

### Test 1: Crear Sección con Documento
1. Ir a materia → Unidad → "Agregar Sección"
2. Seleccionar tipo "📄 Documento"
3. Subir archivo PDF/Word
4. Verificar que se crea exitosamente

### Test 2: Verificar en Base de Datos
```sql
SELECT 
    id, 
    title, 
    content_type, 
    file_url, 
    file_name 
FROM subject_content 
WHERE content_type = 'document'
ORDER BY created_at DESC;
```

### Test 3: Verificar en Storage
1. Ir a Supabase Storage → documents
2. Verificar que aparecen los archivos subidos
3. Probar descarga directa desde URL

---

## 🔍 **Logs de Diagnóstico**

### ✅ **Logs Correctos Esperados:**
```
✓ Columns file_url, file_name added successfully
✓ Bucket 'documents' created  
✓ File uploaded to storage
✓ Content created with file reference
```

### ❌ **Logs de Error (Para Investigar):**
```
❌ column subject_content.file_url does not exist
❌ Bucket not found
❌ Error uploading file
❌ Usuario no autenticado
```

---

## 🛠️ **Comandos de Emergencia**

### Si el bucket no se puede crear por SQL:
```javascript
// En consola JavaScript de Supabase
const { data, error } = await supabase.storage.createBucket('documents', {
  public: true,
  fileSizeLimit: 52428800
});
console.log('Bucket created:', data, error);
```

### Si las columnas no se agregan:
```sql
-- Forzar agregar columnas
ALTER TABLE subject_content ADD COLUMN file_url TEXT;
ALTER TABLE subject_content ADD COLUMN file_name TEXT;
```

---

## 📊 **Estado Actual del Sistema**

- ✅ Frontend: Formulario de subida implementado
- ✅ Backend: API con soporte para FormData
- ❌ Base de Datos: Faltan columnas file_url, file_name
- ❌ Storage: Falta bucket 'documents'

**Siguiente paso:** Ejecutar los scripts SQL para completar la configuración.
