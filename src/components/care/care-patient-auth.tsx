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
  const [mode, setMode] = useState<"guest" | "login" | "signup">("guest");
  const [email, setEmail] = useState(identity.email);
  const [firstName, setFirstName] = useState(identity.firstName);
  const [lastName, setLastName] = useState(identity.lastName);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setEmail(identity.email);
    setFirstName(identity.firstName);
    setLastName(identity.lastName);
  }, [identity.email, identity.firstName, identity.lastName]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function submit() {
    setMessage(null);
    setPending(true);
    const response = await fetch("/api/care/patient/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: mode === "signup" ? "signup" : "login",
        email,
        password,
        firstName,
        lastName,
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { error?: string; message?: string; ok?: boolean };
    setPending(false);
    if (!response.ok) {
      setMessage(json.error || "Action impossible.");
      return;
    }
    onIdentity({ email, firstName, lastName });
    setSignedIn(true);
    setMessage(json.message || (mode === "login" ? "Connecté." : "Compte patient créé."));
  }

  if (signedIn) {
    return (
      <p className="care-patient-auth-ok">
        Connecté{email || identity.email ? ` · ${email || identity.email}` : ""}. Accès : espace patient uniquement.
      </p>
    );
  }

  return (
    <div className="care-patient-auth">
      <p className="care-patient-auth-guest">Prenez un rendez-vous sans compte</p>
      <p className="care-muted">Choisissez un créneau, puis vos coordonnées. Un compte n’est pas obligatoire.</p>
      <div className="care-patient-auth-toggle" role="tablist" aria-label="Compte">
        <button type="button" className={mode === "guest" ? "is-on" : ""} onClick={() => setMode("guest")}>
          Sans compte
        </button>
        <button type="button" className={mode === "login" ? "is-on" : ""} onClick={() => setMode("login")}>
          Se connecter
        </button>
        <button type="button" className={mode === "signup" ? "is-on" : ""} onClick={() => setMode("signup")}>
          Créer un compte
        </button>
      </div>
      {mode === "guest" ? null : (
        <>
          <p className="care-muted">
            {mode === "login"
              ? "Connexion à votre espace patient Byound Care."
              : "Ce compte est exclusivement patient : rendez-vous et suivi, rien d’autre."}
          </p>
          {mode === "signup" ? (
            <div className="care-patient-auth-grid">
              <label className="care-field">
                Prénom
                <input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              </label>
              <label className="care-field">
                Nom
                <input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </label>
            </div>
          ) : null}
          <label className="care-field">
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
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
          <button
            type="button"
            className="care-pill care-pill--ink"
            disabled={pending || !email || password.length < 8}
            onClick={() => void submit()}
          >
            {pending ? "…" : mode === "login" ? "Se connecter" : "Créer mon espace patient"}
          </button>
        </>
      )}
    </div>
  );
}
