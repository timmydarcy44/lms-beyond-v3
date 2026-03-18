import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { getTenantFromHostname } from '@/lib/tenant/config';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    const hostname = request.headers.get('host') || '';
    const tenant = getTenantFromHostname(hostname);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant non trouvé' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email. Connectez-vous plutôt.' },
        { status: 400 }
      );
    }

    const emailRedirectTo = "https://www.nevo-app.fr/note-app";
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        data: {
          origin: "nevo",
        },
      },
    });

    if (error) {
      console.error('[signup-email-only] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la création du compte' },
        { status: 400 }
      );
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role: 'learner',
        org_id: null,
        full_name: email.split('@')[0],
      });

      if (profileError) {
        console.error('[signup-email-only] Profile error:', profileError);
        if (profileError.code !== '23505') {
          return NextResponse.json(
            { error: 'Erreur lors de la création du profil' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lien envoyé ! Vérifiez votre boîte mail pour accéder à Nevo.',
      userId: data.user?.id || null,
    });
  } catch (error) {
    console.error('[signup-email-only] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

