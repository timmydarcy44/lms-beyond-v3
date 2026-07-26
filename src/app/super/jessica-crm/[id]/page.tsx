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
  getPatientCabinetRevenue,
} from "@/lib/queries/jessica-cabinet-patients";
import { UserDetailsClient } from "@/app/super/gestion-client/[id]/user-details-client";
import { JessicaCabinetPatientPanel } from "@/components/jessica-contentin/crm/jessica-cabinet-patient-panel";
import { JessicaClientQuestionnairesPanel } from "@/components/jessica-contentin/jessica-client-questionnaires-panel";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { getJessicaQuestionnaireResponsesForClient } from "@/lib/queries/jessica-questionnaires";

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

  const patientRevenue = patient
    ? await getPatientCabinetRevenue(patient.id, patient.email, {
        pastAppointmentsCount: patient.pastAppointmentsCount,
        lastAppointmentAt: patient.lastAppointmentAt,
      })
    : null;

  if (!userDetails && !patient) notFound();

  let dossier = null;
  if (userDetails) {
    try {
      dossier = await getLearnerDossier(id);
    } catch (e) {
      console.error("[jessica-crm] dossier error:", e);
    }
  }

  const questionnaireResponses = await getJessicaQuestionnaireResponsesForClient({
    profileId: userDetails?.id ?? patient?.profileId ?? null,
    patientId: patient?.id ?? null,
    email: userDetails?.email ?? patient?.email ?? null,
    firstName: userDetails?.firstName ?? patient?.firstName ?? null,
    lastName: userDetails?.lastName ?? patient?.lastName ?? null,
    fullName: formatClientName(
      userDetails?.firstName ?? patient?.firstName,
      userDetails?.lastName ?? patient?.lastName,
      userDetails?.email ?? patient?.email ?? "Client",
    ),
  });

  if (userDetails) {
    const displayName = formatClientName(userDetails.firstName, userDetails.lastName);
    return (
      <JessicaSuperPage
        title={displayName}
        subtitle={[userDetails.email, userDetails.phone].filter(Boolean).join(" · ")}
        backHref="/super/jessica-crm"
        backLabel="Retour au CRM"
      >
        {patient ? (
          <JessicaCabinetPatientPanel patient={patient} revenue={patientRevenue ?? undefined} compact />
        ) : null}
        <UserDetailsClient
          userDetails={userDetails}
          availableResources={resources}
          dossier={dossier}
          cabinetPatient={patient}
          patientRevenue={patientRevenue}
          questionnaireResponses={questionnaireResponses}
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
      <JessicaCabinetPatientPanel patient={patient!} revenue={patientRevenue ?? undefined} />
      <div className="mt-6">
        <JessicaClientQuestionnairesPanel
          responses={questionnaireResponses}
          contactId={patient!.id ? `patient:${patient!.id}` : undefined}
        />
      </div>
    </JessicaSuperPage>
  );
}
