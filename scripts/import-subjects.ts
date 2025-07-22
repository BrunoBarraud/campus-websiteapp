import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CSVRow {
  'Materias'?: string;
  'A�o'?: string; // Con encoding de Windows
  'Profesor'?: string;
}

interface ProcessedSubject {
  name: string;
  code: string;
  year: number;
  division?: string;
  teacher_name: string;
  teacher_email: string;
}

// Función para limpiar y normalizar texto
function cleanText(text: string): string {
  return text
    .replace(/�/g, 'ñ')
    .replace(/�/g, 'ó')
    .replace(/�/g, 'é')
    .replace(/�/g, 'í')
    .replace(/�/g, 'á')
    .replace(/�/g, 'ú')
    .replace(/�/g, 'ü')
    .trim();
}

// Función para generar email del profesor
function generateTeacherEmail(teacherName: string): string {
  const cleanName = cleanText(teacherName.toLowerCase());
  const parts = cleanName.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    const lastname = parts[0].replace(/\s+/g, '');
    const firstname = parts[1].split(' ')[0];
    return `${firstname}.${lastname}@ipdvs.edu.ar`;
  }
  
  // Fallback
  const normalized = cleanName.replace(/[^a-z\s]/g, '').replace(/\s+/g, '.');
  return `${normalized}@ipdvs.edu.ar`;
}

// Función para generar código de materia
function generateSubjectCode(subjectName: string, year: number, division?: string): string {
  const nameWords = cleanText(subjectName)
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(' ')
    .filter(word => word.length > 0);
  
  let code = '';
  if (nameWords.length === 1) {
    code = nameWords[0].substring(0, 3);
  } else if (nameWords.length >= 2) {
    code = nameWords[0].substring(0, 2) + nameWords[1].substring(0, 1);
  }
  
  code += year;
  if (division) {
    code += division;
  }
  
  return code;
}

// Función para parsear los años
function parseYears(yearString: string): Array<{year: number, division?: string}> {
  const cleaned = cleanText(yearString);
  console.log('String limpio para parsing:', cleaned);
  
  // Buscar patrones como "1ñ A", "2ñ B", "3ñ", etc.
  // El ñ representa el símbolo de grado que se convirtió por encoding
  const yearMatches = cleaned.match(/(\d+)[ñº°]\s*([AB]?)/g);
  
  console.log('Matches encontrados:', yearMatches);
  
  if (!yearMatches) return [];
  
  return yearMatches.map(match => {
    const yearMatch = match.match(/(\d+)[ñº°]\s*([AB]?)/);
    if (!yearMatch) return null;
    
    const year = parseInt(yearMatch[1]);
    const division = yearMatch[2] || undefined;
    
    return { year, division };
  }).filter(Boolean) as Array<{year: number, division?: string}>;
}

interface Teacher {
  id: string;
  email: string;
  name: string;
}

async function findOrCreateTeacher(teacherName: string, teacherEmail: string): Promise<string | null> {
  // Buscar si el profesor ya existe
  const { data: existingTeacher } = await supabase
    .from('users')
    .select('id')
    .eq('email', teacherEmail)
    .eq('role', 'teacher')
    .single();

  if (existingTeacher) {
    return existingTeacher.id;
  }

  // Crear nuevo profesor
  const { data: newTeacher, error } = await supabase
    .from('users')
    .insert({
      email: teacherEmail,
      name: teacherName,
      role: 'teacher'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creando profesor:', error);
    return null;
  }

  return newTeacher?.id || null;
}

async function importSubjectsFromCSV(filePath: string) {
  const processedSubjects: ProcessedSubject[] = [];

  return new Promise<void>((resolve, reject) => {
    let rowCount = 0;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        rowCount++;
        console.log(`Fila ${rowCount}:`, JSON.stringify(row, null, 2));
        
        // Saltar la fila de encabezados si existe
        if (!row.Materias || row.Materias === 'Materias') {
          console.log('Saltando fila de encabezados');
          return;
        }
        
        const subjectName = cleanText(row.Materias || '');
        const yearString = row['A�o'] || '';
        const teacherName = cleanText(row.Profesor || '');
        
        console.log('Datos extraídos:', { subjectName, yearString, teacherName });
        
        if (!subjectName || !yearString || !teacherName) {
          console.warn('⚠️  Fila incompleta:', { subjectName, yearString, teacherName });
          return;
        }
        
        const years = parseYears(yearString);
        console.log('Años parseados:', years);
        const teacherEmail = generateTeacherEmail(teacherName);
        
        // Crear una entrada por cada año/división
        years.forEach(({ year, division }) => {
          const code = generateSubjectCode(subjectName, year, division);
          
          processedSubjects.push({
            name: subjectName,
            code,
            year,
            division,
            teacher_name: teacherName,
            teacher_email: teacherEmail
          });
        });
      })
      .on('end', async () => {
        console.log(`📚 Procesando ${processedSubjects.length} materias del CSV...`);

        for (const subject of processedSubjects) {
          try {
            // Buscar o crear profesor
            const teacherId = await findOrCreateTeacher(subject.teacher_name, subject.teacher_email);
            
            if (!teacherId) {
              console.error(`❌ No se pudo crear/encontrar profesor: ${subject.teacher_name}`);
              continue;
            }

            // Verificar si la materia ya existe
            const { data: existingSubject } = await supabase
              .from('subjects')
              .select('id')
              .eq('code', subject.code)
              .single();

            if (existingSubject) {
              console.log(`ℹ️  Materia ${subject.code} ya existe, saltando...`);
              continue;
            }

            // Insertar nueva materia
            const { error } = await supabase
              .from('subjects')
              .insert({
                name: subject.name,
                code: subject.code,
                description: `${subject.name} - Año ${subject.year}${subject.division ? ` División ${subject.division}` : ''}`,
                year: subject.year,
                teacher_id: teacherId,
                image_url: '/images/subjects/default.svg',
                is_active: true
              });

            if (error) {
              console.error(`❌ Error insertando materia ${subject.code}:`, error);
            } else {
              console.log(`✅ Materia insertada: ${subject.name} (${subject.code}) - Año ${subject.year}${subject.division ? ` Div. ${subject.division}` : ''} - Prof. ${subject.teacher_name}`);
            }

          } catch (error) {
            console.error(`❌ Error procesando materia ${subject.code}:`, error);
          }
        }

        console.log('🎉 Importación completada!');
        resolve();
      })
      .on('error', reject);
  });
}

// Función principal
async function main() {
  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('❌ Por favor, proporciona la ruta del archivo CSV');
    console.log('Uso: npm run import-subjects <ruta-del-archivo.csv>');
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ El archivo CSV no existe:', csvFilePath);
    process.exit(1);
  }

  try {
    await importSubjectsFromCSV(csvFilePath);
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

export { importSubjectsFromCSV };
