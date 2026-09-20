"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import type { CareExpertListItem } from "@/app/api/dashboard/apprenant/care/experts/route";

const CARE_ACCENT = "#C70059";

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
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "rgba(255, 180, 210, 0.95)" }}
          >
            EDGE Care
          </p>
          <h1 className={APPRENANT_PAGE_TITLE}>Vos experts Care</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/55">
            Échangez avec des experts bien-être et accompagnement validés pour vous.
          </p>
        </header>

        {loading ? (
          <div className="mt-12 flex items-center gap-2 text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: CARE_ACCENT }} />
            Chargement des experts…
          </div>
        ) : experts.length === 0 ? (
          <div
            className="mt-12 flex items-start gap-3 rounded-2xl border p-5"
            style={{
              borderColor: "rgba(199, 0, 89, 0.28)",
              background: "rgba(199, 0, 89, 0.1)",
            }}
          >
            <HeartPulse className="mt-0.5 h-5 w-5 shrink-0" style={{ color: CARE_ACCENT }} />
            <div>
              <p className="text-[15px] font-semibold text-white">Aucun expert Care pour le moment</p>
              <p className="mt-1 text-[13px] text-white/50">
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
                  className="flex items-center gap-4 rounded-2xl border px-4 py-4 transition"
                  style={{
                    borderColor: "rgba(199, 0, 89, 0.22)",
                    background: "rgba(255, 255, 255, 0.04)",
                  }}
                >
                  <div
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full"
                    style={{ background: "rgba(199, 0, 89, 0.18)" }}
                  >
                    {expert.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={expert.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center text-[15px] font-semibold"
                        style={{ color: "#FFB4D2" }}
                      >
                        {(expert.firstName?.[0] || expert.lastName?.[0] || "E").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">{name}</p>
                    {expert.headline ? (
                      <p className="mt-0.5 truncate text-[13px] text-white/55">{expert.headline}</p>
                    ) : null}
                    {expert.specialties.length > 0 ? (
                      <p className="mt-1 truncate text-[12px] text-white/35">
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
