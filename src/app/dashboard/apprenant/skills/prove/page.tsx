"use client";

import { Suspense } from "react";

import ProveInner from "./prove-inner";
import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { APPRENANT_PAGE_SHELL } from "@/lib/apprenant/connect-nav";

export default function SkillsProvePage() {
  return (
    <EdgePageAmbiance ambiance="skills">
      <Suspense
        fallback={
          <div className={`${APPRENANT_PAGE_SHELL} text-[14px] text-white/40`}>Chargement…</div>
        }
      >
        <ProveInner />
      </Suspense>
    </EdgePageAmbiance>
  );
}
