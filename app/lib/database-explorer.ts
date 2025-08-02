import { supabaseAdmin } from "@/app/lib/supabaseClient";

// Función para obtener la estructura de la tabla de usuarios
export async function getTableStructure() {
  try {
    // Obtener algunos usuarios de ejemplo para ver la estructura
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Error fetching users:", error);
      return { success: false, error: error.message };
    }

    console.log("Estructura de usuarios:", users);
    return { success: true, users };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Función para obtener información sobre los roles
export async function getRolesInfo() {
  try {
    // Obtener todos los roles únicos
    const { data: roles, error } = await supabaseAdmin
      .from("users")
      .select("role")
      .not("role", "is", null);

    if (error) {
      console.error("Error fetching roles:", error);
      return { success: false, error: error.message };
    }

    // Contar usuarios por rol
    const roleCounts = roles?.reduce(
      (acc: Record<string, number>, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {}
    );

    console.log("Distribución de roles:", roleCounts);
    return { success: true, roles: roleCounts };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Función para obtener usuarios por rol
export async function getUsersByRole(role: string) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, year, division, subjects")
      .eq("role", role);

    if (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Usuarios con rol ${role}:`, users);
    return { success: true, users };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
