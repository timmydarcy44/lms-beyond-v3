import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('[documents PATCH] start', { id });
  
  try {
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

    const userId = session.id;
    if (!userId) return NextResponse.json({ error: 'userId manquant' }, { status: 401 });

    let body: { folder_id?: string | null; file_name?: string } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }

    const { folder_id, file_name } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof folder_id !== 'undefined') {
      updates.folder_id = folder_id || null;
    }

    if (typeof file_name === 'string' && file_name.trim().length > 0) {
      updates.file_name = file_name.trim();
    }

    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('beyond_note_documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[documents PATCH] supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error('[documents PATCH] unexpected:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}