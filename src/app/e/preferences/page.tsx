"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { registerPasskey, supportsPasskeys } from "@/lib/formation-attendance/webauthn-browser";

const BG = "#0A0C1B";
const SURFACE = "#141731";
const BORDER = "#262A4A";
const TEXT = "#F3F4FA";
const MUTED = "#A3A8C7";
const ACCENT = "#6C5CF5";

/**
 * Page « Changer ma façon d'émarger ».
 * Nécessite d'abord un code salle + identification (session cookie) pour agir sur les passkeys.
 */
export default function EmargementPreferencesPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<{
    has_passkey: boolean;
    prefer_otp: boolean;
    validation_pref: string;
    credentials: Array<{ id: string; synced: boolean }>;
    button_label: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const res = await fetch(`/api/attendance/passkey/prefs?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    setPrefs({
      has_passkey: Boolean(json.has_passkey),
      prefer_otp: Boolean(json.prefer_otp),
      validation_pref: json.validation_pref || "signature",
      credentials: json.credentials ?? [],
      button_label: json.button_label || "Face ID",
    });
  };

  const unlock = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const room = await fetch("/api/attendance/room-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const roomJson = await room.json();
      if (!room.ok) throw new Error(roomJson.error || "Code salle invalide");

      const otpReq = await fetch("/api/attendance/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const otpReqJson = await otpReq.json();
      if (!otpReq.ok) throw new Error(otpReqJson.error || "OTP impossible");
      setMessage("Code e-mail envoyé — saisissez-le ci-dessous pour déverrouiller les préférences.");
      setReady(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const [otp, setOtp] = useState("");
  const confirmOtp = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Code incorrect");
      await refresh();
      setMessage("Préférences déverrouillées.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!supportsPasskeys()) {
      setMessage("WebAuthn non supporté sur cet appareil — OTP uniquement.");
    }
  }, []);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/passkey/prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      await refresh();
      setMessage("Enregistré.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    setBusy(true);
    try {
      const optRes = await fetch("/api/attendance/passkey/register");
      const optJson = await optRes.json();
      if (!optRes.ok) throw new Error(optJson.error || "Activation impossible");
      const attestation = await registerPasskey(optJson.options);
      const verRes = await fetch("/api/attendance/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attestation }),
      });
      const verJson = await verRes.json();
      if (!verRes.ok) throw new Error(verJson.error || "Échec");
      await refresh();
      setMessage("Passkey activée.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (credentialId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/passkey/prefs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential_id: credentialId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      await refresh();
      setMessage("Passkey supprimée.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: BG, color: TEXT }}>
      <div className="mx-auto max-w-md space-y-5">
        <Link href="/e" className="text-sm" style={{ color: "#B7AEFF" }}>
          ← Retour émargement
        </Link>
        <h1 className="text-2xl font-bold">Changer ma façon d&apos;émarger</h1>
        <p className="text-sm" style={{ color: MUTED }}>
          Pour des raisons de sécurité, ouvrez cette page pendant un créneau (code salle + e-mail).
        </p>

        {!prefs ? (
          <section className="space-y-3 rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <input
              placeholder="Code salle (4 chiffres)"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full rounded-xl px-3 py-3"
              style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
            />
            <input
              type="email"
              placeholder="E-mail de référence"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-3"
              style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
            />
            {!ready ? (
              <button
                type="button"
                disabled={busy || code.length !== 4 || !email.includes("@")}
                onClick={() => void unlock()}
                className="w-full rounded-2xl py-3 font-semibold text-white disabled:opacity-40"
                style={{ background: ACCENT, minHeight: 44 }}
              >
                Envoyer un code e-mail
              </button>
            ) : (
              <>
                <input
                  placeholder="Code e-mail (6 chiffres)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl px-3 py-3"
                  style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
                />
                <button
                  type="button"
                  disabled={busy || otp.length !== 6}
                  onClick={() => void confirmOtp()}
                  className="w-full rounded-2xl py-3 font-semibold text-white"
                  style={{ background: ACCENT, minHeight: 44 }}
                >
                  Déverrouiller
                </button>
              </>
            )}
          </section>
        ) : (
          <section className="space-y-4 rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div>
              <p className="text-sm font-semibold">Méthode actuelle</p>
              <p className="text-sm" style={{ color: MUTED }}>
                {prefs.prefer_otp
                  ? "OTP e-mail à chaque fois"
                  : prefs.has_passkey
                    ? prefs.button_label
                    : "OTP e-mail"}
                {" · "}
                validation {prefs.validation_pref}
              </p>
            </div>

            {supportsPasskeys() && !prefs.has_passkey ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void activate()}
                className="w-full rounded-2xl py-3 font-semibold text-white"
                style={{ background: ACCENT, minHeight: 44 }}
              >
                Activer {prefs.button_label}
              </button>
            ) : null}

            {prefs.credentials.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  Passkey {c.synced ? "(synchronisée)" : ""}
                </span>
                <button
                  type="button"
                  className="text-red-300"
                  style={{ minHeight: 44 }}
                  onClick={() => void revoke(c.id)}
                >
                  Supprimer
                </button>
              </div>
            ))}

            <label className="flex items-center gap-2 text-sm" style={{ minHeight: 44 }}>
              <input
                type="checkbox"
                checked={prefs.prefer_otp}
                onChange={(e) => void patch({ prefer_otp: e.target.checked })}
              />
              OTP systématique (ignorer la passkey)
            </label>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Validation de présence</p>
              <select
                value={prefs.validation_pref}
                onChange={(e) => void patch({ validation_pref: e.target.value })}
                className="w-full rounded-xl px-3 py-3"
                style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
              >
                <option value="signature">Signature au doigt</option>
                <option value="confirmation">Bouton « Je confirme »</option>
              </select>
            </div>
          </section>
        )}

        {message ? <p className="text-sm" style={{ color: MUTED }}>{message}</p> : null}
      </div>
    </main>
  );
}
