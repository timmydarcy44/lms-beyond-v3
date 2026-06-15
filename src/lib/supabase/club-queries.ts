import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function shouldUseClubDemoData(role: string | null, club: unknown): boolean {
  if (role === "demo") return true;
  return !club;
}

async function getSessionUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

// Récupère le club de l'utilisateur connecté
export async function getMyClub() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const user = await getSessionUser(supabase);
  if (!user) return null;

  const { data } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

// Récupère le club + le rôle de l'utilisateur connecté
export async function getMyClubContext() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { club: null, role: null };
  const user = await getSessionUser(supabase);
  if (!user) return { club: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  const roleType = String(profile?.role_type ?? "").trim().toLowerCase();
  const role = String(profile?.role ?? "").trim().toLowerCase();
  const effectiveRole = roleType === "club" || roleType === "demo"
    ? roleType
    : role === "club" || role === "demo"
      ? role
      : roleType || role || null;

  let club = null;
  try {
    const clubResult = await Promise.race([
      supabase.from("clubs").select("*").eq("user_id", user.id).maybeSingle(),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 4000)),
    ]);
    if (clubResult && "data" in clubResult) {
      club = clubResult.data;
    }
  } catch {
    club = null;
  }

  return { club, role: effectiveRole };
}

// Récupère les partenaires du club
export async function getClubPartners(clubId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("club_partners")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Récupère les matchs du club
export async function getClubMatches(clubId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("club_matches")
    .select("*")
    .eq("club_id", clubId)
    .order("date", { ascending: false });
  return data || [];
}

// Récupère les news du club
export async function getClubNews(clubId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("club_news")
    .select("*")
    .eq("club_id", clubId)
    .eq("statut", "published")
    .order("published_at", { ascending: false });
  return data || [];
}

// Récupère les settings ROI
export async function getClubRoiSettings(clubId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_roi_settings")
    .select("*")
    .eq("club_id", clubId)
    .maybeSingle();
  return data;
}

// Récupère le dossier DNCG
export async function getClubDncg(clubId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_dncg")
    .select("*")
    .eq("club_id", clubId)
    .maybeSingle();
  return data;
}

// Met à jour un partenaire
export async function updatePartner(id: string, updates: Record<string, any>) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_partners")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return data;
}

// Crée un partenaire
export async function createPartner(clubId: string, partner: Record<string, any>) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_partners")
    .insert({ ...partner, club_id: clubId })
    .select()
    .single();
  return data;
}

// Met à jour le dossier DNCG
export async function updateDncg(clubId: string, updates: Record<string, any>) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_dncg")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("club_id", clubId)
    .select()
    .single();
  return data;
}

// Sauvegarde l'affluence d'un match
export async function updateMatchAffluence(matchId: string, affluence: number) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_matches")
    .update({ affluence })
    .eq("id", matchId)
    .select()
    .single();
  return data;
}
