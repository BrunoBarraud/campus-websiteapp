import { NextRequest, NextResponse } from "next/server";
import { contentService } from "@/app/lib/services";
import { requireSession, canManageSubject, canViewSubject } from "@/app/lib/auth/routeGuards";
import { createAccessDeniedResponse } from "@/app/lib/auth/adminCheck";

// GET /api/subjects/[id]/content - Obtener contenido de una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireSession();
    if (!guard.ok) return guard.response;

    const { id: subject_id } = await params;
    if (!(await canViewSubject(guard.user, subject_id))) {
      return createAccessDeniedResponse("No tienes acceso a esta materia");
    }

    const { searchParams } = new URL(request.url);
    const unit_id = searchParams.get("unit_id");
    console.log("subjectId recibido:", subject_id);

    const content = await contentService.getSubjectContent(
      subject_id,
      unit_id || undefined
    );

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Error al obtener el contenido" },
      { status: 500 }
    );
  }
}

// POST /api/subjects/[id]/content - Crear nuevo contenido
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireSession(["admin", "teacher"]);
    if (!guard.ok) return guard.response;

    const { id: subjectId } = await params;
    if (!(await canManageSubject(guard.user, subjectId))) {
      return createAccessDeniedResponse("No tienes permisos para gestionar esta materia");
    }

    const { content_type, title, content, unit_id, is_pinned } = await request.json();

    const newContent = await contentService.createContent({
      content_type,
      title,
      content,
      unit_id,
      is_pinned,
      subject_id: subjectId,
    });

    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { error: "Error al crear el contenido" },
      { status: 500 }
    );
  }
}
