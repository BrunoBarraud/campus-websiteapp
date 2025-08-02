import { NextRequest, NextResponse } from "next/server";
import {
  getTableStructure,
  getRolesInfo,
  getUsersByRole,
} from "@/app/lib/database-explorer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "structure":
        const structure = await getTableStructure();
        return NextResponse.json(structure);

      case "roles":
        const rolesInfo = await getRolesInfo();
        return NextResponse.json(rolesInfo);

      case "users-by-role":
        const role = searchParams.get("role");
        if (!role) {
          return NextResponse.json({
            success: false,
            error: "Role parameter is required",
          });
        }
        const usersByRole = await getUsersByRole(role);
        return NextResponse.json(usersByRole);

      default:
        // Por defecto, obtener información general
        const [structureResult, rolesResult] = await Promise.all([
          getTableStructure(),
          getRolesInfo(),
        ]);

        return NextResponse.json({
          success: true,
          structure: structureResult,
          roles: rolesResult,
        });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
