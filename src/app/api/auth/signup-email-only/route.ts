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

    // Générer un mot de passe temporaire sécurisé
    const tempPassword = Math.random().toString(36).slice(-12) + 
                        Math.random().toString(36).slice(-12) + 
                        'A1!'; // Ajouter des caractères spéciaux
    
    // Créer l'utilisateur avec un mot de passe temporaire
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/set-password?tenant=${tenant.id}`,
        data: {
          tenant_id: tenant.id,
          super_admin_email: tenant.superAdminEmail,
          requires_password_setup: true,
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

    if (!data.user) {
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de la création du compte' },
        { status: 500 }
      );
    }

    // Créer le profil avec le rôle "learner" B2C
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      role: 'learner',
      org_id: null, // B2C
      full_name: email.split('@')[0], // Nom par défaut depuis l'email
    });

    if (profileError) {
      console.error('[signup-email-only] Profile error:', profileError);
      // Ne pas échouer si le profil existe déjà
      if (profileError.code !== '23505') { // Duplicate key
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Un email de confirmation a été envoyé. Vérifiez votre boîte mail pour définir votre mot de passe.',
      userId: data.user.id,
    });
  } catch (error) {
    console.error('[signup-email-only] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

