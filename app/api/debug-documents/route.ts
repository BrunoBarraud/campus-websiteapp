import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    console.log('Debug - checking documents for subject:', subjectId);

    // Get all units for this subject
    const { data: units, error: unitsError } = await supabase
      .from('subject_units')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index');

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return NextResponse.json({ error: unitsError.message }, { status: 500 });
    }

    // Get all documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json({ error: docsError.message }, { status: 500 });
    }

    // Get documents specifically for units of this subject
    const unitIds = units?.map(unit => unit.id) || [];
    const { data: unitDocuments, error: unitDocsError } = await supabase
      .from('documents')
      .select('*')
      .in('unit_id', unitIds)
      .order('created_at', { ascending: false });

    if (unitDocsError) {
      console.error('Error fetching unit documents:', unitDocsError);
    }

    return NextResponse.json({
      subject_id: subjectId,
      units,
      all_documents: documents,
      unit_documents: unitDocuments,
      debug: {
        total_units: units?.length || 0,
        total_documents: documents?.length || 0,
        unit_documents_count: unitDocuments?.length || 0,
        unit_ids: unitIds,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
