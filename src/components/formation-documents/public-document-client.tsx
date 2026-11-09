"use client";

import { Manrope } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/money/format-euro";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const BG = "#0A0B12";
const CARD = "#15171E";
const VIOLET = "#6E5BFF";
const GREEN = "#6BE39B";
const YELLOW = "#F5C85C";
const MUTED = "#9AA0B5";
const TEXT = "#F3F4FA";

type TimelineStep = {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
  detail: string | null;
};

type Meta = {
  kind: string;
  title: string;
  status: string;
  signed_at: string | null;
  course_title: string | null;
  organization_name: string | null;
  of_name: string;
  amount_ht_cents: number | null;
  amount_tva_cents: number | null;
  amount_ttc_cents: number | null;
  signable: boolean;
  quote_number: string | null;
  valid_until: string | null;
  issued_at: string | null;
  contact_name: string | null;
  signer_name: string | null;
  signer_role: string | null;
  cgv_version: string | null;
  cgv_path: string;
  superseded: boolean;
  expired: boolean;
  page_state: "pending" | "accepted" | "expired" | "superseded";
  timeline: TimelineStep[];
  account_manager: {
    name: string;
    email: string | null;
    phone: string | null;
    initials: string;
  } | null;
};

type Props = {
  token: string;
  acceptToken?: string | null;
};

