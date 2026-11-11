"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  token: string;
  recipientMasked: string;
  expiresAt: string | null;
  onAuthenticated: () => void | Promise<void>;
};

export function AccessGate({ token, recipientMasked, expiresAt, onAuthenticated }: Props) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const verifyingRef = useRef(false);
  const requestedRef = useRef(false);

  const requestCode = async (force = false) => {
    if (!force && requestedRef.current) return;
    requestedRef.current = true;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ready/${encodeURIComponent(token)}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", force }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setSent(true);
    } catch (e) {
      requestedRef.current = false;
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void requestCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verify = async (code: string) => {
    if (verifyingRef.current) return;
    if (code.length !== 6) return;
    verifyingRef.current = true;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/ready/${encodeURIComponent(token)}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Code incorrect");
      await onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="relative flex min-h-screen flex-col px-4 pb-10 pt-6">
      <img
        src="/brand/logo-byound-blanc.png"
        alt="Byound"
        className="h-7 w-auto self-start"
      />
      <div className="mx-auto mt-16 w-full max-w-[420px]">
        <div
          className="px-6 py-8 text-center"
          style={{ background: "var(--ready-card)", borderRadius: 36 }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-[16px]"
            style={{ background: "var(--ready-gradient)" }}
            aria-hidden
          >
            {/* logo-b.png a un fond noir : screen enlève le carré */}
            <img
              src="/brand/logo-b.png"
              alt=""
              className="h-10 w-10 object-contain"
              style={{ mixBlendMode: "screen" }}
            />
          </div>
          <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.045em] text-white">
            Votre fiche Byound Ready
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ready-muted)" }}>
            Pour protéger les données de vos stagiaires, saisissez le code à 6 chiffres envoyé à{" "}
            <strong className="text-white">{recipientMasked}</strong>.
          </p>

          {sending ? (
            <p className="mt-4 text-[13px]" style={{ color: "var(--ready-muted)" }}>
              Envoi du code…
            </p>
          ) : null}

          <div className="mt-6 flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Chiffre ${i + 1} du code`}
                maxLength={1}
                value={d}
                disabled={verifying}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(-1);
                  const next = [...digits];
                  next[i] = v;
                  setDigits(next);
                  if (v && i < 5) inputs.current[i + 1]?.focus();
                  const code = next.join("");
                  if (code.length === 6) void verify(code);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) {
                    inputs.current[i - 1]?.focus();
                  }
                }}
                className="h-12 w-10 rounded-[14px] text-center text-[20px] font-bold text-white outline-none disabled:opacity-60"
                style={{
                  background: "var(--ready-tile)",
                  border:
                    i === digits.findIndex((x) => !x)
                      ? "1px solid #FF0A30"
                      : "1px solid transparent",
                }}
              />
            ))}
          </div>

          {error ? (
            <p className="mt-4 text-[13px] text-[#FF6B8A]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={verifying || digits.join("").length !== 6}
            onClick={() => void verify(digits.join(""))}
            className="mt-6 w-full rounded-full bg-white py-3.5 text-[15px] font-extrabold text-black disabled:opacity-50"
          >
            {verifying ? "Vérification…" : "Accéder à ma fiche"}
          </button>

          <p className="mt-4 text-[12px]" style={{ color: "var(--ready-muted)" }}>
            {sent ? "Pas reçu ? " : ""}
            <button
              type="button"
              disabled={sending || verifying}
              onClick={() => {
                requestedRef.current = false;
                void requestCode(true);
              }}
              className="font-semibold underline-offset-2 disabled:opacity-50"
              style={{ color: "#FF5A00" }}
            >
              Renvoyer le code
            </button>
            {" · "}
            valable 10 minutes
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { label: "Lien personnel", icon: "🔒" },
              expiryLabel ? { label: `Expire le ${expiryLabel}`, icon: "⏱" } : null,
              { label: "Données chiffrées", icon: "🛡" },
            ]
              .filter(Boolean)
              .map((b) => (
                <span
                  key={b!.label}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium"
                  style={{ background: "var(--ready-tile)", color: "var(--ready-muted)" }}
                >
                  {b!.icon} {b!.label}
                </span>
              ))}
          </div>
        </div>
      </div>
      <p
        className="mt-auto pt-10 text-center text-[11px]"
        style={{ color: "var(--ready-muted)" }}
      >
        Byound Business · Ce lien vous a été envoyé après acceptation de votre devis.
      </p>
    </main>
  );
}
