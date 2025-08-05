import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Verificar si ya existe un usuario admin
    const { data: existingAdmin } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "admin")
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Ya existe un usuario administrador" },
        { status: 200 }
      );
    }

    // Datos del admin por defecto
    const adminData = {
      email: "admin@ipdvs.edu.ar",
      password: "admin123",
      name: "Administrador IPDVS",
      role: "admin" as const,
    };

    console.log("Creando usuario admin:", adminData.email);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true,
        user_metadata: {
          name: adminData.name,
          role: adminData.role,
        },
      });

    if (authError) {
      console.error("Error creating admin in auth:", authError);
      return NextResponse.json(
        {
          error:
            "Error al crear usuario en autenticación: " + authError.message,
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Error al crear usuario admin" },
        { status: 500 }
      );
    }

    console.log("Usuario auth creado:", authData.user.id);

    // Crear usuario en la tabla users
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        password: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating admin in database:", userError);
      // Limpiar usuario de auth si falla la inserción en BD
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Error al crear perfil de usuario: " + userError.message },
        { status: 500 }
      );
    }

    console.log("Usuario admin creado exitosamente:", userData);

    return NextResponse.json(
      {
        message: "Usuario administrador creado exitosamente",
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
        credentials: {
          email: adminData.email,
          password: adminData.password,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in setup-admin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// También permitir GET para verificar si existe admin
export async function GET() {
  try {
    const { data: admin, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role")
      .eq("role", "admin")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      throw error;
    }

    return NextResponse.json({
      hasAdmin: !!admin,
      admin: admin
        ? {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking admin:", error);
    return NextResponse.json(
      { error: "Error al verificar administrador" },
      { status: 500 }
    );
  }
}
