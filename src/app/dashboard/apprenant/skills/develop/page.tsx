"use client";

import { Suspense } from "react";

import DevelopInner from "./develop-inner";
import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { APPRENANT_PAGE_SHELL } from "@/lib/apprenant/connect-nav";

export default function SkillsDevelopPage() {
  return (
    <EdgePageAmbiance ambiance="skills">
      <Suspense
        fallback={
          <div className={`${APPRENANT_PAGE_SHELL} text-[14px] text-white/40`}>Chargement…</div>
        }
      >
        <DevelopInner />
      </Suspense>
    </EdgePageAmbiance>
  );
}
