"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";

type LivePayload = {
  live: {
    launch_id: string;
    mode: "qr" | "code_oral";
    code: string;
    refresh_in_s: number;
    slot_key_b64: string;
  } | null;
  enrolled: number;
  present: number;
  context: {
    title: string;
    clients: string[];
    day_part: string;
    slot_date: string;
    location: string | null;
  };
  roster: Array<{
    profile_id: string;
    name: string;
    signed: boolean;
    signed_at: string | null;
    method: string | null;
    status: string | null;
    needs_specific_support: boolean;
    first_activation: boolean;
    passkey: {
      has: boolean;
      synced: boolean;
      credential_ids: string[];
    };
    alerts: unknown[];
  }>;
  blocked_without_convention: Array<{ name: string; email: string }>;
  closure: { id: string } | null;
};

export default function TrainerEmargementPage() {
  const params = useParams();
  const slotId = String(params.slotId ?? "");
  const [data, setData] = useState<LivePayload | null>(null);
  const [mode, setMode] = useState<"qr" | "code_oral">("code_oral");
  const [physicalCount, setPhysicalCount] = useState("");
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/super-admin/crm/attendance/live?slot_id=${encodeURIComponent(slotId)}`);
    const json = await parseFetchJson<LivePayload & { error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error || "Chargement impossible");
      return;
    }
    setData(json);
    if (json.live?.mode) setMode(json.live.mode);
  }, [slotId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(t);
  }, [load]);

  // Keep screen awake in oral mode when possible
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    void (async () => {
      try {
        if (mode === "code_oral" && "wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      void lock?.release();
    };
  }, [mode]);

  const launch = async (nextMode: "qr" | "code_oral") => {
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/attendance/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: slotId, mode: nextMode }),
      });
      const json = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      setMode(nextMode);
      toast.success("Émargement lancé");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = async (nextMode: "qr" | "code_oral") => {
    if (!data?.live?.launch_id) {
      await launch(nextMode);
      return;
    }
    const res = await fetch("/api/super-admin/crm/attendance/launch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ launch_id: data.live.launch_id, mode: nextMode }),
    });
    if (!res.ok) {
      toast.error("Bascule impossible");
      return;
    }
    setMode(nextMode);
    await load();
  };

  const close = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/attendance/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slotId,
          physical_count: Number(physicalCount),
          person_seen_profile_ids: Object.entries(seen)
            .filter(([, v]) => v)
            .map(([id]) => id),
        }),
      });
      const json = await parseFetchJson<{ error?: string; code?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      toast.success("Émargement clôturé");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Clôture refusée");
    } finally {
      setBusy(false);
    }
  };

  const markManual = async (profileId: string) => {
    const res = await fetch("/api/super-admin/crm/attendance/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_id: slotId, profile_id: profileId, source: "appareil_formateur" }),
    });
    const json = await parseFetchJson<{ error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error || "Impossible");
      return;
    }
    toast.success("Présence enregistrée sur votre appareil");
    await load();
  };

  const revokePasskeys = async (row: LivePayload["roster"][number]) => {
    if (!row.passkey.credential_ids.length) return;
    if (
      !window.confirm(
        `Révoquer la passkey de ${row.name} ? La personne devra se réidentifier par e-mail.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      for (const credentialId of row.passkey.credential_ids) {
        const res = await fetch("/api/attendance/passkey/prefs", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential_id: credentialId }),
        });
        const json = await parseFetchJson<{ error?: string }>(res);
        if (!res.ok) throw new Error(json.error || "Révocation impossible");
      }
      toast.success("Passkey révoquée");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Révocation refusée");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C1B] px-4 py-6 text-[#F3F4FA]">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/super/crm/programmation" className="text-sm text-[#B7AEFF]">
            ← Programmation
          </Link>
          <Link
            href={`/super/crm/programmation/emarger/${slotId}/projeter`}
            className="text-sm text-[#B7AEFF]"
            target="_blank"
          >
            Écran projeté
          </Link>
        </div>

        <header>
          <h1 className="text-xl font-bold">{data?.context.title || "Émargement"}</h1>
          <p className="text-sm text-[#A3A8C7]">
            {(data?.context.clients ?? []).join(" · ")} · {data?.context.slot_date} ·{" "}
            {data?.context.day_part}
          </p>
        </header>

        <div className="flex gap-2">
          <Button
            type="button"
            className={mode === "code_oral" ? "flex-1 bg-[#6C5CF5]" : "flex-1 border-[#262A4A] bg-[#141731]"}
            variant={mode === "code_oral" ? "default" : "outline"}
            onClick={() => void switchMode("code_oral")}
          >
            Code oral
          </Button>
          <Button
            type="button"
            className={mode === "qr" ? "flex-1 bg-[#6C5CF5]" : "flex-1 border-[#262A4A] bg-[#141731]"}
            variant={mode === "qr" ? "default" : "outline"}
            onClick={() => void switchMode("qr")}
          >
            QR
          </Button>
        </div>

        {!data?.live ? (
          <Button
            type="button"
            disabled={busy}
            className="w-full bg-[#6C5CF5] text-white"
            onClick={() => void launch(mode)}
          >
            Lancer l&apos;émargement
          </Button>
        ) : (
          <div className="rounded-2xl border border-[#262A4A] bg-[#141731] p-6 text-center">
            {mode === "code_oral" ? (
              <>
                <p className="text-xs uppercase text-[#A3A8C7]">Annoncez ce code</p>
                <p className="mt-2 font-mono text-6xl font-bold tracking-[0.2em] text-white">
                  {data.live.code}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase text-[#A3A8C7]">Code de secours</p>
                <p className="mt-2 font-mono text-4xl font-bold tracking-[0.2em]">{data.live.code}</p>
                <p className="mt-2 text-sm text-[#A3A8C7]">
                  Ouvrez l&apos;écran projeté pour le QR tournant
                </p>
              </>
            )}
            <p className="mt-3 text-sm text-[#A3A8C7]">
              Renouvellement dans {data.live.refresh_in_s}s · page publique /e
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-[#262A4A] bg-[#141731] p-4">
          <p className="text-sm font-semibold">
            Présents {data?.present ?? 0} / {data?.enrolled ?? 0}
          </p>
          {(data?.blocked_without_convention?.length ?? 0) > 0 ? (
            <p className="mt-1 text-xs text-amber-200">
              {data!.blocked_without_convention.length} participant(s) bloqué(s) — convention non
              signée
            </p>
          ) : null}
          <ul className="mt-3 space-y-2">
            {(data?.roster ?? []).map((row) => (
              <li
                key={row.profile_id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {row.name}
                    {row.needs_specific_support ? (
                      <span className="ml-2 text-[10px] text-[#B7AEFF]">besoin spécifique</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[#A3A8C7]">
                    {row.signed
                      ? `Signé ${row.signed_at ? new Date(row.signed_at).toLocaleTimeString("fr-FR") : ""} · ${row.method}`
                      : "En attente"}
                    {Array.isArray(row.alerts) && row.alerts.length ? " · alerte" : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.first_activation ? (
                      <span className="rounded bg-[#6C5CF5]/25 px-1.5 py-0.5 text-[10px] text-[#B7AEFF]">
                        1re activation
                      </span>
                    ) : null}
                    {row.passkey.synced ||
                    (Array.isArray(row.alerts) && row.alerts.includes("passkey_synced")) ? (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                        synchronisée
                      </span>
                    ) : row.passkey.has ? (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-200">
                        passkey
                      </span>
                    ) : null}
                    {Array.isArray(row.alerts) && row.alerts.includes("otp_while_passkey_exists") ? (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                        OTP (passkey dispo)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <label className="text-[10px] text-[#A3A8C7]">
                    <input
                      type="checkbox"
                      checked={Boolean(seen[row.profile_id])}
                      onChange={(e) =>
                        setSeen((c) => ({ ...c, [row.profile_id]: e.target.checked }))
                      }
                    />{" "}
                    vu
                  </label>
                  {!row.signed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#262A4A] bg-transparent"
                      onClick={() => void markManual(row.profile_id)}
                    >
                      Sur mon appareil
                    </Button>
                  ) : null}
                  {row.passkey.has ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="text-[10px] text-red-300 disabled:opacity-40"
                      style={{ minHeight: 32 }}
                      onClick={() => void revokePasskeys(row)}
                    >
                      Révoquer passkey
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {!data?.closure ? (
          <div className="space-y-2 rounded-2xl border border-[#262A4A] bg-[#141731] p-4">
            <p className="text-sm font-semibold">Clôture formateur</p>
            <input
              type="number"
              min={0}
              placeholder="Nombre de personnes physiquement présentes"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
              className="w-full rounded-xl border border-[#262A4A] bg-[#0A0C1B] px-3 py-3 text-sm"
            />
            <Button
              type="button"
              disabled={busy || physicalCount === ""}
              className="w-full bg-[#6C5CF5]"
              onClick={() => void close()}
            >
              Clôturer l&apos;émargement
            </Button>
          </div>
        ) : (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            Créneau clôturé — émargement complet.
          </p>
        )}
      </div>
    </div>
  );
}
