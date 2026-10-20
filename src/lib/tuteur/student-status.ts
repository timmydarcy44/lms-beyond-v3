export const TUTOR_DROPOUT_THRESHOLDS = {
  overdueMissions: 2,
  unjustifiedAbsences: 1,
  absenceWindowDays: 30,
  inactivityDays: 7,
  unsignedLivretDays: 15,
  signalsForWatch: 2,
};

export type TutorStudentStatus = "a_jour" | "a_surveiller" | "en_retard";

export function getDropoutSignals(input: {
  overdueMissions: number;
  unjustifiedAbsences: number;
  inactiveDays: number | null;
  unsignedLivretDays: number | null;
}): string[] {
  const t = TUTOR_DROPOUT_THRESHOLDS;
  const signals: string[] = [];
  if (input.overdueMissions >= t.overdueMissions) {
    signals.push(`${input.overdueMissions} missions en retard`);
  }
  if (input.unjustifiedAbsences >= t.unjustifiedAbsences) {
    signals.push(
      input.unjustifiedAbsences > 1
        ? `${input.unjustifiedAbsences} absences non justifiées sur ${t.absenceWindowDays} jours`
        : `Absence non justifiée sur ${t.absenceWindowDays} jours`,
    );
  }
  if (input.inactiveDays != null && input.inactiveDays >= t.inactivityDays) {
    signals.push(`Inactif sur la plateforme depuis ${input.inactiveDays} jours`);
  }
  if (input.unsignedLivretDays != null && input.unsignedLivretDays > t.unsignedLivretDays) {
    signals.push(`Livret non signé depuis ${input.unsignedLivretDays} jours`);
  }
  return signals;
}

export function getTutorStudentStatus(input: {
  overdueMissions: number;
  signals: string[];
}): TutorStudentStatus {
  if (input.signals.length >= TUTOR_DROPOUT_THRESHOLDS.signalsForWatch) return "a_surveiller";
  if (input.overdueMissions > 0) return "en_retard";
  return "a_jour";
}
