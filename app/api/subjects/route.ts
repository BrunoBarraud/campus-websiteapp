// 📚 API pública para obtener todas las materias
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    console.log("📡 API subjects called");

    // Obtener todas las cookies para debug
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log(
      "🍪 Available cookies:",
      allCookies.map((c) => c.name)
    );

    // Buscar tokens de autenticación en las cookies
    const accessToken =
      cookieStore.get("sb-access-token")?.value ||
      cookieStore.get("supabase.auth.token")?.value ||
      cookieStore.get("next-auth.session-token")?.value;

    console.log("🔑 Access token found:", !!accessToken);

    // Si no hay token, verificar si hay información de NextAuth
    const nextAuthCookie =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    console.log("🔑 NextAuth token found:", !!nextAuthCookie);

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    let query = supabaseAdmin
      .from("subjects")
      .select(
        `
        *,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `
      )
      .eq("is_active", true)
      .order("year")
      .order("name");

    if (year) {
      query = query.eq("year", parseInt(year));
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching subjects:", error);
      return NextResponse.json(
        { error: "Error al obtener las materias" },
        { status: 500 }
      );
    }

    console.log("✅ Subjects fetched successfully:", data?.length || 0);

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("💥 Error en API subjects:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva materia (temporal sin autenticación para testing)
export async function POST(request: Request) {
  try {
    console.log("📝 POST: Creando nueva materia");

    const { name, code, description, year, division, teacher_id, image_url } =
      await request.json();

    console.log("📝 Datos recibidos:", {
      name,
      code,
      description,
      year,
      division,
    });

    // Validaciones básicas
    if (!name || !code || !year) {
      return NextResponse.json(
        { error: "Nombre, código y año son requeridos" },
        { status: 400 }
      );
    }

    if (year < 1 || year > 6) {
      return NextResponse.json(
        { error: "El año debe estar entre 1 y 6" },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const { data: existingSubject } = await supabaseAdmin
      .from("subjects")
      .select("id")
      .eq("code", code)
      .single();

    if (existingSubject) {
      return NextResponse.json(
        { error: "Ya existe una materia con ese código" },
        { status: 400 }
      );
    }

    // Crear la materia
    const { data, error } = await supabaseAdmin
      .from("subjects")
      .insert({
        name,
        code,
        description,
        year,
        division: division || null,
        teacher_id: teacher_id || null,
        image_url: image_url || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `
      )
      .single();

    if (error) {
      console.error("❌ Error creating subject:", error);
      return NextResponse.json(
        { error: "Error al crear la materia" },
        { status: 500 }
      );
    }

    console.log("✅ Materia creada exitosamente:", data);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("💥 Error in POST /api/subjects:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
