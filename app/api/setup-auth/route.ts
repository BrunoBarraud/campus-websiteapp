import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { action, email, password } = await request.json();

    if (action === "update-password") {
      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Actualizar en la base de datos
      const { error } = await supabaseAdmin
        .from("users")
        .update({ password: hashedPassword })
        .eq("email", email);

      if (error) {
        return NextResponse.json({ success: false, error: error.message });
      }

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada",
      });
    }

    if (action === "setup-test-passwords") {
      const testPassword = "password123";
      const hashedPassword = await bcrypt.hash(testPassword, 12);

      // Actualizar contraseñas para usuarios de prueba
      const testUsers = [
        "admin@ipdvs.edu.ar",
        "brunobarraud15@gmail.com",
        "maria.garnerorosso@ipdvs.edu.ar",
      ];

      for (const email of testUsers) {
        await supabaseAdmin
          .from("users")
          .update({ password: hashedPassword })
          .eq("email", email);
      }

      return NextResponse.json({
        success: true,
        message: "Contraseñas de prueba configuradas",
        password: testPassword,
      });
    }

    return NextResponse.json({ success: false, error: "Acción no válida" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
