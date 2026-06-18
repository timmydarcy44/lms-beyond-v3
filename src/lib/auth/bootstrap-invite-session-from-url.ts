import type { Session, SupabaseClient } from "@supabase/supabase-js";

/**
 * Bootstrap session depuis un lien email (invite / inscription EDGE).
 * Déconnecte toute session existante avant d'appliquer le token — évite le mélange RH / collaborateur.
 * Ne retombe jamais silencieusement sur getSession() sans token valide.
 */
export async function bootstrapInviteSessionFromUrl(
  supabase: SupabaseClient,
  code: string | null,
): Promise<{ session: Session | null; error?: string }> {
  try {
    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) {
      await supabase.auth.signOut();
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { session: null, error: error.message };
      const { data } = await supabase.auth.getSession();
      return data.session ? { session: data.session } : { session: null, error: "Session introuvable après échange du code." };
    }

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("access_token")) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) return { session: null, error: error.message };
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );
        const { data } = await supabase.auth.getSession();
        return data.session ? { session: data.session } : { session: null, error: "Session introuvable après hash." };
      }
      return { session: null, error: "Lien incomplet (tokens manquants)." };
    }

    return {
      session: null,
      error: "Aucun token d'invitation dans l'URL. Rouvrez le lien reçu par email.",
    };
  } catch (error) {
    return {
      session: null,
      error: error instanceof Error ? error.message : "Erreur d'authentification",
    };
  }
}
