import { notFound } from "next/navigation";
import { SurMesureEditClient } from "@/components/control/account-surmesure-edit-client";
import { SurMesureShell } from "@/components/control/account-surmesure-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadAccountDetail } from "@/lib/control/load";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { SURMESURE_SELECT } from "@/lib/training-courses/surmesure";
import { courseToDraft, type SurMesureCourse } from "@/lib/training-courses/surmesure-ui";
import { loadSurMesureOrgContext } from "@/lib/training-courses/surmesure-org-context";

export const dynamic = "force-dynamic";

export default async function SurMesureEditPage({
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

  const [{ data, error }, company] = await Promise.all([
    service
      .from("training_courses")
      .select(SURMESURE_SELECT)
      .eq("id", courseId)
      .eq("organization_id", id)
      .eq("source", "surmesure")
      .maybeSingle(),
    loadSurMesureOrgContext(service, id),
  ]);

  if (error || !data) notFound();
  const course = data as SurMesureCourse;

  return (
    <SurMesureShell orgId={id} orgName={detail.account.name} crumb={`Modifier · ${course.title}`}>
      <header className="mb-6">
        <h1 className="text-[32px] font-extrabold tracking-[-1px]">Modifier la fiche</h1>
        <p className="mt-2 text-sm text-[#8A93AE]">
          Ajustez le cadrage Qualiopi à la main avec le client, puis revenez à la présentation.
        </p>
      </header>
      <SurMesureEditClient
        organizationId={id}
        courseId={courseId}
        company={company}
        initialDraft={courseToDraft(course)}
      />
    </SurMesureShell>
  );
}
