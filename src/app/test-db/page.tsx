"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "@/components/providers/supabase-provider";

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
  display_name: string | null;
  created_at: string;
};

export default function TestDbPage() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (uid: string) => {
      setError(null);
      const { data, error: qError } = await supabase
        .from("profiles")
        .select("id, email, role, display_name, created_at")
        .eq("id", uid)
        .maybeSingle();

      if (qError) {
        setError(qError.message);
        setProfile(null);
        return;
      }
      setProfile(data as ProfileRow | null);
    },
    [supabase],
  );

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const {
      data: { user: u },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      setError(authError.message);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(u ?? null);
    if (u?.id) {
      await loadProfile(u.id);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [supabase, loadProfile]);

  useEffect(() => {
    void init();
  }, [init]);

  const handleCreateProfile = async () => {
    if (!user?.id) return;
    setCreating(true);
    setError(null);
    setMessage(null);

    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "Utilisateur";

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      role: "learner",
      display_name: displayName,
    });

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    setMessage("Profil créé. Rechargement des données…");
    await loadProfile(user.id);
    setCreating(false);
    setMessage("Profil créé avec succès.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight">Test base de données</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Lecture de la table <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">profiles</code> pour
          l&apos;utilisateur connecté (RLS Supabase).
        </p>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          {loading ? (
            <p className="text-sm text-zinc-400">Chargement…</p>
          ) : !user ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">Aucune session : connectez-vous pour tester le profil.</p>
              <Link
                href="/login"
                className="inline-flex rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
              >
                Aller à la connexion
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="text-zinc-500">Utilisateur auth :</span>{" "}
                <span className="font-mono text-xs text-zinc-300">{user.email ?? user.id}</span>
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              {message && !error && (
                <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                  {message}
                </div>
              )}

              {profile ? (
                <div className="space-y-2 border-t border-zinc-800 pt-4">
                  <p className="text-sm font-medium text-emerald-400">Profil trouvé dans la base</p>
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">id</dt>
                      <dd className="font-mono text-xs text-zinc-300">{profile.id}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">email</dt>
                      <dd className="text-zinc-300">{profile.email ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">role</dt>
                      <dd className="text-zinc-300">{profile.role}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">display_name</dt>
                      <dd className="text-zinc-300">{profile.display_name ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">created_at</dt>
                      <dd className="text-xs text-zinc-400">{profile.created_at}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="space-y-4 border-t border-zinc-800 pt-4">
                  <p className="text-sm text-amber-200/90">
                    Aucune ligne dans <code className="text-zinc-400">profiles</code> pour cet utilisateur.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCreateProfile()}
                    disabled={creating}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? "Création…" : "Créer mon profil"}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => void init()}
                className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
              >
                Rafraîchir
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link href="/" className="hover:text-zinc-400">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
