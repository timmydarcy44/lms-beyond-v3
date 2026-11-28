"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EntrepriseCodeScreen } from "@/components/edge-site/entreprise-code-screen";
import { ACCESS_CODE_DIGITS } from "@/lib/cfa/fiche-input";

function ApprenantAccessForm() {
  const params = useSearchParams();
  const initialEmail = useMemo(() => String(params.get("email") ?? "").trim().toLowerCase(), [params]);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ email: string; digits: number } | null>(
    initialEmail ? { email: initialEmail, digits: ACCESS_CODE_DIGITS } : null,
  );

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-[#111] shadow-xl">
        <p className="text-sm font-extrabold">Byound</p>
        <EntrepriseCodeScreen
          email={sent.email}
          length={sent.digits}
          onBack={() => {
            setSent(null);
            setError("");
          }}
        />
      </div>
    );
  }

  return (
    <form
      className="w-full max-w-md rounded-[28px] bg-white p-8 text-[#111] shadow-xl"
      onSubmit={(event) => {
        event.preventDefault();
        const nextEmail = email.trim().toLowerCase();
        if (!nextEmail) return;
        setBusy(true);
        setError("");
        void fetch("/api/cfa/apprenant-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: nextEmail }),
        })
          .then(async (response) => {
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              setError(result.error || "Le code n'a pas pu être envoyé.");
              return;
            }
            setSent({ email: nextEmail, digits: Number(result.digits) || ACCESS_CODE_DIGITS });
          })
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-sm font-extrabold">Byound</p>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Votre espace apprenant</h1>
      <p className="mt-3 text-sm text-[#5C6370]">
        Indiquez l’e-mail de votre admission. Si vous avez déjà reçu un code, vous pourrez le saisir à l’étape suivante.
      </p>
      <label className="mt-6 block text-sm font-semibold">
        Adresse e-mail
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-[#E4E4E7] px-4 text-base"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[#9F1239]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 h-12 w-full rounded-full bg-[#111] text-sm font-extrabold text-white disabled:opacity-50"
      >
        {busy ? "Envoi…" : "Recevoir un code"}
      </button>
      <button
        type="button"
        className="mt-3 h-12 w-full rounded-full border border-[#E4E4E7] text-sm font-extrabold"
        onClick={() => {
          const nextEmail = email.trim().toLowerCase();
          if (!nextEmail) {
            setError("Indiquez votre adresse e-mail.");
            return;
          }
          setError("");
          setSent({ email: nextEmail, digits: ACCESS_CODE_DIGITS });
        }}
      >
        J’ai déjà mon code
      </button>
    </form>
  );
}

export default function ApprenantConnexionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F4F6] px-4 py-16">
      <Suspense>
        <ApprenantAccessForm />
      </Suspense>
    </main>
  );
}
