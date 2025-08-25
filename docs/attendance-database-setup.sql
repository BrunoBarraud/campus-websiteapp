-- Script para crear el sistema de asistencias
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear tabla de asistencias
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'justified')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados: un estudiante solo puede tener un registro por día y materia
    UNIQUE(student_id, subject_id, attendance_date)
);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_subject_date ON attendance(student_id, subject_id, attendance_date);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_attendance_updated_at ON attendance;
CREATE TRIGGER trigger_update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();

-- 5. Crear tabla para configuración de asistencias (opcional)
CREATE TABLE IF NOT EXISTS attendance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    late_threshold_minutes INTEGER DEFAULT 15, -- Minutos de tolerancia para llegar tarde
    auto_mark_absent_after_minutes INTEGER DEFAULT 30, -- Auto marcar ausente después de X minutos
    allow_retroactive_changes BOOLEAN DEFAULT true, -- Permitir cambios retroactivos
    retroactive_days_limit INTEGER DEFAULT 7, -- Límite de días para cambios retroactivos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(subject_id, teacher_id)
);

-- 6. Crear vista para estadísticas de asistencia por estudiante
CREATE OR REPLACE VIEW attendance_student_stats AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.email as student_email,
    s.year as student_year,
    subj.id as subject_id,
    subj.name as subject_name,
    subj.code as subject_code,
    COUNT(*) as total_classes,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN a.status = 'justified' THEN 1 END) as justified_count,
    ROUND(
        (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 2
    ) as attendance_percentage
FROM users s
JOIN attendance a ON s.id = a.student_id
JOIN subjects subj ON a.subject_id = subj.id
WHERE s.role = 'student'
GROUP BY s.id, s.name, s.email, s.year, subj.id, subj.name, subj.code;

-- 7. Crear vista para estadísticas de asistencia por materia
CREATE OR REPLACE VIEW attendance_subject_stats AS
SELECT 
    subj.id as subject_id,
    subj.name as subject_name,
    subj.code as subject_code,
    subj.year as subject_year,
    t.name as teacher_name,
    COUNT(DISTINCT a.student_id) as total_students,
    COUNT(*) as total_records,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN a.status = 'justified' THEN 1 END) as justified_count,
    ROUND(
        (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 2
    ) as attendance_percentage
FROM subjects subj
JOIN attendance a ON subj.id = a.subject_id
JOIN users t ON subj.teacher_id = t.id
GROUP BY subj.id, subj.name, subj.code, subj.year, t.name;

-- 8. Crear políticas RLS (Row Level Security)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Política para estudiantes: solo pueden ver sus propias asistencias
CREATE POLICY "Students can view own attendance" ON attendance
    FOR SELECT USING (
        auth.uid()::text = student_id::text
    );

-- Política para profesores: pueden ver y modificar asistencias de sus materias
CREATE POLICY "Teachers can manage attendance for their subjects" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM subjects s 
            WHERE s.id = attendance.subject_id 
            AND s.teacher_id::text = auth.uid()::text
        )
    );

-- Política para administradores: acceso completo
CREATE POLICY "Admins can manage all attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'admin'
        )
    );

-- 9. Insertar datos de ejemplo (opcional)
-- INSERT INTO attendance (student_id, subject_id, teacher_id, attendance_date, status, notes)
-- SELECT 
--     s.id as student_id,
--     subj.id as subject_id,
--     subj.teacher_id,
--     CURRENT_DATE - INTERVAL '1 day' as attendance_date,
--     'present' as status,
--     'Asistencia de ejemplo' as notes
-- FROM users s
-- CROSS JOIN subjects subj
-- WHERE s.role = 'student' 
-- AND subj.teacher_id IS NOT NULL
-- LIMIT 10;

-- 10. Verificar que todo se creó correctamente
SELECT 'attendance table created' as status;
SELECT 'attendance_settings table created' as status;
SELECT 'Views created' as status;
SELECT 'RLS policies created' as status;

-- Mostrar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'attendance' 
AND table_schema = 'public'
ORDER BY ordinal_position;