"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import type { CareExpertListItem } from "@/app/api/dashboard/apprenant/care/experts/route";

export default function ApprenantCarePage() {
  const [experts, setExperts] = useState<CareExpertListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/apprenant/care/experts", { credentials: "include" });
        const json = (await res.json()) as { experts?: CareExpertListItem[] };
        if (!cancelled) setExperts(json.experts ?? []);
      } catch {
        if (!cancelled) setExperts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <EdgePageAmbiance ambiance="care">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-3xl pb-24`}>
        <header className="space-y-2">
          <p className={APPRENANT_CARD_KICKER}>EDGE Care</p>
          <h1 className={APPRENANT_PAGE_TITLE}>Vos experts Care</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/45">
            Échangez avec des experts bien-être et accompagnement validés pour vous.
          </p>
        </header>

        {loading ? (
          <div className="mt-12 flex items-center gap-2 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des experts…
          </div>
        ) : experts.length === 0 ? (
          <div className="mt-12 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-[#3D7BFF]" />
            <div>
              <p className="text-[15px] font-semibold text-white">Aucun expert Care pour le moment</p>
              <p className={APPRENANT_CARD_MUTED}>
                Les experts apparaîtront ici dès qu’ils seront cochés « Care » dans /super.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {experts.map((expert) => {
              const name = [expert.firstName, expert.lastName].filter(Boolean).join(" ") || "Expert Care";
              return (
                <li
                  key={expert.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 transition hover:border-[#3D7BFF]/25"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
                    {expert.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={expert.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-[#7BA7FF]">
                        {(expert.firstName?.[0] || expert.lastName?.[0] || "E").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">{name}</p>
                    {expert.headline ? (
                      <p className="mt-0.5 truncate text-[13px] text-white/45">{expert.headline}</p>
                    ) : null}
                    {expert.specialties.length > 0 ? (
                      <p className="mt-1 truncate text-[12px] text-white/30">
                        {expert.specialties.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </EdgePageAmbiance>
  );
}
