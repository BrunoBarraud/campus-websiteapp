-- Script para limpiar inscripciones incorrectas de estudiantes
-- Elimina inscripciones donde el estudiante está en materias que no corresponden a su división

-- Ver inscripciones incorrectas antes de eliminar
SELECT 
  u.name AS estudiante,
  u.email,
  u.year AS año_estudiante,
  u.division AS division_estudiante,
  s.name AS materia,
  s.year AS año_materia,
  s.division AS division_materia
FROM student_subjects ss
JOIN users u ON ss.student_id = u.id
JOIN subjects s ON ss.subject_id = s.id
WHERE 
  u.role = 'student'
  AND u.division IS NOT NULL
  AND s.division IS NOT NULL
  AND u.division != s.division
ORDER BY u.name, s.name;

-- Eliminar inscripciones incorrectas
-- IMPORTANTE: Revisa los resultados de la consulta anterior antes de ejecutar esto
DELETE FROM student_subjects
WHERE id IN (
  SELECT ss.id
  FROM student_subjects ss
  JOIN users u ON ss.student_id = u.id
  JOIN subjects s ON ss.subject_id = s.id
  WHERE 
    u.role = 'student'
    AND u.division IS NOT NULL
    AND s.division IS NOT NULL
    AND u.division != s.division
);

-- Verificar que se limpiaron correctamente
SELECT 
  u.name AS estudiante,
  u.division AS division_estudiante,
  COUNT(ss.id) AS total_materias,
  COUNT(CASE WHEN s.division = u.division OR s.division IS NULL THEN 1 END) AS materias_correctas,
  COUNT(CASE WHEN s.division != u.division AND s.division IS NOT NULL THEN 1 END) AS materias_incorrectas
FROM users u
LEFT JOIN student_subjects ss ON ss.student_id = u.id
LEFT JOIN subjects s ON ss.subject_id = s.id
WHERE u.role = 'student' AND u.division IS NOT NULL
GROUP BY u.id, u.name, u.division
ORDER BY u.name;
