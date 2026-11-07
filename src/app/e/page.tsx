"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  authenticatePasskey,
  registerPasskey,
  supportsPasskeys,
} from "@/lib/formation-attendance/webauthn-browser";

type Step =
  | "code"
  | "identify"
  | "otp"
  | "passkey_offer"
  | "validate"
  | "done"
  | "error";

const BG = "#0A0C1B";
const SURFACE = "#141731";
const BORDER = "#262A4A";
const TEXT = "#F3F4FA";
const MUTED = "#A3A8C7";
const ACCENT = "#6C5CF5";
const OK = "#4ADE9B";

export default function EmargementPublicPage() {
  const [step, setStep] = useState<Step>("code");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [context, setContext] = useState<{
    title: string;
    clients: string;
    day_part: string;
    slot_date: string;
    location: string | null;
  } | null>(null);
  const [validationMode, setValidationMode] = useState<"signature" | "confirmation">("signature");
  const [path, setPath] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [nextLabel, setNextLabel] = useState<string | null>(null);
  const [passkeyLabel, setPasskeyLabel] = useState("Signer avec Face ID");
  const [hasPasskey, setHasPasskey] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [firstActivation, setFirstActivation] = useState(false);
  const [credentialDbId, setCredentialDbId] = useState<string | null>(null);
  const [identificationMethod, setIdentificationMethod] = useState<"otp" | "passkey">("otp");
  const [positionnementUrl, setPositionnementUrl] = useState<string | null>(null);

  const code = useMemo(() => digits.join(""), [digits]);
  const canPasskey = supportsPasskeys();

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 3) document.getElementById(`code-${index + 1}`)?.focus();
  };

  const loadPrefs = async (forEmail?: string) => {
    const q = forEmail ? `?email=${encodeURIComponent(forEmail)}` : "";
    const res = await fetch(`/api/attendance/passkey/prefs${q}`);
    const json = (await res.json()) as {
      has_passkey?: boolean;
      show_passkey_offer?: boolean;
      button_label?: string;
      validation_pref?: string;
      prefer_otp?: boolean;
    };
    setHasPasskey(Boolean(json.has_passkey) && !json.prefer_otp);
    setShowOffer(Boolean(json.show_passkey_offer) && canPasskey);
    if (json.button_label) setPasskeyLabel(json.button_label);
    if (json.validation_pref === "confirmation") setValidationMode("confirmation");
  };

  const submitCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/room-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { error?: string; context?: typeof context };
      if (!res.ok) throw new Error(json.error || "Code invalide");
      setContext(json.context ?? null);
      setStep("identify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const tryPasskey = async () => {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch(
        `/api/attendance/passkey/authenticate?email=${encodeURIComponent(email)}`,
      );
      const optJson = (await optRes.json()) as {
        error?: string;
        options?: Parameters<typeof authenticatePasskey>[0];
        profile_id?: string;
      };
      if (!optRes.ok) throw new Error(optJson.error || "Passkey indisponible");
      const assertion = await authenticatePasskey(optJson.options!);
      const verRes = await fetch("/api/attendance/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion, profile_id: optJson.profile_id }),
      });
      const verJson = (await verRes.json()) as {
        error?: string;
        name?: string;
        credential_db_id?: string;
      };
      if (!verRes.ok) throw new Error(verJson.error || "Face ID échoué");
      setName(verJson.name || "");
      setCredentialDbId(verJson.credential_db_id ?? null);
      setIdentificationMethod("passkey");
      setFirstActivation(false);
      await loadPrefs(email);
      setStep("validate");
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} — utilisez votre e-mail.`
          : "Échec Face ID — utilisez votre e-mail.",
      );
      setHasPasskey(false);
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, otp }),
      });
      const json = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) throw new Error(json.error || "Code incorrect");
      setName(json.name || "");
      setIdentificationMethod("otp");
      await loadPrefs(email);
      const prefs = await fetch(`/api/attendance/passkey/prefs?email=${encodeURIComponent(email)}`).then(
        (r) => r.json(),
      );
      if (prefs.show_passkey_offer && canPasskey) {
        setShowOffer(true);
        setStep("passkey_offer");
      } else {
        setStep("validate");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const activatePasskey = async () => {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/attendance/passkey/register");
      const optJson = (await optRes.json()) as {
        error?: string;
        options?: Parameters<typeof registerPasskey>[0];
      };
      if (!optRes.ok) throw new Error(optJson.error || "Activation impossible");
      const attestation = await registerPasskey(optJson.options!);
      const verRes = await fetch("/api/attendance/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attestation }),
      });
      const verJson = (await verRes.json()) as {
        error?: string;
        credential_id?: string;
        first_activation?: boolean;
      };
      if (!verRes.ok) throw new Error(verJson.error || "Enregistrement refusé");
      setFirstActivation(Boolean(verJson.first_activation));
      setCredentialDbId(verJson.credential_id ?? null);
      setIdentificationMethod("passkey");
      setHasPasskey(true);
      setStep("validate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation échouée");
      setStep("validate");
    } finally {
      setBusy(false);
    }
  };

  const declinePasskey = async (value: "later" | "declined") => {
    await fetch("/api/attendance/passkey/prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey_prompt: value }),
    });
    setShowOffer(false);
    setStep("validate");
  };

  const submitPresence = async () => {
    setBusy(true);
    setError(null);
    try {
      const signatureSvg =
        validationMode === "signature"
          ? `<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="none" stroke="#111" stroke-width="2"/></svg>`
          : null;
      const res = await fetch("/api/attendance/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validation_mode: validationMode,
          signature_svg: signatureSvg,
          identification_method: identificationMethod,
          first_activation: firstActivation,
          credential_db_id: credentialDbId,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        signature?: { signed_at: string; name: string };
        next_slot_label?: string | null;
        positionnement_url?: string | null;
      };
      if (!res.ok) throw new Error(json.error || "Échec");
      setSignedAt(json.signature?.signed_at ?? new Date().toISOString());
      setName(json.signature?.name || name);
      setNextLabel(json.next_slot_label ?? null);
      setPositionnementUrl(json.positionnement_url ?? null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const onPointer = (type: "down" | "move" | "up", e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (type === "down") {
      setDrawing(true);
      setPath((p) => `${p} M ${x} ${y}`);
    } else if (type === "move" && drawing) {
      setPath((p) => `${p} L ${x} ${y}`);
    } else if (type === "up") {
      setDrawing(false);
    }
  };

  const dayPartLabel = context?.day_part === "matin" ? "matin" : "après-midi";

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={{ background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: ACCENT }}
            >
              B
            </span>
            <span className="text-lg font-semibold">Byound</span>
          </div>
          {step !== "code" && step !== "error" ? (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(74,222,155,0.15)", color: OK }}
            >
              ● Émargement ouvert
            </span>
          ) : null}
        </header>

        {context && step !== "code" ? (
          <section className="rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
              {context.clients} · SESSION
            </p>
            <h1 className="mt-1 text-lg font-bold">{context.title}</h1>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              {context.slot_date} · {dayPartLabel}
              {context.location ? ` · ${context.location}` : ""}
            </p>
          </section>
        ) : null}

        {step === "code" ? (
          <section className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h1 className="text-xl font-bold">Code de la salle</h1>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              Saisissez le code à 4 chiffres annoncé par le formateur.
            </p>
            <div className="mt-6 flex justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  inputMode="numeric"
                  aria-label={`Chiffre ${i + 1}`}
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  className="h-16 w-16 rounded-2xl text-center text-2xl font-bold outline-none"
                  style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={busy || code.length !== 4}
              onClick={() => void submitCode()}
              className="mt-6 w-full rounded-2xl py-3.5 text-base font-semibold text-white disabled:opacity-40"
              style={{ background: ACCENT, minHeight: 44 }}
            >
              Valider
            </button>
          </section>
        ) : null}

        {step === "identify" ? (
          <section className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h2 className="text-lg font-bold">Identifiez-vous</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              E-mail communiqué à Byound. Aucune liste de noms n&apos;est affichée.
            </p>
            <label className="mt-4 block text-sm" style={{ color: MUTED }} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email.includes("@")) void loadPrefs(email);
              }}
              className="mt-1 w-full rounded-xl px-3 py-3 text-base outline-none"
              style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
            />
            {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
            {hasPasskey && canPasskey ? (
              <button
                type="button"
                disabled={busy || !email.includes("@")}
                onClick={() => void tryPasskey()}
                className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-40"
                style={{ background: ACCENT, minHeight: 44 }}
              >
                {passkeyLabel}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy || !email.includes("@")}
              onClick={() => void requestOtp()}
              className="mt-3 w-full rounded-2xl py-3.5 font-semibold disabled:opacity-40"
              style={{
                background: hasPasskey ? "transparent" : ACCENT,
                color: hasPasskey ? "#B7AEFF" : "#fff",
                border: hasPasskey ? `1px solid ${BORDER}` : "none",
                minHeight: 44,
              }}
            >
              {hasPasskey ? "Utiliser mon e-mail" : "Recevoir un code par e-mail"}
            </button>
          </section>
        ) : null}

        {step === "otp" ? (
          <section className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h2 className="text-lg font-bold">Code reçu par e-mail</h2>
            <input
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-4 w-full rounded-xl px-3 py-3 text-center text-2xl tracking-[0.3em] outline-none"
              style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, minHeight: 44 }}
              aria-label="Code à 6 chiffres"
            />
            {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
            <button
              type="button"
              disabled={busy || otp.length !== 6}
              onClick={() => void verifyOtp()}
              className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-40"
              style={{ background: ACCENT, minHeight: 44 }}
            >
              Continuer
            </button>
          </section>
        ) : null}

        {step === "passkey_offer" && showOffer ? (
          <section className="rounded-2xl p-5 text-center" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              style={{ background: "rgba(108,92,245,0.2)", color: "#B7AEFF" }}
              aria-hidden
            >
              ⌾
            </div>
            <h2 className="mt-4 text-xl font-bold">Émargez en 3 secondes la prochaine fois</h2>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              La vérification se fait uniquement sur votre téléphone. Byound ne reçoit aucune image.
            </p>
            {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void activatePasskey()}
              className="mt-5 w-full rounded-2xl py-3.5 font-semibold text-white"
              style={{ background: ACCENT, minHeight: 44 }}
            >
              Activer
            </button>
            <button
              type="button"
              className="mt-2 w-full py-3 text-sm"
              style={{ color: "#B7AEFF", minHeight: 44 }}
              onClick={() => void declinePasskey("later")}
            >
              Plus tard
            </button>
            <button
              type="button"
              className="w-full py-2 text-sm"
              style={{ color: MUTED, minHeight: 44 }}
              onClick={() => void declinePasskey("declined")}
            >
              Non merci
            </button>
          </section>
        ) : null}

        {step === "validate" ? (
          <section className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <button
              type="button"
              className="text-sm"
              style={{ color: "#B7AEFF", minHeight: 44 }}
              onClick={() => {
                setStep("identify");
                setOtp("");
                setPath("");
              }}
            >
              ← Ce n&apos;est pas moi
            </button>
            <h2 className="mt-2 text-2xl font-bold">Bonjour {name}</h2>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              J&apos;atteste avoir été présent·e à la demi-journée de formation du {context?.slot_date},{" "}
              {dayPartLabel}.
            </p>
            {validationMode === "signature" ? (
              <>
                <div className="mt-4 flex items-center justify-between text-sm" style={{ color: "#B7AEFF" }}>
                  <span>Signez avec le doigt</span>
                  <button type="button" onClick={() => setPath("")} style={{ minHeight: 44 }}>
                    Effacer
                  </button>
                </div>
                <svg
                  className="mt-2 h-40 w-full touch-none rounded-xl bg-white"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => onPointer("down", e)}
                  onPointerMove={(e) => onPointer("move", e)}
                  onPointerUp={(e) => onPointer("up", e)}
                  onPointerLeave={(e) => onPointer("up", e)}
                >
                  <line x1="16" x2="100%" y1="120" y2="120" stroke="#CBD5E1" strokeDasharray="4 4" />
                  <path d={path} fill="none" stroke="#111" strokeWidth="2" />
                </svg>
                <button
                  type="button"
                  className="mt-2 text-sm"
                  style={{ color: MUTED, minHeight: 44 }}
                  onClick={() => setValidationMode("confirmation")}
                >
                  Je ne peux pas signer
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm" style={{ color: MUTED }}>
                Votre identification fait foi.
              </p>
            )}
            <p className="mt-3 text-xs" style={{ color: MUTED }}>
              Horodatage et appareil enregistrés comme preuve de présence.
            </p>
            {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
            <button
              type="button"
              disabled={busy || (validationMode === "signature" && !path)}
              onClick={() => void submitPresence()}
              className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-40"
              style={{ background: ACCENT, minHeight: 44 }}
            >
              {validationMode === "signature" ? "Valider ma présence" : "Je confirme ma présence"}
            </button>
          </section>
        ) : null}

        {step === "done" ? (
          <section className="rounded-2xl p-5 text-center" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
              style={{ background: OK }}
              aria-hidden
            >
              ✓
            </div>
            <h2 className="mt-4 text-xl font-bold">Présence enregistrée</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              {name}
              {signedAt
                ? ` · signé à ${new Date(signedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              Un récapitulatif vient de vous être envoyé par e-mail.
            </p>
            {nextLabel ? (
              <p className="mt-6 text-sm" style={{ color: MUTED }}>
                Prochaine signature : {nextLabel}
              </p>
            ) : null}
            {positionnementUrl ? (
              <a
                href={positionnementUrl}
                className="mt-4 block w-full rounded-2xl py-3.5 text-center font-semibold text-white"
                style={{ background: ACCENT, minHeight: 44 }}
              >
                Commencer le test de positionnement
              </a>
            ) : null}
          </section>
        ) : null}

        {step === "error" ? (
          <section className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h2 className="text-lg font-bold">Impossible de continuer</h2>
            <p className="mt-2 text-sm text-red-300">{error}</p>
            <button
              type="button"
              className="mt-4 w-full rounded-2xl py-3 font-semibold text-white"
              style={{ background: ACCENT, minHeight: 44 }}
              onClick={() => {
                setStep("code");
                setError(null);
                setDigits(["", "", "", ""]);
              }}
            >
              Réessayer
            </button>
          </section>
        ) : null}

        <Link
          href="/e/preferences"
          className="text-center text-sm"
          style={{ color: "#B7AEFF", minHeight: 44, display: "block", padding: "12px 0" }}
        >
          Changer ma façon d&apos;émarger
        </Link>
        <p className="pb-6 text-center text-[11px] leading-relaxed" style={{ color: MUTED }}>
          Face ID / empreinte / code téléphone : vérification uniquement sur votre appareil. Byound ne
          collecte aucune donnée biométrique.
        </p>
      </div>
    </main>
  );
}
