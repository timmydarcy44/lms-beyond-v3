import type { Session, SupabaseClient } from "@supabase/supabase-js";

function readHashTokens(): { accessToken: string; refreshToken: string } | null {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  if (!hash.includes("access_token")) return null;
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (accessToken && refreshToken) return { accessToken, refreshToken };
  return null;
}

async function waitForDetectedSession(supabase: SupabaseClient): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  await new Promise((resolve) => window.setTimeout(resolve, 350));
  const { data: retry } = await supabase.auth.getSession();
  return retry.session ?? null;
}

function clearUrlHash() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
}

/**
 * Bootstrap session depuis un lien email (invite / inscription EDGE).
 * Ne déconnecte une session existante que si l'URL contient de nouveaux credentials
 * (évite la race avec detectSessionInUrl du client Supabase).
 */
export async function bootstrapInviteSessionFromUrl(
  supabase: SupabaseClient,
  code: string | null,
): Promise<{ session: Session | null; error?: string }> {
  try {
    const hashTokens = readHashTokens();
    const hasUrlCredentials = Boolean(code) || Boolean(hashTokens);

    if (hasUrlCredentials) {
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        await supabase.auth.signOut();
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          const fallback = await waitForDetectedSession(supabase);
          if (fallback) return { session: fallback };
          return { session: null, error: error.message };
        }
        const { data } = await supabase.auth.getSession();
        return data.session
          ? { session: data.session }
          : { session: null, error: "Session introuvable après échange du code." };
      }

      if (hashTokens) {
        const { error } = await supabase.auth.setSession({
          access_token: hashTokens.accessToken,
          refresh_token: hashTokens.refreshToken,
        });
        if (error) {
          const fallback = await waitForDetectedSession(supabase);
          if (fallback) return { session: fallback };
          return { session: null, error: error.message };
        }
        clearUrlHash();
        const { data } = await supabase.auth.getSession();
        return data.session
          ? { session: data.session }
          : { session: null, error: "Session introuvable après hash." };
      }
    }

    const detected = await waitForDetectedSession(supabase);
    if (detected) return { session: detected };

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
