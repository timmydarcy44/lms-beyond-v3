"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clearPinConfig,
  hashHandicapPin,
  isHandicapSessionUnlocked,
  isValidPinFormat,
  readPinConfig,
  randomSalt,
  setHandicapSessionUnlocked,
  writePinConfig,
} from "@/lib/handicap/pin-client";

/**
 * Overlay obligatoire avant tout contenu sous /dashboard/ecole/handicap :
 * bienvenue + création PIN (1re fois) ou saisie PIN (à chaque nouvel onglet / session).
 */
export function HandicapPinGate({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pinCreate, setPinCreate] = useState("");
  const [pinCreateConfirm, setPinCreateConfirm] = useState("");
  const [pinUnlock, setPinUnlock] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setUserId(null);
      setReady(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !userId) return;
    setUnlocked(isHandicapSessionUnlocked(userId));
  }, [ready, userId]);

  const hasConfiguredPin = userId ? Boolean(readPinConfig(userId)) : false;

  const handleCreatePin = useCallback(async () => {
    setError(null);
    if (!userId) return;
    if (!isValidPinFormat(pinCreate) || !isValidPinFormat(pinCreateConfirm)) {
      setError("Le code doit comporter 4 à 6 chiffres.");
      return;
    }
    if (pinCreate !== pinCreateConfirm) {
      setError("Les deux codes ne correspondent pas.");
      return;
    }
    const salt = randomSalt();
    const hash = await hashHandicapPin(pinCreate, userId, salt);
    writePinConfig(userId, salt, hash);
    setHandicapSessionUnlocked(userId);
    setUnlocked(true);
    setPinCreate("");
    setPinCreateConfirm("");
  }, [pinCreate, pinCreateConfirm, userId]);

  const handleUnlock = useCallback(async () => {
    setError(null);
    if (!userId) return;
    const cfg = readPinConfig(userId);
    if (!cfg) {
      setError("Aucun code défini pour ce navigateur.");
      return;
    }
    if (!isValidPinFormat(pinUnlock)) {
      setError("Saisissez votre code PIN (4 à 6 chiffres).");
      return;
    }
    const check = await hashHandicapPin(pinUnlock, userId, cfg.salt);
    if (check !== cfg.hash) {
      setError("Code incorrect.");
      return;
    }
    setHandicapSessionUnlocked(userId);
    setUnlocked(true);
    setPinUnlock("");
  }, [pinUnlock, userId]);

  if (!ready || !userId) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#121212]/95 px-6 text-center text-[#F5F2E8]">
        <p className="max-w-md text-sm text-white/80">Chargement de l&apos;espace référent…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#121212]/95 px-6 text-center text-[#F5F2E8]">
        <div className="max-w-md space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D65151]">Référent handicap</p>
          <h1 className="text-xl font-semibold tracking-tight">Bienvenue dans votre espace handicap</h1>
          <p className="text-sm text-white/70">
            Cet espace est réservé au référent handicap et à son code personnel. À la première visite sur cet appareil,
            créez un code PIN ; les visites suivantes le redemandent pour cet onglet.
          </p>
        </div>

        {!hasConfiguredPin ? (
          <div className="flex w-full max-w-sm flex-col gap-3 text-left">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Créer un code PIN</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="••••"
              maxLength={6}
              value={pinCreate}
              onChange={(e) => setPinCreate(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-lg tracking-[0.4em] text-white outline-none placeholder:text-white/25"
            />
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Confirmer</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="••••"
              maxLength={6}
              value={pinCreateConfirm}
              onChange={(e) => setPinCreateConfirm(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-lg tracking-[0.4em] text-white outline-none placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={() => void handleCreatePin()}
              className="mt-2 rounded-full bg-[#D65151] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
            >
              Enregistrer et accéder
            </button>
          </div>
        ) : (
          <div className="flex w-full max-w-sm flex-col gap-3 text-left">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Saisir le code PIN</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="••••"
              maxLength={6}
              value={pinUnlock}
              onChange={(e) => setPinUnlock(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-lg tracking-[0.4em] text-white outline-none placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={() => void handleUnlock()}
              className="mt-2 rounded-full bg-[#D65151] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
            >
              Accéder
            </button>
          </div>
        )}

        {error ? <p className="max-w-sm text-xs text-[#fca5a5]">{error}</p> : null}

        {!hasConfiguredPin ? (
          <p className="max-w-lg text-[11px] text-white/45">
            Le PIN est conservé uniquement sur ce navigateur pour le compte connecté (référent handicap).
          </p>
        ) : (
          <button
            type="button"
            className="text-[11px] text-white/40 underline decoration-dotted"
            onClick={() => {
              if (!userId) return;
              if (
                confirm(
                  "Réinitialiser le PIN ? Vous perdrez l’accès jusqu’à la création d’un nouveau code sur cet appareil.",
                )
              ) {
                clearPinConfig(userId);
                setError(null);
                setPinUnlock("");
              }
            }}
          >
            Code oublié — réinitialiser sur cet appareil
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
