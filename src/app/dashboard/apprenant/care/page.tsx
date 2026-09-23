"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { APPRENANT_PAGE_SHELL } from "@/lib/apprenant/connect-nav";
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
            EDGE Care
          </p>
          <h1 className="text-[1.85rem] font-bold tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.1rem]">
            Vos experts Care
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-black/55">
            Échangez avec des experts bien-être et accompagnement validés pour vous.
          </p>
        </header>

        {loading ? (
          <div className="mt-12 flex items-center gap-2 text-black/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des experts…
          </div>
        ) : experts.length === 0 ? (
          <div className="mt-12 flex items-start gap-3 rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-black/40" />
            <div>
              <p className="text-[15px] font-semibold text-[#0a0a0a]">
                Aucun expert Care pour le moment
              </p>
              <p className="mt-1 text-[13px] text-black/55">
                Les experts apparaîtront ici dès qu’ils seront cochés « Care » dans /super.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {experts.map((expert) => {
              const name =
                [expert.firstName, expert.lastName].filter(Boolean).join(" ") || "Expert Care";
              return (
                <li
                  key={expert.id}
                  className="flex items-center gap-4 rounded-2xl border border-black/8 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-sm transition hover:border-black/15"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black/[0.06]">
                    {expert.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={expert.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-black/50">
                        {(expert.firstName?.[0] || expert.lastName?.[0] || "E").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[#0a0a0a]">{name}</p>
                    {expert.headline ? (
                      <p className="mt-0.5 truncate text-[13px] text-black/55">{expert.headline}</p>
                    ) : null}
                    {expert.specialties.length > 0 ? (
                      <p className="mt-1 truncate text-[12px] text-black/40">
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
