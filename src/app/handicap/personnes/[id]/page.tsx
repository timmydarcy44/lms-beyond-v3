import { redirect } from "next/navigation";
import { handicapCasePath } from "@/lib/handicap/paths";
import { requireDisabilityStaff } from "@/lib/handicap/staff";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

/** Ancienne URL dynamique → query sur /handicap (évite les 404 soft-nav). */
export default async function HandicapPersonneRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const { id } = await params;
  redirect(handicapCasePath(id));
}
