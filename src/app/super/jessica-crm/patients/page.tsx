import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  getJessicaCabinetPatientsList,
  getJessicaCabinetPatientsStats,
} from "@/lib/queries/jessica-cabinet-patients";
import { JessicaCabinetPatientsList } from "@/components/jessica-contentin/crm/jessica-cabinet-patients-list";
import { JessicaSuperPage, JessicaSuperStatCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { Calendar, Stethoscope, UserCheck } from "lucide-react";

export const revalidate = 0;

export default async function JessicaCabinetPatientsPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  const [patients, stats] = await Promise.all([
    getJessicaCabinetPatientsList(),
    getJessicaCabinetPatientsStats(),
  ]);

  return (
    <JessicaSuperPage
      title="Patients cabinet"
      subtitle="Base Doctolib — historique RDV, coordonnées et lien vers les comptes LMS."
      backHref="/super/jessica-crm"
      backLabel="Retour au CRM clients"
    >
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <JessicaSuperStatCard label="Patients" value={stats.total} icon={<Stethoscope className="h-5 w-5" />} />
        <JessicaSuperStatCard
          label="Avec compte LMS"
          value={stats.withLmsAccount}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <JessicaSuperStatCard
          label="RDV à venir"
          value={stats.withFutureAppointment}
          accent
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      <JessicaCabinetPatientsList initialPatients={patients} />
    </JessicaSuperPage>
  );
}
