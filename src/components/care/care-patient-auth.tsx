"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

export type CarePatientIdentity = {
  email: string;
  firstName: string;
  lastName: string;
};

export function CarePatientAuth({
  identity,
  onIdentity,
}: {
  identity: CarePatientIdentity;
  onIdentity: (next: CarePatientIdentity) => void;
}) {
  const supabase = useSupabase();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user || cancelled) return;
      setSignedIn(true);
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, full_name")
        .eq("id", user.id)
        .maybeSingle();
      const full = String(profile?.full_name ?? "").trim();
      const [guessFirst, ...rest] = full.split(/\s+/);
      onIdentity({
        email: String(profile?.email ?? user.email ?? identity.email).trim(),
        firstName: String(profile?.first_name ?? meta.first_name ?? guessFirst ?? identity.firstName).trim(),
        lastName: String(profile?.last_name ?? meta.last_name ?? rest.join(" ") ?? identity.lastName).trim(),
      });
    });
    return () => {
      cancelled = true;
    };
    // identity is a controlled parent snapshot; we only hydrate once from the session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function submit() {
    setMessage(null);
    setPending(true);
    const response = await fetch("/api/care/patient/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        email: identity.email,
        password,
        firstName: identity.firstName,
        lastName: identity.lastName,
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { error?: string; message?: string; ok?: boolean };
    setPending(false);
    if (!response.ok) {
      setMessage(json.error || "Action impossible.");
      return;
    }
    setSignedIn(true);
    setMessage(json.message || (mode === "login" ? "Connecté." : "Compte créé."));
  }

  if (signedIn) {
    return (
      <p className="care-patient-auth-ok">
        Connecté{identity.email ? ` · ${identity.email}` : ""}. Vos rendez-vous seront dans votre espace patient.
      </p>
    );
  }

  return (
    <div className="care-patient-auth">
      <div className="care-patient-auth-toggle" role="tablist" aria-label="Compte">
        <button type="button" className={mode === "login" ? "is-on" : ""} onClick={() => setMode("login")}>
          Déjà un compte ?
        </button>
        <button type="button" className={mode === "signup" ? "is-on" : ""} onClick={() => setMode("signup")}>
          Créer un compte
        </button>
      </div>
      <p className="care-muted">
        {mode === "login"
          ? "Connectez-vous pour retrouver vos rendez-vous Byound Care."
          : "Un e-mail, un mot de passe, et votre espace patient est créé."}
      </p>
      <label className="care-field">
        Mot de passe
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {message ? (
        <p className="care-alert" role="alert">
          {message}
        </p>
      ) : null}
      <button type="button" className="care-pill care-pill--ink" disabled={pending || !identity.email || password.length < 8} onClick={() => void submit()}>
        {pending ? "…" : mode === "login" ? "Se connecter" : "Créer mon espace"}
      </button>
    </div>
  );
}
