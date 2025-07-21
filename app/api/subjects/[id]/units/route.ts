import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/app/lib/services';

// GET /api/subjects/[id]/units - Obtener unidades de una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params;
    const units = await unitService.getSubjectUnits(subjectId);
    
    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Error al obtener las unidades' },
      { status: 500 }
    );
  }
}

// POST /api/subjects/[id]/units - Crear nueva unidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params;
    const unitData = await request.json();
    
    const newUnit = await unitService.createUnit(subjectId, unitData);
    
    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json(
      { error: 'Error al crear la unidad' },
      { status: 500 }
    );
  }
}
