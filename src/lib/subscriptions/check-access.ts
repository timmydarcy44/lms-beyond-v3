import { getServerClient } from '@/lib/supabase/server';
import { TenantConfig } from '@/lib/tenant/config';

/**
 * Vérifie si un utilisateur a un abonnement actif pour un tenant donné
 */
export async function hasActiveSubscription(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = await getServerClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_end')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  // Vérifier que l'abonnement n'est pas expiré
  if (data.current_period_end) {
    const periodEnd = new Date(data.current_period_end);
    return periodEnd > new Date();
  }

  return true;
}

/**
 * Récupère l'abonnement actif d'un utilisateur pour un tenant
 */
export async function getActiveSubscription(
  userId: string,
  tenantId: string
) {
  const supabase = await getServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Vérifier que l'abonnement n'est pas expiré
  if (data.current_period_end) {
    const periodEnd = new Date(data.current_period_end);
    if (periodEnd <= new Date()) {
      return null;
    }
  }

  return data;
}



