# Eliminación de Semester y Credits + Mejora de Divisiones

## Resumen de Cambios

Se han eliminado los campos `semester` y `credits` del sistema de materias y se ha mejorado la lógica de divisiones para que sea más precisa según los años académicos.

## Cambios Principales

### 1. Eliminación de Campos

**Campos eliminados:**
- `semester` (semestre)
- `credits` (créditos)

**Razón:** Estos campos no son necesarios para el sistema académico actual y simplificamos la estructura.

### 2. Mejora de Divisiones

**Nueva lógica:**
- **1° a 4° año**: Tienen divisiones A y B (obligatorio)
- **5° y 6° año**: NO tienen divisiones (debe ser null/undefined)

### 3. Archivos Modificados

#### APIs Actualizadas:
- `app/api/teacher/subjects/route.ts`
- `app/api/subjects/route.ts`
- `app/api/subjects/[id]/route.ts`
- `app/api/admin/subjects/route.ts`
- `app/api/admin/subjects/[id]/route.ts`
- `app/api/student/subjects/route.ts`
- `app/api/student/enroll/route.ts`

#### Tipos TypeScript:
- `app/lib/types/index.ts` - Interfaces Subject y CreateSubjectForm

#### Páginas Frontend:
- `app/campus/teacher/subjects/[id]/page.tsx`
- `app/campus/teacher/subjects/[id]/new-page.tsx`
- `app/campus/teacher/subjects/page.tsx`
- `app/campus/dashboard/page.tsx`

#### Componentes Nuevos:
- `app/lib/utils/divisions.ts` - Utilidades para manejar divisiones
- `components/ui/DivisionSelector.tsx` - Componente para selección de división
- `components/forms/SubjectForm.tsx` - Formulario ejemplo con nueva lógica

#### Base de Datos:
- `database-cleanup-semester-credits.sql` - Script SQL para limpiar la DB

## Nuevas Utilidades

### `app/lib/utils/divisions.ts`

```typescript
// Funciones disponibles:
yearHasDivisions(year: number): boolean
getAvailableDivisions(year: number): string[]
isValidDivisionForYear(year: number, division?: string): boolean
formatSubjectYearDivision(year: number, division?: string): string
getDivisionDescription(year: number): string
```

### Componente `DivisionSelector`

```typescript
// Uso del componente:
<DivisionSelector
  year={formData.year}
  division={formData.division}
  onDivisionChange={handleDivisionChange}
  required={formData.year >= 1 && formData.year <= 4}
/>
```

## Migración de Base de Datos

### ⚠️ IMPORTANTE: Backup Obligatorio

Antes de ejecutar el script SQL, **HACER BACKUP COMPLETO** de la base de datos.

### Ejecutar Script SQL

```sql
-- Ejecutar: database-cleanup-semester-credits.sql
-- Este script:
-- 1. Elimina columnas semester y credits
-- 2. Limpia divisiones para 5°-6° año (null)
-- 3. Asegura divisiones A/B para 1°-4° año
-- 4. Muestra reporte final
```

## Validaciones Implementadas

### Frontend (TypeScript)
```typescript
// Validación automática en formularios
if (!isValidDivisionForYear(year, division)) {
  // Error: División inválida para el año
}
```

### Backend (APIs)
- Todas las APIs validan divisiones según el año
- 1°-4° año: División A o B obligatoria
- 5°-6° año: División debe ser null

## Ejemplos de Uso

### Mostrar Materia con División
```typescript
// Antes:
{subject.year}° Año • {subject.semester}° Sem
{subject.credits} créditos

// Ahora:
{subject.year}° Año{subject.division ? ` "${subject.division}"` : ''}
{subject.code}
```

### Crear/Editar Materia
```typescript
// Usar el componente SubjectForm:
<SubjectForm
  initialData={subject}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isEditing={true}
/>
```

## Beneficios

1. **Simplificación**: Menos campos = menos complejidad
2. **Precisión**: Divisiones solo donde aplican (1°-4° año)
3. **Validación**: Automática en frontend y backend
4. **Consistencia**: Misma lógica en toda la aplicación
5. **Mantenibilidad**: Código más limpio y fácil de mantener

## Testing

### Verificar que funciona:

1. **Crear materia 1° año**: Debe requerir división A o B
2. **Crear materia 5° año**: NO debe permitir división
3. **Dashboard teacher**: Debe mostrar materias sin errores
4. **API responses**: No deben incluir semester/credits

### Casos de prueba:
- [ ] Crear materia 1° año sin división → Error
- [ ] Crear materia 1° año con división A → OK
- [ ] Crear materia 5° año con división → Error
- [ ] Crear materia 5° año sin división → OK
- [ ] Dashboard carga sin errores
- [ ] Teacher subjects API funciona
- [ ] Student subjects API funciona

## Notas Importantes

1. **Compatibility**: El frontend maneja casos donde division puede ser undefined
2. **Migration**: Datos existentes se migran automáticamente con el SQL script
3. **Rollback**: Mantener backup para poder revertir si es necesario
4. **Performance**: Queries más simples = mejor rendimiento

## Próximos Pasos

1. Ejecutar el script SQL en la base de datos
2. Testear todas las funcionalidades
3. Actualizar documentación de usuario si es necesario
4. Considerar actualizar formularios de admin si existen
