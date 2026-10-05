import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { QUALIOPI_CORE_DOCS } from "@/lib/crm/qualiopi-shared";

export type QualiopiIndicatorAttestation = {
  indicatorId: number;
  note: string | null;
  updatedAt: string;
};

export type QualiopiAuditSignals = {
  coursesWithObjectives: number;
  approvedExperts: number;
  attestations: QualiopiIndicatorAttestation[];
};

export type QualiopiSessionEvidence = {
  templates: QualiopiDocument[];
  hasConvention: boolean;
  hasReglement: boolean;
  hasLivret: boolean;
  coreUploaded: number;
  sessions: QualiopiSession[];
  sessionsTotal: number;
  hasAnySession: boolean;
  scheduledSessions: number;
  signedSessions: number;
  sessionsWithFullSignature: number;
  sessionsWithInfoPackSent: number;
  sessionsWithLivretSent: number;
  sessionsWithConventionSent: number;
  sessionsDoneFullySigned: number;
  satisfactionResponses: number;
  sessionsWithFullSatisfaction: number;
};

export function buildSessionEvidence(input: {
  documents: QualiopiDocument[];
  sessions: QualiopiSession[];
}): QualiopiSessionEvidence {
  const templates = input.documents.filter((d) => !d.session_id);
  const hasConvention = docUploaded(templates, "convention");
  const hasReglement = docUploaded(templates, "reglement");
  const hasLivret = docUploaded(templates, "livret");
  const coreUploaded = [hasConvention, hasReglement, hasLivret].filter(Boolean).length;

  let signedSessions = 0;
  let sessionsWithFullSignature = 0;
  let sessionsWithInfoPackSent = 0;
  let sessionsWithLivretSent = 0;
  let sessionsWithConventionSent = 0;
  let sessionsDoneFullySigned = 0;
  let satisfactionResponses = 0;
  let sessionsWithFullSatisfaction = 0;
  let scheduledSessions = 0;

  for (const s of input.sessions) {
    if (s.scheduled_at) scheduledSessions += 1;
    const attendees = s.attendees ?? [];
    const signedCount = attendees.filter((a) => a.signed_at).length;
    if (signedCount > 0) signedSessions += 1;
    if (attendees.length > 0 && signedCount === attendees.length) sessionsWithFullSignature += 1;
    if (s.convention_sent_at && s.reglement_sent_at && s.livret_sent_at) sessionsWithInfoPackSent += 1;
    if (s.livret_sent_at) sessionsWithLivretSent += 1;
    if (s.convention_sent_at) sessionsWithConventionSent += 1;
    if (s.status === "done" && attendees.length > 0 && signedCount === attendees.length) {
      sessionsDoneFullySigned += 1;
    }
    for (const a of attendees) {
      if (a.satisfaction_at || a.satisfaction_score != null) satisfactionResponses += 1;
    }
    if (
      attendees.length > 0 &&
      attendees.every((a) => a.satisfaction_at || a.satisfaction_score != null)
    ) {
      sessionsWithFullSatisfaction += 1;
    }
  }

  return {
    templates,
    hasConvention,
    hasReglement,
    hasLivret,
    coreUploaded,
    sessions: input.sessions,
    sessionsTotal: input.sessions.length,
    hasAnySession: input.sessions.length > 0,
    scheduledSessions,
    signedSessions,
    sessionsWithFullSignature,
    sessionsWithInfoPackSent,
    sessionsWithLivretSent,
    sessionsWithConventionSent,
    sessionsDoneFullySigned,
    satisfactionResponses,
    sessionsWithFullSatisfaction,
  };
}

function docUploaded(docs: QualiopiDocument[], kind: string) {
  return docs.some((d) => d.kind === kind && Boolean(d.file_url) && !d.session_id);
}

export { QUALIOPI_CORE_DOCS };
