"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicOffer } from "@/lib/offres/public-offers";

export function PostulerOffer({ offer, login }: { offer: PublicOffer; login: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"form" | "code">(login ? "form" : "form");
  const [signingIn, setSigningIn] = useState(login);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/offres/candidature/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        firstName: signingIn ? "" : firstName,
        lastName: signingIn ? "" : lastName,
        slug: offer.slug,
        login: signingIn,
      }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Le code n'a pas pu être envoyé.");
      if (result.retryAfter) setResendIn(Number(result.retryAfter));
      return;
    }
    const length = Number(result.digits) || 8;
    setDigits(Array.from({ length }, () => ""));
    setMode("code");
    setResendIn(60);
    window.setTimeout(() => inputs.current[0]?.focus(), 50);
  }

  async function verify(code: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/offres/candidature/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: code }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Code incorrect ou expiré.");
      return;
    }
    router.push(result.destination || "/offres/candidature");
    router.refresh();
  }

  function onDigit(index: number, value: string) {
    const chars = value.replace(/\D/g, "");
    if (!chars) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    const next = [...digits];
    chars.split("").forEach((char, offset) => {
      if (index + offset < next.length) next[index + offset] = char;
    });
    setDigits(next);
    const focus = Math.min(index + chars.length, next.length - 1);
    inputs.current[focus]?.focus();
    if (next.every(Boolean)) void verify(next.join(""));
  }

  const pills = [offer.contractType, offer.duration, offer.startLabel, offer.workMode].filter(Boolean);

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
      <header className="flex items-center justify-between px-5 py-5 lg:col-span-2">
        <Link href="/" className="text-lg font-extrabold">Byound</Link>
        <p className="text-sm text-white/70">
          Déjà un compte ?{" "}
          <button type="button" className="font-semibold text-white underline" onClick={() => { setSigningIn(true); setMode("form"); setError(""); }}>
            Se connecter
          </button>
        </p>
      </header>
      <section className="px-5 pb-10 lg:px-10">
        <Link href={`/offres/${offer.slug}`} className="text-sm text-white/60">‹ Retour à l&apos;offre</Link>
        <p className="mt-8 text-sm text-white/60">Vous postulez à</p>
        <div className="mt-3 rounded-[28px] bg-white/5 p-5">
          <p className="text-sm text-white/70">Entreprise partenaire · {offer.sector}{offer.city ? ` · ${offer.city}` : ""}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">{offer.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <span key={pill} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#12141A]">{pill}</span>
            ))}
          </div>
          {offer.cursus ? <p className="mt-4 text-sm font-semibold text-[#C9C2FF]">✦ Formation incluse · {offer.cursus}</p> : null}
        </div>
        <h2 className="mt-8 text-lg font-extrabold">Comment ça se passe</h2>
        <ol className="mt-4 space-y-4 text-sm">
          {[
            ["Créez votre espace", "Prénom, nom, e-mail et un code. 1 minute."],
            ["Complétez votre profil et passez 3 tests", "CV, puis soft skills, profil comportemental et maîtrise cognitive (25 min)."],
            ["Envoyez votre candidature", offer.cursus ? "Elle part chez l'entreprise. L'admission à Byound School suit, ce poste l'inclut." : "Elle part chez l'entreprise."],
          ].map(([title, detail], index) => (
            <li key={title} className="flex gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#070C1C]">{index + 1}</span>
              <span><span className="block font-semibold">{title}</span><span className="text-white/60">{detail}</span></span>
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-[#F4F4F1] px-5 py-8 text-[#12141A] lg:px-10">
        <div className="mx-auto max-w-md rounded-[28px] bg-white p-6 shadow-xl">
          {mode === "form" ? (
            <form onSubmit={(event) => void sendCode(event)}>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{signingIn ? "Connectez-vous" : "Créez votre espace en 1 minute"}</h2>
              <p className="mt-2 text-sm text-[#5C616B]">On crée votre espace Byound. Vous y terminez votre candidature.</p>
              {signingIn ? null : (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold">Prénom<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#E6E4DE] px-3 font-normal" /></label>
                  <label className="text-sm font-semibold">Nom<input required value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#E6E4DE] px-3 font-normal" /></label>
                </div>
              )}
              <label className="mt-3 block text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#E6E4DE] px-3 font-normal" /></label>
              {error ? <p className="mt-3 text-sm text-[#9F1239]">{error}</p> : null}
              <button type="submit" disabled={busy} className="mt-5 h-12 w-full rounded-full bg-[#6E5BFF] text-sm font-semibold text-white disabled:opacity-60">
                {busy ? "Envoi…" : "Recevoir mon code"}
              </button>
            </form>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); void verify(digits.join("")); }}>
              <h2 className="text-2xl font-extrabold">Entrez le code</h2>
              <p className="mt-2 text-sm text-[#5C616B]">Envoyé à {email}.</p>
              <div className="mt-5 flex justify-between gap-2">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => { inputs.current[index] = node; }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Chiffre ${index + 1}`}
                    value={digit}
                    onChange={(event) => onDigit(index, event.target.value)}
                    className="h-12 w-full rounded-xl border border-[#E6E4DE] text-center text-lg font-bold"
                  />
                ))}
              </div>
              {error ? <p className="mt-3 text-sm text-[#9F1239]">{error}</p> : null}
              <button type="submit" disabled={busy || digits.some((digit) => !digit)} className="mt-5 h-12 w-full rounded-full bg-[#6E5BFF] text-sm font-semibold text-white disabled:opacity-60">
                {busy ? "Vérification…" : "Valider et continuer"}
              </button>
              <button type="button" disabled={resendIn > 0 || busy} className="mt-3 text-sm font-semibold text-[#6E5BFF] disabled:text-[#8B909A]" onClick={() => void sendCode()}>
                {resendIn > 0 ? `Renvoyer dans ${resendIn} s` : "Renvoyer le code"}
              </button>
            </form>
          )}
          <p className="mt-5 text-xs leading-relaxed text-[#6B6F7A]">
            Votre candidature passe uniquement par Byound. En continuant, vous acceptez les <Link href="/cgu" className="underline">conditions</Link> et la <Link href="/legal/privacy" className="underline">politique de confidentialité</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
