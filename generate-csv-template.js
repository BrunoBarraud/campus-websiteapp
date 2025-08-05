#!/usr/bin/env node

/**
 * 📝 Generador de plantillas CSV para importación
 * 
 * Este script genera archivos CSV de ejemplo para importar usuarios
 * 
 * Uso: node generate-csv-template.js [cantidad]
 */

const fs = require('fs');
const path = require('path');

// Datos de ejemplo
const nombres = [
  'Ana García', 'Carlos López', 'María Rodríguez', 'José Martínez',
  'Laura Fernández', 'Diego González', 'Sofia Pérez', 'Miguel Sánchez',
  'Elena Díaz', 'Pablo Morales', 'Carmen Ruiz', 'Andrés Torres',
  'Lucía Vargas', 'Fernando Castro', 'Isabel Ortega', 'Roberto Silva'
];

const dominios = [
  '@ipdvs.edu.ar', '@campus.edu.ar', '@estudiante.edu.ar', '@profesor.edu.ar'
];

/**
 * Genera un email basado en el nombre
 */
function generarEmail(nombre) {
  const nombreLimpio = nombre
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n');
  
  const dominio = dominios[Math.floor(Math.random() * dominios.length)];
  return nombreLimpio + dominio;
}

/**
 * Genera usuarios de ejemplo
 */
function generarUsuarios(cantidad = 10) {
  const usuarios = [];
  const roles = ['student', 'teacher', 'admin'];
  const probabilidadRol = { student: 0.7, teacher: 0.25, admin: 0.05 };
  
  for (let i = 0; i < cantidad; i++) {
    const nombre = nombres[i % nombres.length];
    const email = generarEmail(nombre);
    
    // Seleccionar rol basado en probabilidades
    let rol = 'student';
    const rand = Math.random();
    if (rand < probabilidadRol.admin) {
      rol = 'admin';
    } else if (rand < probabilidadRol.admin + probabilidadRol.teacher) {
      rol = 'teacher';
    }
    
    // Generar año solo para estudiantes
    const año = rol === 'student' ? Math.floor(Math.random() * 5) + 1 : '';
    
    // Estado activo (90% activos)
    const activo = Math.random() > 0.1 ? 'true' : 'false';
    
    usuarios.push({
      nombre,
      email,
      rol,
      año,
      activo
    });
  }
  
  return usuarios;
}

/**
 * Convierte usuarios a CSV
 */
function usuariosACSV(usuarios) {
  const headers = 'nombre,email,rol,año,activo';
  const filas = usuarios.map(user => 
    `"${user.nombre}","${user.email}","${user.rol}","${user.año}","${user.activo}"`
  );
  
  return [headers, ...filas].join('\n');
}

/**
 * Genera archivo de plantilla vacía
 */
function generarPlantillaVacia() {
  return `nombre,email,rol,año,activo
"Ejemplo Nombre","ejemplo@ipdvs.edu.ar","student","1","true"
"Profesor Ejemplo","profesor@ipdvs.edu.ar","teacher","","true"
"Admin Ejemplo","admin@ipdvs.edu.ar","admin","","true"`;
}

/**
 * Función principal
 */
function main() {
  const cantidad = parseInt(process.argv[2]) || 10;
  
  console.log('📝 Generando plantillas CSV para importación...\n');
  
  try {
    // Crear directorio de plantillas si no existe
    const templatesDir = path.join(__dirname, 'csv-templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir);
    }
    
    // 1. Plantilla vacía
    const plantillaVacia = generarPlantillaVacia();
    const rutaPlantilla = path.join(templatesDir, 'plantilla_usuarios.csv');
    fs.writeFileSync(rutaPlantilla, plantillaVacia, 'utf8');
    console.log(`✅ Plantilla vacía creada: ${rutaPlantilla}`);
    
    // 2. Ejemplo con datos
    const usuariosEjemplo = generarUsuarios(cantidad);
    const csvEjemplo = usuariosACSV(usuariosEjemplo);
    const rutaEjemplo = path.join(templatesDir, `ejemplo_usuarios_${cantidad}.csv`);
    fs.writeFileSync(rutaEjemplo, csvEjemplo, 'utf8');
    console.log(`✅ Ejemplo con ${cantidad} usuarios creado: ${rutaEjemplo}`);
    
    // 3. Estadísticas
    const stats = usuariosEjemplo.reduce((acc, user) => {
      acc[user.rol] = (acc[user.rol] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Estadísticas del archivo de ejemplo:');
    Object.entries(stats).forEach(([rol, count]) => {
      console.log(`   ${rol}: ${count} usuarios`);
    });
    
    console.log('\n💡 Instrucciones de uso:');
    console.log('1. Usa plantilla_usuarios.csv como base para tus propios datos');
    console.log('2. Usa ejemplo_usuarios_X.csv para pruebas de importación');
    console.log('3. Asegúrate de que los emails sean únicos');
    console.log('4. Los roles válidos son: admin, teacher, student');
    console.log('5. El año es opcional y solo aplica para estudiantes');
    console.log('6. El campo activo acepta: true/false, 1/0, si/no');
    
  } catch (error) {
    console.error('❌ Error generando plantillas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  generarUsuarios,
  usuariosACSV,
  generarPlantillaVacia
};
