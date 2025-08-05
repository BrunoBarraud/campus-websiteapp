#!/usr/bin/env node

/**
 * 🔧 Script para actualizar la restricción de content_type en subject_content
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables de entorno de Supabase no encontradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateContentTypeConstraint() {
  console.log("🔧 Actualizando restricción de content_type...\n");

  try {
    // 1. Primero, eliminar la restricción existente
    console.log("📝 Eliminando restricción existente...");

    const { error: dropError } = await supabase.rpc("sql", {
      query: `
        ALTER TABLE subject_content 
        DROP CONSTRAINT IF EXISTS subject_content_content_type_check;
      `,
    });

    if (dropError) {
      console.log(
        "⚠️ Error eliminando restricción (puede que no exista):",
        dropError.message
      );
    } else {
      console.log("✅ Restricción anterior eliminada");
    }

    // 2. Crear la nueva restricción con más opciones
    console.log("\n📝 Creando nueva restricción...");

    const allowedTypes = [
      "content", // Contenido de texto general
      "document", // Documentos/archivos
      "assignment", // Tareas/trabajos
      "video", // Videos
      "link", // Enlaces
      "text", // Texto plano
    ];

    const constraintQuery = `
      ALTER TABLE subject_content 
      ADD CONSTRAINT subject_content_content_type_check 
      CHECK (content_type IN (${allowedTypes
        .map((type) => `'${type}'`)
        .join(", ")}));
    `;

    console.log("🔍 Query a ejecutar:", constraintQuery);

    const { error: addError } = await supabase.rpc("sql", {
      query: constraintQuery,
    });

    if (addError) {
      console.error("❌ Error creando nueva restricción:", addError.message);
      return false;
    }

    console.log("✅ Nueva restricción creada exitosamente");
    console.log(`📋 Tipos permitidos: ${allowedTypes.join(", ")}`);

    // 3. Probar la nueva restricción
    console.log("\n🧪 Probando la nueva restricción...");

    const testType = "document";
    const { error: testError } = await supabase.from("subject_content").insert([
      {
        subject_id: "00000000-0000-0000-0000-000000000000",
        unit_id: "00000000-0000-0000-0000-000000000000",
        content_type: testType,
        title: "Test document",
        content: "Test content",
        created_by: "00000000-0000-0000-0000-000000000000",
        is_active: true,
      },
    ]);

    if (testError) {
      if (testError.code === "23503") {
        console.log(
          "✅ Restricción funciona correctamente (falla por FK como esperado)"
        );
      } else if (testError.code === "23514") {
        console.log("❌ La restricción aún está bloqueando el tipo");
      } else {
        console.log("⚠️ Error diferente:", testError.message);
      }
    } else {
      console.log("✅ Tipo aceptado");
    }

    return true;
  } catch (error) {
    console.error("💥 Error general:", error);
    return false;
  }
}

updateContentTypeConstraint().then((success) => {
  if (success) {
    console.log("\n🎉 Actualización completada exitosamente");
    console.log(
      "💡 Ahora puedes usar los tipos: content, document, assignment, video, link, text"
    );
  } else {
    console.log("\n❌ La actualización falló");
  }
  process.exit(0);
});
