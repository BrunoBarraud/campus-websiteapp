import { supabase } from '../../lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { uid, email } = await request.json();
  
  try {
    const { error } = await supabase
      .from('users')
      .insert({
        firebase_uid: uid,
        email: email,
        role: 'student'
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Error al sincronizar usuario' },
      { status: 500 }
    );
  }
}
