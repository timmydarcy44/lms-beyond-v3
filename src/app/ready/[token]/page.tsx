"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AccessGate } from "@/components/ready/access-gate";
import { ExpiredScreen } from "@/components/ready/expired-screen";
import { ReadyFiche } from "@/components/ready/ready-fiche";
import {
  clearReadyClientSession,
  readReadyClientSession,
  readyAuthHeaders,
  saveReadyClientSession,
} from "@/lib/ready/client-session";
import type { ReadyFichePayload } from "@/lib/ready/types";

type GateState = {
  status: string;
  expires_at: string | null;
  recipient_masked: string;
  authenticated: boolean;
  submitted?: boolean;
};

export default function ReadyTokenPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const [gate, setGate] = useState<GateState | null>(null);
  const [fiche, setFiche] = useState<ReadyFichePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingFiche, setOpeningFiche] = useState(false);

  const fetchFiche = useCallback(async (): Promise<ReadyFichePayload> => {
    const fRes = await fetch(`/api/ready/${encodeURIComponent(token)}/fiche`, {
      headers: readyAuthHeaders(token),
      credentials: "include",
    });
    if (fRes.status === 401) {
      clearReadyClientSession(token);
      throw new Error("Session expirée — ressaisissez le code.");
    }
    if (fRes.status === 410) {
      throw new Error("Ce lien a expiré.");
    }
    const json = await fRes.json();
    if (!fRes.ok) throw new Error(json.error || "Fiche indisponible");
    return json as ReadyFichePayload;
  }, [token]);

  const loadGate = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ready/${encodeURIComponent(token)}`, {
        headers: readyAuthHeaders(token),
        credentials: "include",
      });
      const json = await res.json();
      if (res.status === 404) {
        setGate({
          status: "expired",
          expires_at: null,
          recipient_masked: "***",
          authenticated: false,
        });
        return;
      }
      if (!res.ok && json.status !== "expired" && json.status !== "blocked") {
        throw new Error(json.error || "Lien invalide");
      }
      if (json.status === "expired" || json.status === "blocked" || json.status === "revoked") {
        setGate({
          status: json.status,
          expires_at: json.expires_at ?? null,
          recipient_masked: json.recipient_masked || "***",
          authenticated: false,
        });
        return;
      }

      const hasClientSession = Boolean(readReadyClientSession(token));
      const next: GateState = {
        status: String(json.status || "active"),
        expires_at: json.expires_at ?? null,
        recipient_masked: String(json.recipient_masked || "***"),
        authenticated: Boolean(json.authenticated) || hasClientSession,
        submitted: Boolean(json.submitted),
      };
      setGate(next);

      if (next.authenticated || hasClientSession) {
        try {
          const payload = await fetchFiche();
          setFiche(payload);
          setGate((g) => (g ? { ...g, authenticated: true } : g));
        } catch {
          clearReadyClientSession(token);
          setGate({ ...next, authenticated: false });
          setFiche(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [token, fetchFiche]);

  useEffect(() => {
    void loadGate();
  }, [loadGate]);

  if (loading && !gate) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-[14px]"
        style={{ color: "var(--ready-muted)" }}
      >
        Chargement…
      </main>
    );
  }

  if (error && !gate) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-[14px] text-[#FF6B8A]">
        {error}
      </main>
    );
  }

  if (!gate || gate.status === "expired" || gate.status === "revoked") {
    return <ExpiredScreen />;
  }

  if (gate.status === "blocked") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <img
          src="/brand/logo-byound-blanc.png"
          alt="Byound"
          className="absolute left-4 top-6 h-7 w-auto"
        />
        <h1 className="text-[28px] font-extrabold tracking-[-0.045em] text-white">
          Accès temporairement bloqué
        </h1>
        <p className="mt-3 max-w-sm text-[14px]" style={{ color: "var(--ready-muted)" }}>
          Trop de codes incorrects. Réessayez dans 15 minutes.
        </p>
        <button
          type="button"
          className="mt-8 rounded-full bg-white px-6 py-3 text-[14px] font-extrabold text-black"
          onClick={() => void loadGate()}
        >
          Réessayer
        </button>
      </main>
    );
  }

  if (openingFiche) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
        style={{ color: "var(--ready-muted)" }}
      >
        <p className="text-[15px] font-semibold text-white">Ouverture de votre fiche…</p>
        <p className="mt-2 text-[13px]">Un instant.</p>
      </main>
    );
  }

  if (fiche) {
    return <ReadyFiche token={token} initial={fiche} />;
  }

  return (
    <AccessGate
      token={token}
      recipientMasked={gate.recipient_masked}
      expiresAt={gate.expires_at}
      onAuthenticated={async (sessionValue) => {
        saveReadyClientSession(token, sessionValue);
        setOpeningFiche(true);
        setError(null);
        try {
          const payload = await fetchFiche();
          setGate((g) => (g ? { ...g, authenticated: true } : g));
          setFiche(payload);
        } catch (e) {
          clearReadyClientSession(token);
          setOpeningFiche(false);
          throw e instanceof Error ? e : new Error("Fiche indisponible");
        } finally {
          setOpeningFiche(false);
        }
      }}
    />
  );
}
