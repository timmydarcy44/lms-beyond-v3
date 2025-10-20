import { supabaseServer } from '@/lib/supabase/server';

export interface UserWithMembership {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  membership: {
    role: 'admin' | 'instructor' | 'tutor' | 'learner';
    org_id: string;
    org_name: string;
    org_slug: string;
  } | null;
}

/**
 * Récupère l'utilisateur actuel avec sa session
 */
export async function getCurrentUser() {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('🔍 getCurrentUser: No authenticated user');
      return null;
    }

    console.log(`🔍 getCurrentUser: Found user ${user.email}`);
    return {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at || ''
    };
  } catch (error) {
    console.error('🔍 getCurrentUser error:', error);
    return null;
  }
}

/**
 * Récupère l'utilisateur actuel avec sa dernière membership
 */
export async function getCurrentMembership(): Promise<UserWithMembership | null> {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('🔍 getCurrentMembership: No authenticated user');
      return null;
    }

    // Récupérer la dernière membership
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select(`
        role,
        org_id,
        organizations!inner(
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (membershipError || !membership) {
      console.log(`🔍 getCurrentMembership: No membership found for user ${user.email}`);
      return {
        user: {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at || ''
        },
        membership: null
      };
    }

    console.log(`🔍 getCurrentMembership: User ${user.email} has role ${membership.role} in org ${membership.organizations.name}`);

    return {
      user: {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || ''
      },
      membership: {
        role: membership.role as 'admin' | 'instructor' | 'tutor' | 'learner',
        org_id: membership.org_id,
        org_name: membership.organizations.name,
        org_slug: membership.organizations.slug
      }
    };
  } catch (error) {
    console.error('🔍 getCurrentMembership error:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(expectedRole: 'admin' | 'instructor' | 'tutor' | 'learner'): Promise<boolean> {
  const userWithMembership = await getCurrentMembership();
  
  if (!userWithMembership?.membership) {
    return false;
  }

  return userWithMembership.membership.role === expectedRole;
}

/**
 * Redirige vers la route appropriée selon le rôle
 */
export function getRoleRedirectUrl(role: 'admin' | 'instructor' | 'tutor' | 'learner'): string {
  const roleRouteMap: Record<string, string> = {
    'admin': '/admin',
    'instructor': '/formateur',
    'tutor': '/tuteur',
    'learner': '/apprenant'
  };

  return roleRouteMap[role] || '/unauthorized';
}
