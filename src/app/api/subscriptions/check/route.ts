import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { getTenantFromHostname } from '@/lib/tenant/config';
import { hasActiveSubscription } from '@/lib/subscriptions/check-access';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service indisponible' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { hasAccess: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const hostname = request.headers.get('host') || '';
    const tenant = getTenantFromHostname(hostname);

    if (!tenant) {
      return NextResponse.json(
        { hasAccess: false, error: 'Tenant non trouvé' },
        { status: 400 }
      );
    }

    const hasAccess = await hasActiveSubscription(user.id, tenant.id);

    return NextResponse.json({
      hasAccess,
      tenantId: tenant.id,
      userId: user.id,
    });
  } catch (error) {
    console.error('[subscriptions/check] Error:', error);
    return NextResponse.json(
      { hasAccess: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}



