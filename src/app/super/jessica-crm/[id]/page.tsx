import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaUserDetails } from "@/lib/queries/jessica-users";
import { getJessicaResources } from "@/lib/queries/jessica-resources";
import { getLearnerDossier } from "@/lib/queries/learner-dossier";
import {
  getJessicaCabinetPatientDetails,
  getJessicaCabinetPatientByProfileId,
} from "@/lib/queries/jessica-cabinet-patients";
import { UserDetailsClient } from "@/app/super/gestion-client/[id]/user-details-client";
import { JessicaCabinetPatientPanel } from "@/components/jessica-contentin/crm/jessica-cabinet-patient-panel";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JessicaCrmClientPage({ params }: PageProps) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  const { id } = await params;

  const [userDetails, patientById, resources] = await Promise.all([
    getJessicaUserDetails(id),
    getJessicaCabinetPatientDetails(id),
    getJessicaResources(),
  ]);

  const patient = patientById ?? (userDetails ? await getJessicaCabinetPatientByProfileId(id) : null);

  if (!userDetails && !patient) notFound();

  let dossier = null;
  if (userDetails) {
    try {
      dossier = await getLearnerDossier(id);
    } catch (e) {
      console.error("[jessica-crm] dossier error:", e);
    }
  }

  if (userDetails) {
    const displayName = formatClientName(userDetails.firstName, userDetails.lastName);
    return (
      <JessicaSuperPage
        title={displayName}
        subtitle={[userDetails.email, userDetails.phone].filter(Boolean).join(" · ")}
        backHref="/super/jessica-crm"
        backLabel="Retour au CRM"
      >
        {patient ? <JessicaCabinetPatientPanel patient={patient} compact /> : null}
        <UserDetailsClient
          userDetails={userDetails}
          availableResources={resources}
          dossier={dossier}
          cabinetPatient={patient}
        />
      </JessicaSuperPage>
    );
  }

  const displayName = formatClientName(patient!.firstName, patient!.lastName, "Client");

  return (
    <JessicaSuperPage
      title={displayName}
      subtitle={[patient!.email, patient!.phone].filter(Boolean).join(" · ")}
      backHref="/super/jessica-crm"
      backLabel="Retour au CRM"
    >
      <JessicaCabinetPatientPanel patient={patient!} />
    </JessicaSuperPage>
  );
}
