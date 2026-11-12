import type { DossierStage } from "@/lib/formation-dossier/stages";

export type AccountMemberFormation = {
  dossierId: string;
  participantId: string;
  title: string;
  stage: DossierStage | null;
  status: string;
  nextDate: string | null;
  dateLabel: string | null;
};

export type AccountMemberPerson = {
  userId: string;
  employeeId: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  jobTitle: string | null;
  isTutor: boolean;
  invited: boolean;
  invitedAt: string | null;
  formations: AccountMemberFormation[];
  badges: number;
  lastSeenAt: string | null;
};

export type UnlinkedParticipant = {
  key: string;
  email: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  profileIds: string[];
  participantIds: string[];
  dossierIds: string[];
  formations: AccountMemberFormation[];
};

export type AccountParticipantsPayload = {
  organizationId: string;
  organizationName: string;
  members: AccountMemberPerson[];
  unlinked: UnlinkedParticipant[];
};

const PARTICLES = new Set(["de", "du", "des", "le", "la", "les", "d", "l", "von", "van", "da", "di"]);

export function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Title-case FR : THOUIN → Thouin, jean-pierre → Jean-Pierre, particules en minuscules. */
export function formatPersonName(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "";
  return text
    .split(" ")
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && PARTICLES.has(lower.replace(/\.$/, ""))) return lower;
      return lower
        .split("-")
        .map((chunk) => {
          if (!chunk) return chunk;
          if (PARTICLES.has(chunk)) return chunk;
          return chunk.charAt(0).toUpperCase() + chunk.slice(1);
        })
        .join("-");
    })
    .join(" ");
}

export function splitPersonName(fullName: string): { firstName: string; lastName: string } {
  const parts = formatPersonName(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}
