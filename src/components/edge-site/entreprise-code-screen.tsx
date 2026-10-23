"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  email: string;
  length?: number;
  onBack: () => void;
};

function emptyDigits(length: number) {
  return Array.from({ length }, () => "");
}

export function EntrepriseCodeScreen({ email, length = 8, onBack }: Props) {
  const router = useRouter();
  const size = Math.min(10, Math.max(6, length));
  const mid = Math.ceil(size / 2);
  const [digits, setDigits] = useState<string[]>(() => emptyDigits(size));
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
    if (code.length !== size || submitted.current === code) return;
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
          setDigits(emptyDigits(size));
          submitted.current = "";
          inputs.current[0]?.focus();
          return;
        }
        router.push(data.destination);
      })
      .catch(() => setError("Code incorrect ou expiré."))
      .finally(() => setBusy(false));
  }, [code, email, router, size]);

  const writeDigits = (next: string[]) => {
    setError(null);
    const filled = emptyDigits(size);
    next.slice(0, size).forEach((digit, index) => {
      filled[index] = digit;
    });
    setDigits(filled);
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, size);
    if (text.length < 2) return;
    event.preventDefault();
    writeDigits(text.split(""));
    inputs.current[Math.min(text.length, size - 1)]?.focus();
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
    setDigits(emptyDigits(size));
    submitted.current = "";
    setResendIn(60);
  };

  const clock = resendIn >= 60 ? "1:00" : `0:${String(resendIn).padStart(2, "0")}`;
  const groups = [digits.slice(0, mid), digits.slice(mid)];

  return (
    <div className="w-full text-left">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[14px] font-extrabold text-[#07080B]"
      >
        <span aria-hidden className="text-[18px] leading-none">
          ‹
        </span>
        Retour
      </button>
      <h2 className="mt-8 text-[34px] font-extrabold leading-[1.05] tracking-[-1.2px]">Entrez le code</h2>
      <p className="mt-3 max-w-[360px] text-[15px] leading-relaxed text-[#6B6F7A]">
        Envoyé à <span className="font-extrabold text-[#07080B]">{email}</span>. Valable 10 minutes.
      </p>
      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8" onPaste={onPaste}>
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex gap-2">
            {group.map((digit, offset) => {
              const index = groupIndex === 0 ? offset : mid + offset;
              return (
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
                    if (value && index < size - 1) inputs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !digits[index] && index > 0) {
                      inputs.current[index - 1]?.focus();
                    }
                  }}
                  className={`h-[64px] w-12 rounded-[18px] border text-center text-[22px] font-extrabold outline-none focus:ring-2 focus:ring-[#6E5BFF] disabled:opacity-60 sm:h-[72px] sm:w-[52px] sm:text-[24px] ${
                    digit
                      ? "border-[#07080B] bg-[#07080B] text-white"
                      : "border-[#D9D6CE] bg-white text-[#07080B] shadow-[0_1px_2px_#07080B0A]"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-[13px] font-semibold text-[#B42318]">
          {error}
        </p>
      ) : null}
      <div className="mt-8">
        {resendIn > 0 ? (
          <p className="text-[14px] text-[#6B6F7A]">Nouveau code dans {clock}</p>
        ) : (
          <button
            type="button"
            onClick={() => void resend()}
            className="h-12 rounded-full bg-[#07080B] px-6 text-[14px] font-extrabold text-white"
          >
            Renvoyer le code
          </button>
        )}
        <button type="button" onClick={onBack} className="mt-4 block text-[14px] font-extrabold text-[#07080B]">
          Modifier l&apos;email
        </button>
      </div>
    </div>
  );
}
