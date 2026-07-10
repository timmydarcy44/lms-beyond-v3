import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaCabinetPatientDetails } from "@/lib/queries/jessica-cabinet-patients";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import {
  JessicaSuperPage,
  JessicaSuperCard,
  JessicaSuperButton,
} from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { Mail, MapPin, Calendar, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

function fmtDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy à HH:mm", { locale: fr });
  } catch {
    return "—";
  }
}

function genderLabel(g: string | null): string {
  if (g === "m") return "Homme";
  if (g === "f") return "Femme";
  if (g === "o") return "Autre";
  return "Non renseigné";
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="border-b border-black/[0.06] py-3 last:border-0">
      <dt className="mb-1 text-sm text-neutral-500">{label}</dt>
      <dd className="text-base text-black">{value}</dd>
    </div>
  );
}

export default async function JessicaCabinetPatientPage({ params }: PageProps) {
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
  const patient = await getJessicaCabinetPatientDetails(id);
  if (!patient) notFound();

  const displayName = formatClientName(patient.firstName, patient.lastName, "Patient");

  return (
    <JessicaSuperPage
      title={displayName}
      subtitle={`ID Doctolib ${patient.externalId}`}
      backHref="/super/jessica-crm/patients"
      backLabel="Retour aux patients"
      narrow
      actions={
        <div className="flex flex-wrap gap-2">
          <span className={jessicaSuper.badge}>{genderLabel(patient.gender)}</span>
          {patient.hasLmsAccount ? (
            <span className={jessicaSuper.badgeAccent}>
              <UserCheck className="mr-1 inline h-3 w-3" />
              Compte LMS
            </span>
          ) : null}
        </div>
      }
    >
      {patient.profileId ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-black">
            Compte plateforme : <strong>{patient.profileEmail}</strong>
          </span>
          <JessicaSuperButton href={`/super/jessica-crm/${patient.profileId}`} size="sm">
            Ouvrir la fiche LMS
          </JessicaSuperButton>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <JessicaSuperCard
          title={
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              Coordonnées
            </span>
          }
        >
          <dl>
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Email secondaire" value={patient.emailSecondary} />
            <InfoRow label="Téléphone" value={patient.phone} />
            <InfoRow label="Téléphone secondaire" value={patient.phoneSecondary} />
            <InfoRow label="Date de naissance" value={patient.birthDate ? fmtDate(patient.birthDate) : null} />
          </dl>
        </JessicaSuperCard>

        <JessicaSuperCard
          title={
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Adresse
            </span>
          }
        >
          <dl>
            <InfoRow label="Adresse" value={patient.address} />
            <InfoRow label="Ville" value={patient.city} />
            <InfoRow label="Code postal" value={patient.postalCode} />
            <InfoRow label="Pays" value={patient.country?.toUpperCase()} />
          </dl>
        </JessicaSuperCard>

        <JessicaSuperCard
          className="md:col-span-2"
          title={
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Rendez-vous
            </span>
          }
        >
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-neutral-500">RDV passés</p>
              <p className="text-2xl font-semibold text-black">{patient.pastAppointmentsCount}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Dernier RDV</p>
              <p className="font-medium text-black">{fmtDateTime(patient.lastAppointmentAt)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">RDV futurs</p>
              <p className="text-2xl font-semibold text-black">{patient.futureAppointmentsCount}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Prochain RDV</p>
              <p className="font-medium text-black">{fmtDateTime(patient.nextAppointmentAt)}</p>
            </div>
          </div>
          <dl>
            <InfoRow label="Dernier lieu" value={patient.lastAppointmentLocation} />
            <InfoRow label="Dernier motif" value={patient.lastAppointmentReason} />
            <InfoRow label="Annulations pro" value={String(patient.proCancellationsCount)} />
            <InfoRow label="Annulations patient" value={String(patient.patientCancellationsCount)} />
            <InfoRow label="Absences" value={String(patient.noShowCount)} />
            <InfoRow label="Créé le (Doctolib)" value={fmtDateTime(patient.sourceCreatedAt)} />
          </dl>
        </JessicaSuperCard>

        {patient.notes || patient.anamnesis || patient.communicationNotes ? (
          <JessicaSuperCard className="md:col-span-2" title="Notes cliniques">
            <dl>
              <InfoRow label="Note" value={patient.notes} />
              <InfoRow label="Anamnèse" value={patient.anamnesis} />
              <InfoRow label="Communication" value={patient.communicationNotes} />
            </dl>
          </JessicaSuperCard>
        ) : null}
      </div>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Importé le {fmtDateTime(patient.importedAt)} · Mis à jour le {fmtDateTime(patient.updatedAt)}
      </p>
    </JessicaSuperPage>
  );
}
