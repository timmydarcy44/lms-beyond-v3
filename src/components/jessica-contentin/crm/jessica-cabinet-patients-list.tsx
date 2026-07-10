"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Mail, Phone, Calendar, UserCheck } from "lucide-react";
import type { JessicaCabinetPatientListItem } from "@/lib/queries/jessica-cabinet-patients";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { JessicaSuperButton } from "@/components/jessica-contentin/super/jessica-super-ui";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = {
  initialPatients: JessicaCabinetPatientListItem[];
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy HH:mm", { locale: fr });
  } catch {
    return "—";
  }
}

function genderLabel(g: string | null): string {
  if (g === "m") return "H";
  if (g === "f") return "F";
  if (g === "o") return "Autre";
  return "—";
}

export function JessicaCabinetPatientsList({ initialPatients }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = initialPatients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = formatClientName(p.firstName, p.lastName, "").toLowerCase();
    return (
      name.includes(q) ||
      (p.email?.toLowerCase().includes(q) ?? false) ||
      (p.phone?.includes(q) ?? false) ||
      p.externalId.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, téléphone ou ID Doctolib…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={jessicaSuper.inputRounded}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={cn(jessicaSuper.card, "py-12 text-center text-neutral-500")}>
          {searchQuery ? "Aucun patient trouvé" : "Aucun patient importé — lancez l'import Doctolib."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((patient) => {
            const displayName = formatClientName(patient.firstName, patient.lastName, "Patient sans nom");

            return (
              <div key={patient.id} className={cn(jessicaSuper.cardHover, "p-6")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/super/jessica-crm/patients/${patient.id}`}
                        className="text-xl font-semibold text-black hover:underline"
                      >
                        {displayName}
                      </Link>
                      <span className={jessicaSuper.badge}>{genderLabel(patient.gender)}</span>
                      {patient.hasLmsAccount ? (
                        <span className={jessicaSuper.badgeAccent}>
                          <UserCheck className="mr-1 inline h-3 w-3" />
                          Compte LMS
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                      {patient.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {patient.email}
                        </span>
                      ) : null}
                      {patient.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {patient.phone}
                        </span>
                      ) : null}
                      <span className="text-neutral-400">ID {patient.externalId}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-600">
                      <span>
                        <strong className="text-black">{patient.pastAppointmentsCount}</strong> RDV passés
                        {patient.lastAppointmentAt ? (
                          <span className="text-neutral-400"> · {formatDateTime(patient.lastAppointmentAt)}</span>
                        ) : null}
                      </span>
                      {patient.futureAppointmentsCount > 0 ? (
                        <span className="flex items-center gap-1 text-indigo-700">
                          <Calendar className="h-4 w-4" />
                          {patient.futureAppointmentsCount} à venir
                          {patient.nextAppointmentAt ? ` · ${formatDateTime(patient.nextAppointmentAt)}` : ""}
                        </span>
                      ) : null}
                      {patient.lastAppointmentReason ? (
                        <span className="text-neutral-400">{patient.lastAppointmentReason}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <JessicaSuperButton href={`/super/jessica-crm/patients/${patient.id}`} variant="outline" size="sm">
                      Voir la fiche
                    </JessicaSuperButton>
                    {patient.profileId ? (
                      <JessicaSuperButton href={`/super/jessica-crm/${patient.profileId}`} size="sm">
                        Fiche LMS
                      </JessicaSuperButton>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
