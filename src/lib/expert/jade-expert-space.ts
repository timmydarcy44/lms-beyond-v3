import {
  addDays,
  atHour,
  type ExpertDocumentItem,
  type ExpertMission,
  type ExpertReview,
  type ExpertSlot,
} from "@/lib/expert/space-model";

function day(now: Date, offset: number) {
  return addDays(now, offset);
}

export function buildJadeMissions(now = new Date()): ExpertMission[] {
  const today = day(now, 0);
  const october = new Date(now.getFullYear(), now.getMonth(), 1);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 12);
  return [
    {
      id: "jade-entretien",
      title: "Entretien individuel",
      client: "Byound Business",
      startsAt: atHour(today, 16),
      endsAt: atHour(today, 17),
      format: "visio",
      location: "Visio",
      durationLabel: "1 h",
      amountCents: 22000,
      status: "planifiee",
      billing: "to_invoice",
      paidAt: null,
      visioUrl: "https://meet.google.com",
    },
    {
      id: "jade-atelier-2",
      title: "Atelier closing · session 2",
      client: "Byound Business",
      startsAt: atHour(day(now, 3), 10),
      endsAt: atHour(day(now, 3), 12),
      format: "presentiel",
      location: "Le Havre",
      durationLabel: "2 h",
      amountCents: 40000,
      status: "acceptee",
      billing: "upcoming",
      paidAt: null,
      visioUrl: null,
    },
    {
      id: "jade-ines",
      title: "Point commercial avec Inès",
      client: "Byound School",
      startsAt: atHour(day(now, 4), 11),
      endsAt: atHour(day(now, 4), 12),
      format: "visio",
      location: "Visio",
      durationLabel: "1 h",
      amountCents: 15000,
      status: "nouvelle",
      billing: "none",
      paidAt: null,
      visioUrl: "https://meet.google.com",
    },
    {
      id: "jade-atelier-1",
      title: "Atelier closing · session 1",
      client: "Byound Business",
      startsAt: atHour(new Date(october.getFullYear(), october.getMonth(), 14), 10),
      endsAt: atHour(new Date(october.getFullYear(), october.getMonth(), 14), 12),
      format: "presentiel",
      location: "Le Havre",
      durationLabel: "2 h",
      amountCents: 48000,
      status: "terminee",
      billing: "paid",
      paidAt: atHour(new Date(october.getFullYear(), october.getMonth(), 14), 18),
      visioUrl: null,
    },
    {
      id: "jade-lea",
      title: "Coaching de Léa",
      client: "Byound School",
      startsAt: atHour(new Date(october.getFullYear(), october.getMonth(), 3), 11),
      endsAt: atHour(new Date(october.getFullYear(), october.getMonth(), 3), 12),
      format: "visio",
      location: "Visio",
      durationLabel: "1 h",
      amountCents: 18000,
      status: "terminee",
      billing: "paid",
      paidAt: atHour(new Date(october.getFullYear(), october.getMonth(), 3), 18),
      visioUrl: null,
    },
    {
      id: "jade-tom",
      title: "Point commercial avec Tom",
      client: "Byound Business",
      startsAt: atHour(new Date(october.getFullYear(), october.getMonth(), 1), 15),
      endsAt: atHour(new Date(october.getFullYear(), october.getMonth(), 1), 16),
      format: "visio",
      location: "Visio",
      durationLabel: "1 h",
      amountCents: 56000,
      status: "terminee",
      billing: "paid",
      paidAt: atHour(new Date(october.getFullYear(), october.getMonth(), 1), 18),
      visioUrl: null,
    },
    {
      id: "jade-septembre",
      title: "Atelier prospection",
      client: "Byound Business",
      startsAt: atHour(previous, 9),
      endsAt: atHour(previous, 12),
      format: "presentiel",
      location: "Rouen",
      durationLabel: "3 h",
      amountCents: 30000,
      status: "terminee",
      billing: "paid",
      paidAt: atHour(previous, 18),
      visioUrl: null,
    },
  ];
}

export function buildJadeSlots(now = new Date()): ExpertSlot[] {
  const missions = buildJadeMissions(now);
  const byId = (id: string) => missions.find((mission) => mission.id === id)!;
  const entretien = byId("jade-entretien");
  const atelier = byId("jade-atelier-2");
  const ines = byId("jade-ines");
  return [
    { id: "slot-entretien", startsAt: entretien.startsAt, endsAt: entretien.endsAt, format: "visio", kind: "rendez_vous", location: "Visio", missionId: entretien.id, title: entretien.title, client: entretien.client },
    { id: "slot-prep", startsAt: atHour(day(now, 2), 14), endsAt: atHour(day(now, 2), 15), format: "visio", kind: "rendez_vous", location: "Visio", missionId: entretien.id, title: "Préparation entretien", client: entretien.client },
    { id: "slot-atelier", startsAt: atelier.startsAt, endsAt: atelier.endsAt, format: "presentiel", kind: "formation", location: "Le Havre", missionId: atelier.id, title: atelier.title, client: atelier.client },
    { id: "slot-ines", startsAt: ines.startsAt, endsAt: ines.endsAt, format: "visio", kind: "rendez_vous", location: "Visio", missionId: ines.id, title: ines.title, client: ines.client },
    { id: "slot-free-1", startsAt: atHour(day(now, 1), 9), endsAt: atHour(day(now, 1), 12), format: "visio", kind: "rendez_vous", location: "Visio", missionId: null, title: null, client: null },
    { id: "slot-free-2", startsAt: atHour(day(now, 5), 14), endsAt: atHour(day(now, 5), 17), format: "presentiel", kind: "formation", location: "Le Havre", missionId: null, title: null, client: null },
  ];
}

export function buildJadeDocuments(now = new Date()): ExpertDocumentItem[] {
  const yesterday = addDays(now, -1);
  const signed = new Date(now.getFullYear(), now.getMonth(), 2);
  const cv = addDays(now, -30);
  const attestation = new Date(now.getFullYear(), 4, 3);
  const expires = addDays(now, 12);
  return [
    { id: "jade-doc-cadre", name: "Contrat cadre Byound", folder: "contrat", status: "to_sign", uploadedAt: yesterday.toISOString(), expiresAt: null, pages: 6, url: "" },
    { id: "jade-doc-mission", name: "Contrat de mission · Atelier closing", folder: "contrat", status: "signed", uploadedAt: signed.toISOString(), expiresAt: null, pages: 3, url: "" },
    { id: "jade-doc-cv", name: "CV Jade Martin", folder: "cv", status: "deposited", uploadedAt: cv.toISOString(), expiresAt: null, pages: 2, url: "" },
    { id: "jade-doc-vigilance", name: "Attestation de vigilance", folder: "attestation", status: "deposited", uploadedAt: attestation.toISOString(), expiresAt: expires.toISOString(), pages: 1, url: "" },
  ];
}

export function buildJadeReviews(now = new Date()): ExpertReview[] {
  return [
    { id: "r1", client: "Byound Business", rating: 5, body: "Atelier closing très concret, l'équipe a appliqué la méthode dès le lendemain.", mission: "Atelier closing", at: addDays(now, -7).toISOString() },
    { id: "r2", client: "Byound School", rating: 5, body: "Suivi précis et bienveillant de l'alternante.", mission: "Coaching", at: addDays(now, -18).toISOString() },
    { id: "r3", client: "Byound Business", rating: 4, body: "Bon point d'étape, quelques outils à partager en amont.", mission: "Point commercial", at: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString() },
  ];
}