function initials(name: string | null | undefined): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "BY";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: undefined,
  });
}

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PublicDocumentClient({ token, acceptToken: acceptProp = "" }: Props) {
  const [acceptToken, setAcceptToken] = useState(String(acceptProp || ""));
  const [meta, setMeta] = useState<Meta | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const [cgvOk, setCgvOk] = useState(false);
  const [modifOpen, setModifOpen] = useState(false);
  const [modifMessage, setModifMessage] = useState("");
  const [modifBusy, setModifBusy] = useState(false);

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
          if (json.contact_name && !signerName) setSignerName(String(json.contact_name));
          if (json.signer_name) setSignerName(String(json.signer_name));
          if (json.signer_role) setSignerRole(String(json.signer_role));
        }
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from meta
  }, [token]);

  const pageState = meta?.page_state ?? "pending";
  const signed = pageState === "accepted";
  const canAccept =
    Boolean(acceptToken) &&
    Boolean(meta?.signable) &&
    pageState === "pending" &&
    meta?.kind === "devis";

  const ht = meta?.amount_ht_cents ?? null;
  const tva = meta?.amount_tva_cents ?? null;
  const ttc =
    meta?.amount_ttc_cents ??
    (ht != null && tva != null ? ht + tva : ht);

  const statusPill = useMemo(() => {
    if (pageState === "accepted") {
      return { bg: "rgba(107,227,155,0.18)", color: GREEN, label: "● Accepté" };
    }
    if (pageState === "expired") {
      return { bg: "rgba(154,160,181,0.18)", color: MUTED, label: "● Expiré" };
    }
    if (pageState === "superseded") {
      return {
        bg: "rgba(154,160,181,0.18)",
        color: MUTED,
        label: "● Remplacé par une nouvelle version",
      };
    }
    return {
      bg: "rgba(245,200,92,0.18)",
      color: YELLOW,
      label: "● En attente de votre accord",
    };
  }, [pageState]);

  const acceptDisabled = busy || !cgvOk || !signerName.trim();

  const accept = async () => {
    if (!acceptToken.trim() || acceptDisabled) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/formation-documents/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accept_token: acceptToken.trim(),
          signer_name: signerName.trim(),
          signer_role: signerRole.trim() || null,
          cgv_accepted: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Acceptation impossible");
      setMessage("Document accepté. Merci.");
      setMeta((m) =>
        m
          ? {
              ...m,
              status: "signed",
              signed_at: json.signed_at || new Date().toISOString(),
              signer_name: signerName.trim(),
              signer_role: signerRole.trim() || null,
              page_state: "accepted",
              signable: false,
              timeline: (m.timeline || []).map((step, i) =>
                i === 0
                  ? {
                      ...step,
                      state: "done",
                      detail: `${formatShortDate(json.signed_at)} · ${signerName.trim()}`,
                    }
                  : i === 1
                    ? { ...step, state: "current" }
                    : step,
              ),
            }
          : m,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const sendModif = async () => {
    if (!modifMessage.trim()) return;
    setModifBusy(true);
    try {
      const res = await fetch(
        `/api/formation-documents/${encodeURIComponent(token)}/request-change`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accept_token: acceptToken.trim() || undefined,
            message: modifMessage.trim(),
            contact_name: signerName.trim() || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setModifOpen(false);
      setModifMessage("");
      setMessage("Demande envoyée à votre contact Byound.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setModifBusy(false);
    }
  };

  if (loadError) {
    return (
      <main
        className={`${manrope.className} flex min-h-screen items-center justify-center px-4`}
        style={{ background: BG, color: TEXT }}
      >
        <div className="max-w-sm text-center">
          <p className="text-sm text-red-300">{loadError}</p>
          <p className="mt-2 text-xs" style={{ color: MUTED }}>
            Lien invalide ou document introuvable.
          </p>
        </div>
      </main>
    );
  }

  const quoteLabel = meta?.quote_number || "Devis";
  const orgName = meta?.organization_name || "Client";
  const contactPerson = (meta?.contact_name || "").trim() || orgName;
  const course = meta?.course_title || meta?.title || "Formation";
  const manager = meta?.account_manager;
  const mailto = manager?.email
    ? `mailto:${manager.email}?subject=${encodeURIComponent(`Devis ${quoteLabel}`)}`
    : null;
  const tel = manager?.phone ? `tel:${manager.phone.replace(/\s+/g, "")}` : null;

  return (
    <main
      className={`${manrope.className} min-h-screen px-4 py-6`}
      style={{ background: BG, color: TEXT }}
    >
      <div className="mx-auto w-full space-y-4" style={{ maxWidth: 480 }}>
        <header className="flex items-center gap-2.5 pt-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold text-white"
            style={{ background: VIOLET }}
          >
            B
          </div>
          <span className="text-base font-extrabold tracking-tight">Byound</span>
        </header>

        <section
          className="overflow-hidden rounded-[28px] p-5 shadow-[0_20px_60px_rgba(110,91,255,0.28)]"
          style={{
            background: "linear-gradient(145deg, #1A1440 0%, #3A2BA0 48%, #6E5BFF 100%)",
          }}
        >
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: statusPill.bg, color: statusPill.color }}
          >
            {statusPill.label}
          </span>
          <p className="mt-3 text-sm text-white/85">
            {signed
              ? `Devis n° ${quoteLabel} · accepté le ${formatShortDate(meta?.signed_at)} par ${
                  meta?.signer_name || "—"
                }`
              : `Devis n° ${quoteLabel} · émis le ${formatShortDate(meta?.issued_at)}`}
          </p>
          <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight text-white">
            {ttc != null ? formatEuro(ttc) : "—"}
          </p>
          <p className="mt-2 text-sm text-white/80">
            TTC
            {ht != null
              ? ` · soit ${formatEuro(ht)} HT${tva != null ? ` + ${formatEuro(tva)} de TVA` : ""}`
              : ""}
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1A1440]">
              {initials(contactPerson)}
            </div>
            <div>
              <p className="font-semibold text-white">{contactPerson}</p>
              <p className="text-xs text-white/75">
                {meta?.contact_name && orgName && meta.contact_name.trim() !== orgName
                  ? `${orgName} · `
                  : ""}
                Proposé par {meta?.of_name || "SAS Byound Business"}
              </p>
            </div>
          </div>
        </section>

        {signed ? (
          <section className="rounded-3xl p-4" style={{ background: CARD }}>
            <div className="mb-4 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "rgba(107,227,155,0.2)", color: GREEN }}
              >
                ✓
              </span>
              <p className="text-sm font-semibold">Merci, c&apos;est validé. Voici la suite.</p>
            </div>
            <ol className="space-y-0">
              {(meta?.timeline || []).map((step, idx, arr) => (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background:
                          step.state === "done"
                            ? GREEN
                            : step.state === "current"
                              ? "rgba(110,91,255,0.35)"
                              : "transparent",
                        color: step.state === "done" ? "#0A0B12" : TEXT,
                        border:
                          step.state === "todo" ? `1.5px solid ${MUTED}` : "none",
                      }}
                    >
                      {step.state === "done" ? "✓" : idx + 1}
                    </span>
                    {idx < arr.length - 1 ? (
                      <span className="my-1 w-px flex-1 bg-white/15" style={{ minHeight: 18 }} />
                    ) : null}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold">{step.label}</p>
                    {step.detail ? (
                      <p className="text-xs" style={{ color: MUTED }}>
                        {step.detail}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="rounded-3xl p-4" style={{ background: CARD }}>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-11 flex-col overflow-hidden rounded-md bg-white">
              <div className="h-3 w-full" style={{ background: VIOLET }} />
              <div className="flex-1 space-y-1 p-1.5">
                <div className="h-1 rounded bg-black/15" />
                <div className="h-1 w-3/4 rounded bg-black/10" />
                <div className="h-1 w-1/2 rounded bg-black/10" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {signed ? `Devis signé ${quoteLabel}.pdf` : `Devis ${quoteLabel}.pdf`}
              </p>
              <p className="truncate text-xs" style={{ color: MUTED }}>
                {signed
                  ? `Accepté le ${formatShortDate(meta?.signed_at)} · avec mention de l'acceptation`
                  : `1 page · ${course}`}
              </p>
            </div>
          </div>
          <a
            href={`/api/formation-documents/${encodeURIComponent(token)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-full py-3.5 text-center text-sm font-bold text-white"
            style={{ background: VIOLET, minHeight: 48 }}
          >
            Voir le devis →
          </a>
        </section>

        {canAccept ? (
          <section className="space-y-3 rounded-3xl p-4" style={{ background: CARD }}>
            <div>
              <p className="text-base font-bold">Accepter le devis</p>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>
                Après l&apos;avoir consulté, validez-le ici.
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: MUTED }}>
                Nom et prénom du signataire
              </span>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-[#6E5BFF]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: MUTED }}>
                Fonction
              </span>
              <input
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                placeholder="Ex. Responsable RH"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#6E5BFF]"
              />
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={cgvOk}
                onChange={(e) => setCgvOk(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#6E5BFF]"
              />
              <span>
                J&apos;accepte le devis et les{" "}
                <a
                  href={meta?.cgv_path || "/cgv"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: VIOLET }}
                >
                  conditions générales de vente
                </a>
                .
              </span>
            </label>
            <button
              type="button"
              disabled={acceptDisabled}
              onClick={() => void accept()}
              className="w-full rounded-full bg-white py-3.5 text-sm font-extrabold text-black disabled:opacity-40"
              style={{ minHeight: 48 }}
            >
              {busy ? "Signature en cours…" : "Accepter et signer"}
            </button>
            <button
              type="button"
              onClick={() => setModifOpen((v) => !v)}
              className="w-full text-center text-sm font-medium"
              style={{ color: MUTED }}
            >
              Demander une modification
            </button>
            {modifOpen ? (
              <div className="space-y-2 rounded-2xl border border-white/10 p-3">
                <textarea
                  value={modifMessage}
                  onChange={(e) => setModifMessage(e.target.value)}
                  rows={3}
                  placeholder="Décrivez la modification souhaitée…"
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  disabled={modifBusy || !modifMessage.trim()}
                  onClick={() => void sendModif()}
                  className="w-full rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: VIOLET }}
                >
                  {modifBusy ? "Envoi…" : "Envoyer la demande"}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {manager ? (
          <section
            className="flex items-center gap-3 rounded-3xl p-3.5"
            style={{ background: CARD }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: "#1C1F2B" }}
            >
              {manager.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Une question ?</p>
              <p className="truncate text-xs" style={{ color: MUTED }}>
                {manager.name} · votre contact Byound
              </p>
            </div>
            <div className="flex gap-2">
              {tel ? (
                <a
                  href={tel}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm"
                  style={{ background: "#1C1F2B" }}
                  aria-label="Appeler"
                >
                  ☎
                </a>
              ) : null}
              {mailto ? (
                <a
                  href={mailto}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm"
                  style={{ background: "#1C1F2B" }}
                  aria-label="E-mail"
                >
                  ✉
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        {message ? (
          <p className="text-center text-sm" style={{ color: MUTED }}>
            {message}
          </p>
        ) : null}

        <footer className="pb-6 text-center text-[11px] leading-relaxed" style={{ color: MUTED }}>
          <p>SAS Byound Business · TVA FR30130709058</p>
          {meta?.valid_until ? (
            <p className="mt-1">
              Devis valable jusqu&apos;au {formatLongDate(meta.valid_until)}. Son acceptation vaut
              commande, sous réserve de la convention de formation.
            </p>
          ) : (
            <p className="mt-1">
              Son acceptation vaut commande, sous réserve de la convention de formation.
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
