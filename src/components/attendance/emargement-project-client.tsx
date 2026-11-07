"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";

type Props = { slotId: string };

/**
 * Écran projeté public — QR → /e?launch=[launchId].
 * Utilisable via /e?slot=… (fiable en prod) ou /e/p/[slotId].
 */
export function EmargementProjectClient({ slotId }: Props) {
  const [code, setCode] = useState("----");
  const [refreshIn, setRefreshIn] = useState(300);
  const [present, setPresent] = useState(0);
  const [enrolled, setEnrolled] = useState(0);
  const [title, setTitle] = useState("Formation");
  const [clients, setClients] = useState("");
  const [meta, setMeta] = useState("");
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<
    Array<{ name: string; signed: boolean; signed_at: string | null; minutes_late: number }>
  >([]);

  const qrUrl = useMemo(() => {
    if (!publicUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(publicUrl)}`;
  }, [publicUrl]);

  const load = useCallback(async () => {
    if (!slotId) return;
    const res = await fetch(`/api/attendance/project/${encodeURIComponent(slotId)}`);
    const json = await parseFetchJson<{
      open?: boolean;
      live?: {
        code: string;
        refresh_in_s: number;
        public_url?: string;
      } | null;
      present?: number;
      enrolled?: number;
      context?: {
        title: string;
        clients: string;
        day_part: string;
        slot_date: string;
        trainer_name?: string | null;
      };
      roster?: Array<{
        name: string;
        signed: boolean;
        signed_at: string | null;
        minutes_late?: number;
      }>;
      error?: string;
    }>(res);
    if (!res.ok) {
      setError(json.error || "Créneau introuvable");
      return;
    }
    setError(null);
    setOpen(Boolean(json.open && json.live));
    if (json.live?.code) setCode(json.live.code);
    if (json.live?.refresh_in_s != null) setRefreshIn(json.live.refresh_in_s);
    if (json.live?.public_url) setPublicUrl(json.live.public_url);
    else setPublicUrl("");
    setPresent(json.present ?? 0);
    setEnrolled(json.enrolled ?? 0);
    setTitle(json.context?.title ?? "Formation");
    setClients(json.context?.clients ?? "");
    setTrainerName(json.context?.trainer_name ?? null);
    setMeta(`${json.context?.slot_date ?? ""} · ${json.context?.day_part ?? ""}`);
    setRoster(
      (json.roster ?? []).map((r) => ({
        name: r.name,
        signed: r.signed,
        signed_at: r.signed_at,
        minutes_late: r.minutes_late ?? 0,
      })),
    );
  }, [slotId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(t);
  }, [load]);

  const launch = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/project/${encodeURIComponent(slotId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "qr" }),
      });
      const json = await parseFetchJson<{ error?: string; code?: string }>(res);
      if (!res.ok) {
        if (json.code === "auth_required") {
          window.location.href = `/login?next=${encodeURIComponent(`/e?slot=${slotId}`)}`;
          return;
        }
        throw new Error(json.error || "Lancement impossible");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const progress = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0;
  const refreshLabel = refreshIn >= 60 ? `${Math.ceil(refreshIn / 60)} min` : `${refreshIn}s`;
  const refreshBarPct = Math.min(100, Math.round((refreshIn / 300) * 100));

  if (error && !open && title === "Formation" && !meta.trim()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] px-4 text-[#F3F4FA]">
        <p className="text-red-300">{error}</p>
      </main>
    );
  }

  if (!open) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] px-4 text-[#F3F4FA]">
        <div className="w-full max-w-lg rounded-2xl border border-[#262A4A] bg-[#141731] p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#6C5CF5] font-bold">
            B
          </div>
          <p className="mt-6 text-sm uppercase tracking-wide text-[#A3A8C7]">{meta}</p>
          <h1 className="mt-2 text-2xl font-bold">{title}</h1>
          {clients ? <p className="mt-2 text-[#A3A8C7]">{clients}</p> : null}
          {trainerName ? (
            <p className="mt-1 text-sm text-[#B7AEFF]">Formateur·rice : {trainerName}</p>
          ) : null}
          <p className="mt-6 text-sm text-[#A3A8C7]">
            L&apos;écran projeté s&apos;active dès que vous lancez l&apos;émargement. Les apprenants
            scanneront le QR vers une page éphémère (cours + formateur).
          </p>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void launch()}
            className="mt-6 w-full rounded-2xl bg-[#6C5CF5] py-3.5 font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Ouverture…" : "Lancer l'émargement (QR)"}
          </button>
          <p className="mt-3 text-xs text-[#A3A8C7]">
            Compte formateur requis. Cette page disparaît à la fermeture du créneau.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C1B] p-6 text-[#F3F4FA]">
      <div className="grid h-[720px] w-[1280px] max-w-full grid-cols-1 overflow-hidden rounded-2xl border border-[#262A4A] bg-[#141731] lg:grid-cols-2">
        <div className="flex flex-col justify-between border-b border-[#262A4A] p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6C5CF5] font-bold">
                B
              </span>
              <span className="text-xl font-semibold">Byound</span>
            </div>
            <p className="mt-8 text-sm uppercase tracking-wide text-[#A3A8C7]">{meta}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">Scannez pour signer votre présence</h1>
            <p className="mt-3 text-lg text-[#A3A8C7]">
              {title}
              {clients ? ` · ${clients}` : ""}
            </p>
            {trainerName ? (
              <p className="mt-1 text-sm text-[#B7AEFF]">Formateur·rice : {trainerName}</p>
            ) : null}
            {publicUrl ? (
              <p className="mt-2 text-sm text-[#B7AEFF]">{publicUrl.replace(/^https?:\/\//, "")}</p>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap items-end gap-8">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR code vers la page d'émargement de la session"
                className="h-[240px] w-[240px] rounded-xl bg-white p-3 lg:h-[280px] lg:w-[280px]"
              />
            ) : null}
            <div>
              <p className="text-sm text-[#A3A8C7]">Code de secours</p>
              <p className="font-mono text-5xl font-bold tracking-[0.15em]">{code}</p>
              <p className="mt-2 text-sm text-[#A3A8C7]">
                Valable encore ~{refreshLabel} · renouvellement automatique
              </p>
              <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-[#0A0C1B]">
                <div className="h-full bg-[#6C5CF5] transition-all" style={{ width: `${refreshBarPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-8 lg:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A3A8C7]">Présents</p>
              <p className="text-4xl font-bold">
                {present} / {enrolled}
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-[#4ADE9B]">
              Mise à jour en direct
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0A0C1B]">
            <div className="h-full bg-[#4ADE9B]" style={{ width: `${progress}%` }} />
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {roster.map((row) => (
              <li
                key={row.name}
                className="rounded-xl border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
              >
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-[#A3A8C7]">
                  {row.signed
                    ? `Signé à ${row.signed_at ? new Date(row.signed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}${row.minutes_late > 0 ? ` · retard ${row.minutes_late} min` : ""}`
                    : "En attente"}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-4 text-xs text-[#A3A8C7]">
            Page éphémère — se ferme avec le créneau. Relance des absents à la clôture.
          </p>
        </div>
      </div>
    </div>
  );
}
