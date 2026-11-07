"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";

/**
 * Écran projeté 1280×720 — QR = URL /e (pas de jeton dans l'URL).
 * Le code 4 chiffres tourne ; les apprenants saisissent sur /e.
 */
export default function EmargementProjectPage() {
  const params = useParams();
  const slotId = String(params.slotId ?? "");
  const [code, setCode] = useState("----");
  const [refreshIn, setRefreshIn] = useState(20);
  const [present, setPresent] = useState(0);
  const [enrolled, setEnrolled] = useState(0);
  const [title, setTitle] = useState("Formation");
  const [clients, setClients] = useState("");
  const [meta, setMeta] = useState("");
  const [roster, setRoster] = useState<Array<{ name: string; signed: boolean; signed_at: string | null }>>(
    [],
  );

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "byound.fr/e";
    return `${window.location.origin}/e`;
  }, []);

  const qrUrl = useMemo(() => {
    // QR pointe vers la page publique sans secret — le code oral/QR code digits font foi
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(publicUrl)}`;
  }, [publicUrl]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/super-admin/crm/attendance/live?slot_id=${encodeURIComponent(slotId)}`);
    const json = await parseFetchJson<{
      live?: { code: string; refresh_in_s: number } | null;
      present?: number;
      enrolled?: number;
      context?: { title: string; clients: string[]; day_part: string; slot_date: string };
      roster?: Array<{ name: string; signed: boolean; signed_at: string | null }>;
    }>(res);
    if (!res.ok) return;
    if (json.live?.code) setCode(json.live.code);
    if (json.live?.refresh_in_s != null) setRefreshIn(json.live.refresh_in_s);
    setPresent(json.present ?? 0);
    setEnrolled(json.enrolled ?? 0);
    setTitle(json.context?.title ?? "Formation");
    setClients((json.context?.clients ?? []).join(" · "));
    setMeta(`${json.context?.slot_date ?? ""} · ${json.context?.day_part ?? ""}`);
    setRoster(
      (json.roster ?? []).map((r) => ({
        name: r.name,
        signed: r.signed,
        signed_at: r.signed_at,
      })),
    );
  }, [slotId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(t);
  }, [load]);

  const progress = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C1B] p-6 text-[#F3F4FA]">
      <div className="grid h-[720px] w-[1280px] grid-cols-2 overflow-hidden rounded-2xl border border-[#262A4A] bg-[#141731]">
        <div className="flex flex-col justify-between border-r border-[#262A4A] p-10">
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
              {title} · {clients}
            </p>
          </div>
          <div className="flex items-end gap-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR code vers la page d'émargement" className="h-[280px] w-[280px] rounded-xl bg-white p-3" />
            <div>
              <p className="text-sm text-[#A3A8C7]">Code de secours</p>
              <p className="font-mono text-5xl font-bold tracking-[0.15em]">{code}</p>
              <p className="mt-2 text-sm text-[#A3A8C7]">
                Valable encore ~{refreshIn}s · renouvellement automatique
              </p>
              <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-[#0A0C1B]">
                <div
                  className="h-full bg-[#6C5CF5] transition-all"
                  style={{ width: `${(refreshIn / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-10">
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
          <ul className="mt-6 grid grid-cols-2 gap-2 overflow-y-auto">
            {roster.map((row) => (
              <li
                key={row.name}
                className="rounded-xl border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
              >
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-[#A3A8C7]">
                  {row.signed
                    ? `Signé à ${row.signed_at ? new Date(row.signed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}`
                    : "En attente"}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-4 text-xs text-[#A3A8C7]">
            Relance automatique des absents à la fermeture du créneau.
          </p>
        </div>
      </div>
    </div>
  );
}
