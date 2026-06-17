import type { Session, SupabaseClient } from "@supabase/supabase-js";

/**
 * Établit la session Supabase à partir du ?code= ou du hash #access_token=…
 * (lien email). Ne pas appeler signOut avant setSession — cela annule detectSessionInUrl.
 */
export async function bootstrapSessionFromUrl(
  supabase: SupabaseClient,
  code: string | null,
): Promise<{ session: Session | null; error?: string }> {
  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { session: null, error: error.message };
      const { data } = await supabase.auth.getSession();
      return { session: data.session };
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
        return { session: data.session };
      }
    }

    let { data: { session } } = await supabase.auth.getSession();
    if (session) return { session };

    // Laisser detectSessionInUrl terminer (mobile / clients lents)
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    ({ data: { session } } = await supabase.auth.getSession());
    if (session) return { session };

    return await new Promise((resolve) => {
      const timer = window.setTimeout(async () => {
        subscription.unsubscribe();
        const { data } = await supabase.auth.getSession();
        resolve({ session: data.session });
      }, 2500);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && nextSession) {
          window.clearTimeout(timer);
          subscription.unsubscribe();
          resolve({ session: nextSession });
        }
      });
    });
  } catch (error) {
    return {
      session: null,
      error: error instanceof Error ? error.message : "Erreur d'authentification",
    };
  }
}
