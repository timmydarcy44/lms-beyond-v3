"use client";

import { useRouter } from "next/navigation";
import { AccountSurMesureForm } from "@/components/control/account-surmesure-form";
import {
  type SurMesureDraft,
  surmesureDetailHref,
} from "@/lib/training-courses/surmesure-ui";
import type { SurMesureOrgContext } from "@/lib/training-courses/surmesure-org-context";

export function SurMesureEditClient({
  organizationId,
  courseId,
  initialDraft,
  company,
}: {
  organizationId: string;
  courseId: string;
  initialDraft: SurMesureDraft;
  company: SurMesureOrgContext;
}) {
  const router = useRouter();
  return (
    <AccountSurMesureForm
      organizationId={organizationId}
      courseId={courseId}
      company={company}
      initialDraft={initialDraft}
      onSaved={() => router.push(surmesureDetailHref(organizationId, courseId))}
    />
  );
}
