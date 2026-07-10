import type { JessicaCabinetPatientDetails } from "@/lib/queries/jessica-cabinet-patients";
import { JessicaSuperCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { JESSICA_CABINET_HOURLY_RATE } from "@/lib/jessica-contentin/cabinet-revenue";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Mail, Phone, MapPin } from "lucide-react";

function fmtDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy HH:mm", { locale: fr });
  } catch {
    return "—";
  }
}

type Props = {
  patient: JessicaCabinetPatientDetails;
  compact?: boolean;
};

export function JessicaCabinetPatientPanel({ patient, compact }: Props) {
  const estimatedCabinetRevenue =
    Math.round(((patient.pastAppointmentsCount || 0) * 1) * JESSICA_CABINET_HOURLY_RATE * 100) / 100;

  if (compact) {
    return (
      <JessicaSuperCard className="mb-6">
        <div className="flex flex-wrap gap-6 text-sm">
          <span>
            <strong>{patient.pastAppointmentsCount}</strong> RDV passés
          </span>
          <span>Prochain : {fmtDateTime(patient.nextAppointmentAt)}</span>
          <span className="text-indigo-700 font-medium">Cabinet ~{estimatedCabinetRevenue}€ ({JESSICA_CABINET_HOURLY_RATE}€/h)</span>
          {patient.lastAppointmentReason && (
            <span className="text-neutral-500">{patient.lastAppointmentReason}</span>
          )}
        </div>
      </JessicaSuperCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <JessicaSuperCard title="Coordonnées cabinet">
        <dl className="space-y-2 text-sm">
          {patient.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              {patient.email}
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-neutral-400" />
              {patient.phone}
            </div>
          )}
          {(patient.address || patient.city) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-400" />
              {[patient.address, patient.postalCode, patient.city].filter(Boolean).join(", ")}
            </div>
          )}
        </dl>
      </JessicaSuperCard>

      <JessicaSuperCard title="Rendez-vous & CA cabinet">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            {patient.pastAppointmentsCount} passés · {patient.futureAppointmentsCount} à venir
          </div>
          <div>Dernier : {fmtDateTime(patient.lastAppointmentAt)}</div>
          <div>Prochain : {fmtDateTime(patient.nextAppointmentAt)}</div>
          <div className="font-semibold text-indigo-700">
            CA estimé cabinet : ~{estimatedCabinetRevenue}€ ({JESSICA_CABINET_HOURLY_RATE}€/h)
          </div>
          {patient.lastAppointmentReason && (
            <div className="text-neutral-500">Motif : {patient.lastAppointmentReason}</div>
          )}
        </dl>
      </JessicaSuperCard>
    </div>
  );
}
