"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EntrepriseCodeScreen } from "@/components/edge-site/entreprise-code-screen";

function TutorAccessForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ email: string; digits: number } | null>(null);

  if (sent) {
    return (
      <EntrepriseCodeScreen
        email={sent.email}
        length={sent.digits}
        onBack={() => setSent(null)}
      />
    );
  }

  return (
    <form
      className="w-full max-w-md rounded-[28px] bg-white p-8 text-[#111] shadow-xl"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        void fetch("/api/cfa/tutor-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) setError(result.error || "Le code n'a pas pu être envoyé.");
          else setSent({ email: email.trim().toLowerCase(), digits: Number(result.digits) || 8 });
        }).finally(() => setBusy(false));
      }}
    >
      <p className="text-sm font-extrabold">Byound</p>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Votre espace tuteur</h1>
      <p className="mt-3 text-sm text-[#5C6370]">Indiquez l'adresse e-mail sur laquelle vous avez été désigné tuteur. Un code de connexion vous sera envoyé.</p>
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
      <button type="submit" disabled={busy} className="mt-6 h-12 w-full rounded-full bg-[#111] text-sm font-extrabold text-white disabled:opacity-50">
        Envoyer un code
      </button>
    </form>
  );
}

export default function TutorAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F4F6] px-4 py-16">
      <Suspense>
        <TutorAccessForm />
      </Suspense>
    </main>
  );
}
