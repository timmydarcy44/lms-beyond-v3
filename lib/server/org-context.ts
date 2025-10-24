import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "./auth";

export interface OrgMembership {
  id: string;
  slug: string;
  name: string;
  role: string;
}

export interface OrgContext {
  orgId: string;
  orgSlug: string;
  orgName: string;
  userRole: string;
}

/**
 * Récupère les membreships d'un utilisateur
 */
export async function getUserMemberships(
  sb: SupabaseClient,
  userId: string
): Promise<OrgMembership[]> {
  const { data, error } = await sb
    .from('org_memberships')
    .select(`
      id,
      role,
      organizations:org_id (
        id,
        slug,
        name
      )
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch memberships: ${error.message}`);
  }

  return (data || []).map((membership: any) => ({
    id: membership.organizations.id,
    slug: membership.organizations.slug,
    name: membership.organizations.name,
    role: membership.role
  }));
}

/**
 * Sélectionne l'organisation par défaut
 */
export function pickDefaultOrg(memberships: OrgMembership[]): OrgMembership | null {
  if (memberships.length === 0) return null;
  
  // Si SINGLE_ORG_SLUG est défini, utiliser cette org
  const singleOrgSlug = process.env.SINGLE_ORG_SLUG;
  if (singleOrgSlug) {
    const singleOrg = memberships.find(m => m.slug === singleOrgSlug);
    if (singleOrg) return singleOrg;
  }
  
  // Sinon, retourner la première organisation
  return memberships[0];
}

/**
 * Résout l'organisation depuis les paramètres ou les membreships
 */
export async function resolveOrgFromParamsOrMembership(
  paramsOrg?: string
): Promise<OrgContext> {
  const { sb, user } = await requireUser();
  
  // Si un slug d'org est fourni dans les paramètres
  if (paramsOrg) {
    // Vérifier que l'org existe
    const { data: org, error: orgError } = await sb
      .from('organizations')
      .select('id, slug, name')
      .eq('slug', paramsOrg.toLowerCase())
      .maybeSingle();
    
    if (orgError) {
      throw new Error(`Failed to fetch organization: ${orgError.message}`);
    }
    
    if (!org) {
      // Org inconnue -> 404 générique (pas de fuite d'info)
      throw new Response('Not Found', { status: 404 });
    }
    
    // Vérifier que l'utilisateur est membre
    const { data: membership, error: membershipError } = await sb
      .from('org_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org.id)
      .maybeSingle();
    
    if (membershipError) {
      throw new Error(`Failed to check membership: ${membershipError.message}`);
    }
    
    if (!membership) {
      // Non membre -> redirect vers org-picker
      throw new Response('Redirect to org-picker', { 
        status: 302, 
        headers: { 'Location': '/org-picker?denied=' + paramsOrg }
      });
    }
    
    return {
      orgId: org.id,
      orgSlug: org.slug,
      orgName: org.name,
      userRole: membership.role
    };
  }
  
  // Pas de slug fourni -> utiliser l'org par défaut
  const memberships = await getUserMemberships(sb, user.id);
  const defaultOrg = pickDefaultOrg(memberships);
  
  if (!defaultOrg) {
    // Aucune org -> redirect vers org-picker
    throw new Response('Redirect to org-picker', { 
      status: 302, 
      headers: { 'Location': '/org-picker' }
    });
  }
  
  return {
    orgId: defaultOrg.id,
    orgSlug: defaultOrg.slug,
    orgName: defaultOrg.name,
    userRole: defaultOrg.role
  };
}
