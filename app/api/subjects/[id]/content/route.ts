import { NextRequest, NextResponse } from "next/server";
import { contentService } from "@/app/lib/services";

// GET /api/subjects/[id]/content - Obtener contenido de una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subject_id } = await params;
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
    const { id: subjectId } = await params;
    const contentData = await request.json();

    const newContent = await contentService.createContent({
      ...contentData,
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
