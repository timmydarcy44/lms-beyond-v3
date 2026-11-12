import { notFound } from "next/navigation";
import { AccountSurMesurePresentation } from "@/components/control/account-surmesure-presentation";
import { SurMesureShell } from "@/components/control/account-surmesure-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadAccountDetail } from "@/lib/control/load";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { SURMESURE_SELECT } from "@/lib/training-courses/surmesure";
import type { SurMesureCourse } from "@/lib/training-courses/surmesure-ui";

export const dynamic = "force-dynamic";

export default async function SurMesureDetailPage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}) {
  const { id, courseId } = await params;
  if (!(await isSuperAdmin())) notFound();

  const detail = await loadAccountDetail(id);
  if (!detail.account) notFound();

  const service = getServiceRoleClient();
  if (!service) notFound();

  const { data, error } = await service
    .from("training_courses")
    .select(SURMESURE_SELECT)
    .eq("id", courseId)
    .eq("organization_id", id)
    .eq("source", "surmesure")
    .maybeSingle();

  if (error || !data) notFound();

  const admin = detail.members.find((m) => m.role === "admin" && m.email.includes("@"));

  return (
    <SurMesureShell orgId={id} orgName={detail.account.name} crumb={data.title}>
      <AccountSurMesurePresentation
        organizationId={id}
        organizationName={detail.account.name}
        initialCourse={data as SurMesureCourse}
        people={detail.people.map((p) => ({
          userId: p.userId,
          name: p.name,
          email: p.email,
          invited: p.invited,
        }))}
        contactEmail={admin?.email ?? null}
        contactName={admin?.name ?? null}
        orgAddress={{
          addressLine: detail.account.addressLine,
          addressZip: detail.account.addressZip,
          addressCity: detail.account.addressCity,
          siret: detail.account.siret,
        }}
      />
    </SurMesureShell>
  );
}
