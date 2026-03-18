"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

export default function BeyondConnectLoginPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      setIsSubmitting(false);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback`;
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { redirectTo } as any,
    });

    if (signInError || !data.session) {
      setError("Identifiants incorrects.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role_type")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) {
      console.error("Erreur chargement profil:", profileError.message);
      router.push("/dashboard/apprenant");
      return;
    }
    const roleType = profile?.role_type;
    if (!roleType) {
      setError("Profil incomplet. Merci de compléter votre inscription.");
      setIsSubmitting(false);
      return;
    }
    if (roleType === "ecole") {
      router.push("/dashboard/ecole");
      return;
    }
    if (roleType === "entreprise") {
      router.push("/dashboard/entreprise");
      return;
    }
    router.push("/dashboard/apprenant");
  };

  const getFieldWrapperStyle = (isFocused: boolean) =>
    isFocused
      ? {
          backgroundImage:
            "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
          backgroundOrigin: "border-box",
          backgroundClip: "content-box, border-box",
        }
      : { border: "1px solid #E5E7EB", borderRadius: "0.75rem" };

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-black">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            BEYOND CONNECT.
          </h1>
          <p className="mt-2 text-sm text-black/40">Atteignez votre plein potentiel.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Email
            </label>
            <div className="mt-2 rounded-xl p-[1px]" style={getFieldWrapperStyle(focusedField === "email")}>
              <div className="flex items-center gap-2 rounded-[0.7rem] bg-white px-4 py-3">
                <Mail className="h-4 w-4 text-black/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-white text-sm text-black outline-none"
                  placeholder="vous@email.com"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Mot de passe
            </label>
            <div className="mt-2 rounded-xl p-[1px]" style={getFieldWrapperStyle(focusedField === "password")}>
              <div className="flex items-center gap-2 rounded-[0.7rem] bg-white px-4 py-3">
                <Lock className="h-4 w-4 text-black/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-white text-sm text-black outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-4 py-3 text-sm font-semibold uppercase text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connexion..." : "SE CONNECTER"}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="text-sm text-black/60">
          Pas encore de compte ?{" "}
          <Link href="/signup-talent" className="text-black hover:underline">
            Créer un profil
          </Link>
        </div>
      </div>
    </div>
  );
}
