"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
} from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_hours?: number;
  module?: { name?: string } | null;
  class?: { name?: string } | null;
};

export default function FormateurPlanningPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const res = await fetch("/api/dashboard/formateur/emargement", { credentials: "include" });
      const json = res.ok ? await res.json().catch(() => null) : null;
      if (!ignore) {
        setSlots(Array.isArray(json?.slots) ? json.slots : []);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const upcoming = slots
    .filter((s) => new Date(s.ends_at).getTime() >= Date.now())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className={APPRENANT_CARD_KICKER}>Organisation</p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white">Mon planning</h1>
        <p className="text-[14px] text-white/40">
          Créneaux issus du planning école — source unique pour émargement et cahier de texte.
        </p>
      </header>

      <div className="space-y-2">
        {loading ? <p className={APPRENANT_CARD_MUTED}>Chargement…</p> : null}
        {!loading && upcoming.length === 0 ? (
          <p className={APPRENANT_CARD_MUTED}>Aucun créneau à venir.</p>
        ) : null}
        {upcoming.map((slot) => {
          const a = new Date(slot.starts_at);
          const b = new Date(slot.ends_at);
          return (
            <div key={slot.id} className={cn(APPRENANT_CARD_BODY, "sm:flex-row sm:items-center sm:justify-between")}>
              <div className="space-y-1">
                <p className="text-[12px] capitalize text-white/40">
                  {a.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className={APPRENANT_CARD_TITLE}>
                  {a.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} —{" "}
                  {b.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-[13px] text-white/70">
                  {slot.module?.name ?? "Séance"}
                  {slot.class?.name ? ` · ${slot.class.name}` : ""}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                <Link
                  href={`/dashboard/formateur/emargement?slotId=${slot.id}`}
                  className="rounded-xl bg-[#3D7BFF] px-3 py-2 text-[12px] font-semibold text-white"
                >
                  Émargement
                </Link>
                <Link
                  href={`/dashboard/formateur/cahier-de-texte?slot=${slot.id}`}
                  className="rounded-xl border border-white/[0.08] px-3 py-2 text-[12px] font-semibold text-white/70"
                >
                  Cahier
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
