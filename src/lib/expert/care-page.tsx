import { redirect } from "next/navigation";

import { CarePlaceholder } from "@/components/expert/care-placeholder";
import { loadExpertPoleState, type ExpertPole } from "@/lib/expert/poles";

export async function requireCarePage() {
  const state = await loadExpertPoleState();
  const allowed = state.memberships.some((item) => item.pole === "care" && item.status === "active");
  if (!allowed) redirect("/dashboard/expert");
}

export function carePage(title: string) {
  return async function CarePage() {
    await requireCarePage();
    return <CarePlaceholder title={title} />;
  };
}

export type { ExpertPole };
