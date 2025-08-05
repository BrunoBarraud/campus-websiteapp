# 🛠️ Scripts de Utilidad Campus

Este directorio contiene scripts de utilidad para el sistema de gestión del campus.

## 📁 Scripts Disponibles

### 1. 🔍 Analizador de Base de Datos (`analyze-database.js`)

Analiza automáticamente la estructura de tu base de datos de Supabase y sugiere nuevas funcionalidades.

**Uso:**
```bash
node analyze-database.js
```

**Requisitos:**
- Variables de entorno configuradas en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**Funcionalidades:**
- ✅ Analiza todas las tablas públicas
- 📊 Cuenta registros en cada tabla
- 🔍 Examina estructura de columnas
- 💡 Sugiere funcionalidades basadas en patrones
- 📈 Genera reporte completo de oportunidades

### 2. 📝 Generador de Plantillas CSV (`generate-csv-template.js`)

Genera archivos CSV de ejemplo para importar usuarios al sistema.

**Uso:**
```bash
# Generar 10 usuarios (por defecto)
node generate-csv-template.js

# Generar cantidad específica
node generate-csv-template.js 50
```

**Archivos generados:**
- `csv-templates/plantilla_usuarios.csv` - Plantilla vacía para usar como base
- `csv-templates/ejemplo_usuarios_N.csv` - Archivo con N usuarios de ejemplo

**Estructura CSV generada:**
```csv
nombre,email,rol,año,activo
"Ana García","ana.garcia@ipdvs.edu.ar","student","1","true"
"Carlos López","carlos.lopez@ipdvs.edu.ar","teacher","","true"
```

## 🔧 Instalación de Dependencias

Estos scripts usan las dependencias ya instaladas en el proyecto principal. No necesitas instalar nada adicional.

**Dependencias requeridas:**
- `@supabase/supabase-js` (para análisis de BD)
- `dotenv` (para variables de entorno)
- `fs` y `path` (Node.js built-in)

## 📊 Ejemplo de Uso Completo

```bash
# 1. Analizar base de datos actual
node analyze-database.js

# 2. Generar usuarios de prueba
node generate-csv-template.js 25

# 3. Usar el archivo generado para importar en la interfaz web
# Ir a http://localhost:3000/campus/settings/users
# Usar el archivo csv-templates/ejemplo_usuarios_25.csv
```

## 🎯 Casos de Uso

### Para Desarrollo:
- 🔍 Análisis regular de BD para identificar nuevas oportunidades
- 📝 Generación de datos de prueba consistentes
- 🧪 Testing de funcionalidades de importación

### Para Producción:
- 📊 Auditoría de estructura de datos
- 💡 Planificación de nuevas funcionalidades
- 📈 Análisis de crecimiento de datos

## ⚠️ Notas Importantes

1. **Seguridad**: Los scripts usan credenciales de admin, úsalos con cuidado
2. **Datos de Prueba**: Los archivos CSV generados contienen datos ficticios
3. **Backup**: Siempre haz backup antes de importaciones masivas
4. **Validación**: Los emails generados son únicos pero ficticios

## 🚀 Próximas Mejoras

- [ ] Script para generar datos de cursos y materias
- [ ] Generador de calificaciones de prueba
- [ ] Script de migración de datos
- [ ] Herramientas de backup automático
- [ ] Validador de integridad de datos

## 📞 Soporte

Si encuentras problemas con los scripts:

1. Verifica que las variables de entorno estén configuradas
2. Asegúrate de que Supabase esté accesible
3. Revisa los logs de error en la consola
4. Consulta la documentación de la API de Supabase
