"use client";

import { useEffect, useState } from "react";

const BG = "#0A0C1B";
const SURFACE = "#141731";
const BORDER = "#262A4A";
const TEXT = "#F3F4FA";
const MUTED = "#A3A8C7";
const ACCENT = "#6C5CF5";
const OK = "#4ADE9B";

type Meta = {
  kind: string;
  title: string;
  status: string;
  signed_at: string | null;
  course_title: string | null;
  organization_name: string | null;
  of_name: string;
  amount_ht_cents: number | null;
  amount_ttc_cents: number | null;
  signable: boolean;
};

function euros(cents: number | null): string | null {
  if (cents == null) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

type Props = {
  token: string;
  acceptToken?: string | null;
};

export function PublicDocumentClient({ token, acceptToken: acceptProp = "" }: Props) {
  const [acceptToken, setAcceptToken] = useState(String(acceptProp || ""));
  const [meta, setMeta] = useState<Meta | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signed, setSigned] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (acceptProp) setAcceptToken(String(acceptProp));
  }, [acceptProp]);

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/formation-documents/${encodeURIComponent(token)}?meta=1`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Document introuvable");
        if (json.kind) {
          setMeta(json as Meta);
          if (json.status === "signed") setSigned(true);
        }
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erreur"));
  }, [token]);

  const canAccept = Boolean(acceptToken) && Boolean(meta?.signable) && !signed;

  const accept = async () => {
    if (!acceptToken.trim()) {
      setMessage("Lien d'acceptation incomplet — contactez Byound.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/formation-documents/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept_token: acceptToken.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Acceptation impossible");
      setSigned(true);
      setMessage("Document accepté. Merci.");
      setMeta((m) => (m ? { ...m, status: "signed" } : m));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const kindLabel =
    meta?.kind === "devis"
      ? "Devis"
      : meta?.kind === "convention"
        ? "Convention de formation"
        : meta?.title || "Document de formation";

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: BG, color: TEXT }}>
        <p className="text-sm text-red-300">{loadError}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: BG, color: TEXT }}>
      <div className="mx-auto max-w-md space-y-5">
        <header>
          <p className="text-sm font-semibold" style={{ color: "#B7AEFF" }}>
            {meta?.of_name || "Byound"}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{kindLabel}</h1>
          {meta?.organization_name ? (
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              {meta.organization_name}
              {meta.course_title ? ` · ${meta.course_title}` : ""}
            </p>
          ) : null}
          {meta?.amount_ht_cents != null ? (
            <p className="mt-3 text-lg font-semibold">
              {euros(meta.amount_ttc_cents ?? meta.amount_ht_cents)}
              <span className="ml-2 text-sm font-normal" style={{ color: MUTED }}>
                {meta.amount_ttc_cents != null ? "TTC" : "HT"}
              </span>
            </p>
          ) : null}
        </header>

        <section
          className="rounded-2xl p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <p className="text-sm" style={{ color: MUTED }}>
            {signed
              ? "Ce document a été accepté."
              : "Consultez le PDF, puis validez-le si une acceptation vous est demandée."}
          </p>
          <a
            href={`/api/formation-documents/${encodeURIComponent(token)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-2xl py-3.5 text-center font-semibold text-white"
            style={{ background: ACCENT, minHeight: 44 }}
          >
            Ouvrir le PDF
          </a>
        </section>

        {canAccept ? (
          <section
            className="space-y-3 rounded-2xl p-4"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-sm font-semibold">J&apos;accepte ce document</p>
            <p className="text-xs" style={{ color: MUTED }}>
              En acceptant, vous confirmez avoir pris connaissance du contenu et validez{" "}
              {meta?.kind === "devis" ? "ce devis" : "cette convention"}.
            </p>
            <button
              type="button"
              disabled={busy || signed}
              onClick={() => void accept()}
              className="w-full rounded-2xl py-3 font-semibold text-white disabled:opacity-40"
              style={{ background: signed ? OK : ACCENT, minHeight: 44 }}
            >
              {signed ? "Accepté" : "J'accepte"}
            </button>
          </section>
        ) : null}

        {signed && meta?.kind === "devis" ? (
          <p className="text-sm" style={{ color: OK }}>
            Devis accepté — Byound vous adressera la convention.
          </p>
        ) : null}
        {signed && meta?.kind === "convention" ? (
          <p className="text-sm" style={{ color: OK }}>
            Convention signée — les convocations pourront être envoyées.
          </p>
        ) : null}

        {message ? (
          <p className="text-sm" style={{ color: MUTED }}>
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
