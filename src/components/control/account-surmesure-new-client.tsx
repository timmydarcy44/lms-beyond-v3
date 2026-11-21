"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountSurMesureForm } from "@/components/control/account-surmesure-form";
import { NEED_ANALYSIS_SURMESURE_STORAGE_KEY } from "@/lib/control/need-analyses";
import {
  EMPTY_SURMESURE_DRAFT,
  surmesureDetailHref,
  type SurMesureDraft,
} from "@/lib/training-courses/surmesure-ui";
import type { SurMesureOrgContext } from "@/lib/training-courses/surmesure-org-context";

export function SurMesureNewClient({
  organizationId,
  company,
}: {
  organizationId: string;
  company: SurMesureOrgContext;
}) {
  const router = useRouter();
  const [initialDraft, setInitialDraft] = useState<SurMesureDraft>(EMPTY_SURMESURE_DRAFT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const brief = sessionStorage.getItem(NEED_ANALYSIS_SURMESURE_STORAGE_KEY);
      if (brief?.trim()) {
        setInitialDraft({ ...EMPTY_SURMESURE_DRAFT, brief: brief.trim() });
        sessionStorage.removeItem(NEED_ANALYSIS_SURMESURE_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <AccountSurMesureForm
      organizationId={organizationId}
      company={company}
      initialDraft={initialDraft}
      onSaved={(courseId) => router.push(surmesureDetailHref(organizationId, courseId))}
    />
  );
}
