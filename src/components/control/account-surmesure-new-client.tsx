"use client";

import { useRouter } from "next/navigation";
import { AccountSurMesureForm } from "@/components/control/account-surmesure-form";
import {
  EMPTY_SURMESURE_DRAFT,
  surmesureDetailHref,
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
  return (
    <AccountSurMesureForm
      organizationId={organizationId}
      company={company}
      initialDraft={EMPTY_SURMESURE_DRAFT}
      onSaved={(courseId) => router.push(surmesureDetailHref(organizationId, courseId))}
    />
  );
}
