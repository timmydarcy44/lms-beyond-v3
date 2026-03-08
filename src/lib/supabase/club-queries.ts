import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Récupère le club de l'utilisateur connecté
export async function getMyClub() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult?.user;
  if (!user) return null;

  const { data } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
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
    .single();
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
    .single();
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
