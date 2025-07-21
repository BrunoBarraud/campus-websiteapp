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

    console.log('Debug - checking units for subject:', subjectId);

    // Get all units for this subject
    const { data: units, error } = await supabase
      .from('subject_units')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index');

    if (error) {
      console.error('Error fetching units:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Found units:', units);

    // Also get the subject info
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single();

    if (subjectError) {
      console.error('Error fetching subject:', subjectError);
    }

    return NextResponse.json({
      subject,
      units,
      count: units?.length || 0,
      debug: {
        subjectId,
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
