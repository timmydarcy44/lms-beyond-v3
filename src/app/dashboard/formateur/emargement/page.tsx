"use client";

import { useCallback, useEffect, useState } from "react";
import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus } from "@/lib/ecole/attendance";
import { cn } from "@/lib/utils";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_hours?: number;
  module?: { name?: string } | null;
  class?: { name?: string } | null;
};

type Session = {
  id: string;
  slot_id: string;
  status: string;
};

type RecordRow = {
  id: string;
  status: string;
  checkin_at?: string | null;
  checkout_at?: string | null;
  learner?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    full_name?: string;
  } | null;
};

export default function FormateurEmargementPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/formateur/emargement", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setSlots(json.slots ?? []);
    setSessions(json.sessions ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadRecords = async (sid: string) => {
    const res = await fetch("/api/dashboard/formateur/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "list_records", session_id: sid }),
    });
    const json = await res.json();
    setRecords(json.records ?? []);
  };

  const openCheckin = async (slotId: string) => {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/dashboard/formateur/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "open_session", slot_id: slotId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Impossible d’ouvrir l’émargement");
      return;
    }
    setSelectedSlot(slotId);
    setSessionId(json.session?.id ?? null);
    setQrUrl(json.qr_url ?? null);
    setMessage(`Entrée ouverte · ${json.learners_count ?? 0} apprenant(s)`);
    if (json.session?.id) await loadRecords(json.session.id);
    await load();
  };

  const openCheckout = async () => {
    if (!sessionId) return;
    const res = await fetch("/api/dashboard/formateur/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "open_checkout", session_id: sessionId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setQrUrl(json.qr_url ?? null);
    setMessage("Sortie ouverte — présentez le QR");
  };

  const closeSession = async () => {
    if (!sessionId) return;
    if (!confirm("Fermer l’émargement ? Les non-émargés seront absents automatiquement.")) return;
    const res = await fetch("/api/dashboard/formateur/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "close_session", session_id: sessionId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setQrUrl(null);
    setMessage(`Session fermée · ${json.absences_created ?? 0} absence(s) créée(s)`);
    await loadRecords(sessionId);
    await load();
  };

  const correct = async (recordId: string, status: string) => {
    const reason = window.prompt("Motif de la correction (optionnel)") || undefined;
    await fetch("/api/dashboard/formateur/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "correct_status", record_id: recordId, status, reason }),
    });
    if (sessionId) await loadRecords(sessionId);
  };

  const sessionBySlot = new Map(sessions.map((s) => [s.slot_id, s]));

  return (
    <div className="space-y-6 text-white">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Présences</p>
          <h1 className="mt-1 text-3xl font-bold">Émargement</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">
            Lancez l’émargement entrée / sortie via QR sécurisé. Les absences sont créées automatiquement à la fermeture.
          </p>
        </header>

        {error ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}
        {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            {slots.map((slot) => {
              const sess = sessionBySlot.get(slot.id);
              return (
                <div
                  key={slot.id}
                  className={cn(
                    "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
                    selectedSlot === slot.id && "ring-1 ring-[#3D7BFF]/40",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{slot.class?.name ?? "Classe"}</p>
                      <p className="text-white/80">{slot.module?.name ?? "Cours"}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {new Date(slot.starts_at).toLocaleString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" → "}
                        {new Date(slot.ends_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {slot.duration_hours != null ? ` · ${slot.duration_hours} h` : ""}
                      </p>
                      {sess ? (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#3D7BFF]">
                          {sess.status}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void openCheckin(slot.id)}
                      className="rounded-xl bg-[#3D7BFF] px-3 py-2 text-sm font-semibold"
                    >
                      Lancer l’émargement
                    </button>
                  </div>
                </div>
              );
            })}
            {slots.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
                Aucun créneau formateur à venir. Les cours planifiés avec votre fiche formateur apparaîtront ici.
              </p>
            ) : null}
          </section>

          <aside className="space-y-4">
            {qrUrl ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/35">QR temporaire</p>
                {/* QR via API publique sans dépendance npm */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR émargement"
                  className="mx-auto mt-3 rounded-xl bg-white p-2"
                />
                <p className="mt-2 break-all text-[10px] text-white/30">{qrUrl}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void openCheckout()}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold"
                  >
                    Passer en sortie
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!sessionId) return;
                      const res = await fetch("/api/dashboard/formateur/emargement", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ action: "generate_code", session_id: sessionId, phase: "checkin" }),
                      });
                      const json = await res.json();
                      if (res.ok) setMessage(`Code session : ${json.code} (valable ${json.ttl_minutes} min)`);
                      else setError(json.error || "Erreur code");
                    }}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold"
                  >
                    Afficher un code temporaire
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!sessionId) return;
                      const res = await fetch("/api/dashboard/formateur/emargement", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ action: "send_sms_codes", session_id: sessionId, phase: "checkin" }),
                      });
                      const json = await res.json();
                      if (res.ok) {
                        setMessage(
                          `SMS : ${json.sent} envoyé(s). Code ${json.code}${json.failures?.length ? ` · ${json.failures.length} sans numéro` : ""}`,
                        );
                      } else setError(json.error || "Erreur SMS");
                    }}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold"
                  >
                    Envoyer le code par SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => void closeSession()}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold"
                  >
                    Fermer la session
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
                Lancez un cours pour afficher le QR.
              </div>
            )}

            {records.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/35">Apprenants</p>
                <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                  {records.map((r) => {
                    const name =
                      String(r.learner?.full_name ?? "").trim() ||
                      `${r.learner?.first_name ?? ""} ${r.learner?.last_name ?? ""}`.trim() ||
                      r.learner?.email ||
                      "Apprenant";
                    return (
                      <li key={r.id} className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-[11px] text-white/40">
                              {ATTENDANCE_STATUS_LABELS[r.status as AttendanceStatus] ?? r.status}
                            </p>
                          </div>
                          <select
                            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px]"
                            value={r.status}
                            onChange={(e) => void correct(r.id, e.target.value)}
                          >
                            {Object.entries(ATTENDANCE_STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
    </div>
  );
}
