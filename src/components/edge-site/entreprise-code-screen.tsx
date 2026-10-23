"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  email: string;
  onBack: () => void;
};

export function EntrepriseCodeScreen({ email, onBack }: Props) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(60);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const submitted = useRef("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const code = digits.join("");

  useEffect(() => {
    if (code.length !== 6 || submitted.current === code) return;
    submitted.current = code;
    setBusy(true);
    setError(null);
    void fetch("/api/entreprises/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: code }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { error?: string; destination?: string };
        if (!response.ok || !data.destination) {
          setError(data.error || "Code incorrect ou expiré.");
          setDigits(["", "", "", "", "", ""]);
          submitted.current = "";
          inputs.current[0]?.focus();
          return;
        }
        router.push(data.destination);
      })
      .catch(() => setError("Code incorrect ou expiré."))
      .finally(() => setBusy(false));
  }, [code, email, router]);

  const writeDigits = (next: string[]) => {
    setError(null);
    setDigits(next.slice(0, 6).concat(Array(Math.max(0, 6 - next.length)).fill("")).slice(0, 6));
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length < 2) return;
    event.preventDefault();
    writeDigits(text.split(""));
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    setError(null);
    const response = await fetch("/api/entreprises/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; retryAfter?: number };
    if (!response.ok) {
      setError(data.error || "Le code n'a pas pu être renvoyé.");
      if (data.retryAfter) setResendIn(data.retryAfter);
      return;
    }
    setDigits(["", "", "", "", "", ""]);
    submitted.current = "";
    setResendIn(60);
  };

  const clock = `0:${String(resendIn).padStart(2, "0")}`;

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F4F1] px-5 py-6 text-[#07080B]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-[22px]"
      >
        ‹
      </button>
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEEBFF] text-[#4B3BD1]" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
        <h1 className="mt-6 text-[34px] font-extrabold leading-tight tracking-[-1.2px]">Vérifiez votre boîte mail</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#6B6F7A]">
          Entrez le code à 6 chiffres envoyé à <span className="font-extrabold text-[#07080B]">{email}</span>
        </p>
        <div className="mt-8 flex justify-center gap-2 sm:gap-3" onPaste={onPaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Chiffre ${index + 1}`}
              disabled={busy}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "");
                if (value.length > 1) {
                  writeDigits(value.split(""));
                  return;
                }
                const next = [...digits];
                next[index] = value.slice(-1);
                writeDigits(next);
                if (value && index < 5) inputs.current[index + 1]?.focus();
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[index] && index > 0) {
                  inputs.current[index - 1]?.focus();
                }
              }}
              className={`h-12 w-11 rounded-[18px] bg-white text-center text-[22px] font-extrabold outline-none focus:border-2 focus:border-[#6E5BFF] sm:h-16 sm:w-14 sm:text-[28px] ${
                error ? "border-2 border-[#D6334A]" : "border border-[#E3E0D8]"
              }`}
            />
          ))}
        </div>
        {error ? (
          <p role="alert" className="mt-4 text-[13px] font-semibold text-[#B42318]">
            {error}
          </p>
        ) : null}
        <p className="mt-6 text-[14px] text-[#6B6F7A]">
          {resendIn > 0 ? (
            <>Renvoyer le code dans {clock}</>
          ) : (
            <button type="button" onClick={() => void resend()} className="font-extrabold text-[#4B3BD1]">
              Renvoyer le code
            </button>
          )}
        </p>
        <button type="button" onClick={onBack} className="mt-3 text-[14px] font-extrabold text-[#07080B] underline">
          Modifier l&apos;email
        </button>
      </div>
    </div>
  );
}
