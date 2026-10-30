import { proposeCursusMissions, type CompanyContext } from "@/lib/tuteur/cursus-missions";

const students: Array<{
  id: string;
  assignmentId: string;
  name: string;
  first: string;
  formation: string;
  rythme: string;
  company: CompanyContext;
}> = [
  { id: "l-lea", assignmentId: "a-lea", name: "Léa Bernard", first: "Léa", formation: "Bachelor · AI Business", rythme: "3 jours entreprise · 2 jours école", company: { name: "Byound", sector: "Formation professionnelle", city: "Le Havre" } },
  { id: "l-ines", assignmentId: "a-ines", name: "Inès Morel", first: "Inès", formation: "Bachelor · AI Business", rythme: "3 jours entreprise · 2 jours école", company: { name: "Horizon Sport", sector: "Commerce d'articles de sport", city: "Le Havre" } },
  { id: "l-noah", assignmentId: "a-noah", name: "Noah Petit", first: "Noah", formation: "Bachelor · AI Business", rythme: "3 jours entreprise · 2 jours école", company: { name: "Atelier Nova", sector: "Édition de logiciels", city: "Paris" } },
  { id: "l-tom", assignmentId: "a-tom", name: "Tom Leroy", first: "Tom", formation: "Bachelor · AI Business", rythme: "3 jours entreprise · 2 jours école", company: { name: "Maison Leroy", sector: "Négoce alimentaire", city: "Rouen" } },
];

const CURSUS_SKILLS = [
  { id: "b-ccp1", code: "CCP1", title: "Prospection", brief: "Organiser et planifier sa prospection à partir du référentiel Bachelor AI Business" },
  { id: "b-ccp2", code: "CCP2", title: "Découverte et négociation", brief: "Conduire un entretien de découverte et argumenter selon le référentiel" },
  { id: "b-ccp3", code: "CCP3", title: "Closing et suivi", brief: "Conclure, formaliser le dossier et assurer le suivi prévu au référentiel" },
];

function mission(partial: Record<string, unknown>) {
  return {
    instructions: null,
    blockId: null,
    deliverable: "Compte rendu",
    tutorComment: null,
    ...partial,
  };
}

export function jadeMissionsBoard() {
  const validatedAt = "2026-10-08T09:00:00.000Z";
  const missions = [
    mission({ id: "m-lea-1", assignmentId: "a-lea", learnerId: "l-lea", learnerName: "Léa Bernard", title: "Campagne de 20 appels de prospection", blockCode: "CCP1", status: "submitted", late: false, dueDate: "2026-10-24", submittedAt: "2026-10-16T09:42:00.000Z", validatedAt: null }),
    mission({ id: "m-ines-1", assignmentId: "a-ines", learnerId: "l-ines", learnerName: "Inès Morel", title: "Fichier de prospects secteur sport", blockCode: "CCP1", status: "submitted", late: true, dueDate: "2026-10-17", submittedAt: "2026-10-18T11:00:00.000Z", validatedAt: null }),
    mission({ id: "m-ines-3", assignmentId: "a-ines", learnerId: "l-ines", learnerName: "Inès Morel", title: "Relancer le fichier sport", blockCode: "CCP1", status: "todo", late: true, dueDate: "2026-10-09", submittedAt: null, validatedAt: null }),
    mission({ id: "m-noah-1", assignmentId: "a-noah", learnerId: "l-noah", learnerName: "Noah Petit", title: "Préparation d'un rendez-vous client", blockCode: "CCP2", status: "in_progress", late: true, dueDate: "2026-10-12", submittedAt: null, validatedAt: null }),
    mission({ id: "m-tom-1", assignmentId: "a-tom", learnerId: "l-tom", learnerName: "Tom Leroy", title: "Relance des prospects froids", blockCode: "CCP1", status: "todo", late: true, dueDate: "2026-10-10", submittedAt: null, validatedAt: null }),
    mission({ id: "m-lea-2", assignmentId: "a-lea", learnerId: "l-lea", learnerName: "Léa Bernard", title: "Négociation accompagnée", blockCode: "CCP2", status: "in_progress", late: false, dueDate: "2026-10-30", submittedAt: null, validatedAt: null }),
    mission({ id: "m-lea-3", assignmentId: "a-lea", learnerId: "l-lea", learnerName: "Léa Bernard", title: "Compte rendu de visite", blockCode: "CCP1", status: "validated", late: false, dueDate: "2026-10-02", submittedAt: "2026-10-01T10:00:00.000Z", validatedAt }),
    mission({ id: "m-ines-2", assignmentId: "a-ines", learnerId: "l-ines", learnerName: "Inès Morel", title: "Qualification d'un fichier", blockCode: "CCP1", status: "validated", late: false, dueDate: "2026-10-03", submittedAt: "2026-10-02T10:00:00.000Z", validatedAt }),
    mission({ id: "m-noah-2", assignmentId: "a-noah", learnerId: "l-noah", learnerName: "Noah Petit", title: "Script d'appel", blockCode: "CCP1", status: "done", late: false, dueDate: "2026-10-04", submittedAt: "2026-10-03T10:00:00.000Z", validatedAt }),
    mission({ id: "m-tom-2", assignmentId: "a-tom", learnerId: "l-tom", learnerName: "Tom Leroy", title: "Bilan de prospection", blockCode: "CCP2", status: "validated", late: false, dueDate: "2026-10-05", submittedAt: "2026-10-04T10:00:00.000Z", validatedAt }),
  ];
  return {
    missions,
    blocks: [
      { id: "b-ccp1", code: "CCP1", title: "Prospection" },
      { id: "b-ccp2", code: "CCP2", title: "Négociation" },
      { id: "b-ccp3", code: "CCP3", title: "Closing" },
    ],
    assignments: students.map((student) => ({ id: student.assignmentId, learner_id: student.id, learnerName: student.name })),
    referentials: students.map((student) => {
      const missions = proposeCursusMissions(CURSUS_SKILLS, student.company);
      return {
        assignmentId: student.assignmentId,
        learnerId: student.id,
        learnerName: student.name,
        referential: {
          id: "ref-bachelor-ai-business",
          title: "Bachelor AI Business",
          source: "cursus" as const,
          company: student.company,
          blocks: CURSUS_SKILLS.map((skill) => ({ id: skill.id, code: skill.code, title: skill.title })),
          missions,
        },
      };
    }),
  };
}

export function jadeEvaluations() {
  return {
    evaluations: [
      { id: "ev-ines", studentId: "l-ines", studentName: "Inès Morel", firstName: "Inès", type: "quarterly", dueDate: "2026-10-25", status: "to_fill", selfSentAt: "2026-10-14T10:00:00.000Z", sentAt: null },
      { id: "ev-noah", studentId: "l-noah", studentName: "Noah Petit", firstName: "Noah", type: "trial_period", dueDate: "2026-11-06", status: "awaiting_student", selfSentAt: null, sentAt: null },
      { id: "ev-lea", studentId: "l-lea", studentName: "Léa Bernard", firstName: "Léa", type: "quarterly", dueDate: "2026-07-02", status: "sent", selfSentAt: "2026-06-28T10:00:00.000Z", sentAt: "2026-07-02T10:00:00.000Z" },
      { id: "ev-tom", studentId: "l-tom", studentName: "Tom Leroy", firstName: "Tom", type: "quarterly", dueDate: "2026-06-28", status: "sent", selfSentAt: "2026-06-20T10:00:00.000Z", sentAt: "2026-06-28T10:00:00.000Z" },
    ],
  };
}

export function jadeEvaluationDetail(id: string) {
  const row = jadeEvaluations().evaluations.find((item) => item.id === id);
  if (!row) return null;
  const items = row.id === "ev-ines"
    ? [
        { id: "c1", label: "Organiser et planifier sa prospection", block_code: "CCP1", self_level: 2, tutor_level: 2 },
        { id: "c2", label: "Qualifier un fichier de prospects", block_code: "CCP1", self_level: 2, tutor_level: 2 },
        { id: "c3", label: "Conduire un entretien de découverte", block_code: "CCP2", self_level: 1, tutor_level: 1 },
        { id: "c4", label: "Rendre compte de son activité", block_code: "Savoir-être", self_level: 3, tutor_level: 3 },
      ]
    : [
        { id: "c1", label: "Organiser et planifier sa prospection", block_code: "CCP1", self_level: row.selfSentAt ? 2 : null, tutor_level: row.status === "sent" ? 2 : null },
      ];
  return {
    studentName: row.studentName,
    firstName: row.firstName,
    evaluation: {
      status: row.status,
      due_date: row.dueDate,
      self_sent_at: row.selfSentAt,
      type: row.type,
      general_comment: "",
      student_id: row.studentId,
    },
    items: row.status === "awaiting_student" ? items.map((item) => ({ ...item, self_level: null })) : items,
  };
}

export function jadeLivrets(alternant: string | null) {
  const selected = students.find((student) => student.id === alternant) ?? students[0];
  const periods = Array.from({ length: 13 }, (_, index) => {
    const n = index + 1;
    const signed = n < 13;
    return {
      id: `p-${selected.id}-${n}`,
      index: n,
      start_date: n === 13 ? "2026-09-01" : "2026-01-01",
      end_date: n === 13 ? "2026-10-31" : "2026-02-28",
      status: signed ? "signed" : "awaiting_tutor",
      tutor_appreciation: n === 13 ? "Léa a mené sa campagne d'appels en autonomie et progresse nettement en prise de rendez-vous." : "Période signée.",
      student_comment: n === 13 ? "J'ai pris confiance au téléphone. J'aimerais être accompagnée sur la rédaction de devis." : null,
    };
  });
  return {
    tutorName: "Jade Martin",
    students: students.map((student) => ({ id: student.id, name: student.name })),
    booklet: { contract_start: "2025-09-01", contract_end: "2027-08-31", cfa_referent_id: "cfa-1" },
    periods,
    signatures: periods.filter((period) => period.status === "signed").flatMap((period) =>
      (["student", "tutor", "cfa"] as const).map((role) => ({ period_id: period.id, signer_role: role, signed_at: "2026-07-08T10:00:00.000Z" })),
    ),
    prefill: {
      missions: ["Campagne de 20 appels de prospection", "Fichier de prospects qualifiés", "Préparation d'un rendez-vous client", "Négociation accompagnée"],
      blocks: ["CCP1 · Prospection", "CCP2 · Négociation"],
      modules: ["Veille et intelligence commerciale", "Analyser la concurrence"],
      justified: 1,
      unjustified: 0,
    },
    profile: { name: selected.name, formation: selected.formation, rythme: selected.rythme },
    identity: { company: "Atelier Nord", cfa: "Byound School", referent: "Camille Ferrand" },
    currentPeriodId: periods[12]?.id ?? null,
  };
}

function mondayOf(anchor: Date) {
  const date = new Date(anchor);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function key(date: Date) {
  return date.toISOString().slice(0, 10);
}

const pattern: Record<string, Array<"entreprise" | "ecole" | "absent">> = {
  "l-lea": ["entreprise", "entreprise", "ecole", "ecole", "entreprise"],
  "l-ines": ["ecole", "absent", "entreprise", "entreprise", "entreprise"],
  "l-noah": ["entreprise", "entreprise", "entreprise", "ecole", "ecole"],
  "l-tom": ["entreprise", "entreprise", "entreprise", "entreprise", "ecole"],
};

export function jadeCalendar(anchorIso: string | null) {
  const anchor = anchorIso ? new Date(`${anchorIso}T12:00:00`) : new Date("2026-10-21T12:00:00");
  const start = mondayOf(Number.isNaN(anchor.getTime()) ? new Date("2026-10-21T12:00:00") : anchor);
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const notes: Record<string, Record<number, string[]>> = {
    "l-lea": { 3: ["Visite 14 h"] },
    "l-tom": { 1: ["Point 10 h"] },
  };
  return {
    anchor: key(start),
    weekLabel: `Semaine du ${start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
    apprentices: students.map((student) => ({ id: student.id, name: student.name })),
    students: students.map((student) => ({
      id: student.id,
      name: student.name,
      initials: student.name.split(" ").map((part) => part[0]).join("").slice(0, 2),
      rhythmMissing: false,
      cells: days.map((date, index) => ({
        date: key(date),
        label: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        place: pattern[student.id]?.[index] ?? "entreprise",
        notes: notes[student.id]?.[index] ?? [],
      })),
    })),
    upcoming: [
      { id: "rdv-1", day: "20", month: "oct.", title: "Point mensuel · Tom Leroy", detail: "10 h · 30 min", href: "/dashboard/tuteur/calendrier", action: "Préparer" },
      { id: "rdv-2", day: "22", month: "oct.", title: "Visite tripartite · Léa Bernard", detail: "14 h · avec le formateur référent", href: "/dashboard/tuteur/calendrier", action: "Préparer" },
      { id: "rdv-3", day: "25", month: "oct.", title: "Évaluation trimestrielle · Inès Morel", detail: "À remplir", href: "/dashboard/tuteur/evaluations/ev-ines", action: "Remplir" },
      { id: "rdv-4", day: "6", month: "nov.", title: "Fin de période d'essai · Noah Petit", detail: "Bilan à faire avant cette date", href: "/dashboard/tuteur/evaluations/ev-noah", action: "Voir" },
    ],
  };
}

export function jadeConversations() {
  return [
    { id: "c-lea", name: "Léa Bernard", role: "Alternante · Bachelor AI Business", kind: "alternant", initials: "LB", learnerId: "l-lea", preview: "J'ai déposé le compte rendu de ma campagne…", at: "09:42", unread: 0 },
    { id: "c-cfa", name: "Camille Ferrand", role: "Formateur référent · Byound School", kind: "cfa", initials: "CF", learnerId: null, preview: "On confirme la visite de jeudi 14 h ?", at: "08:15", unread: 1 },
    { id: "c-ines", name: "Inès Morel", role: "Alternante · Bachelor AI Business", kind: "alternant", initials: "IM", learnerId: "l-ines", preview: "Désolée pour mardi, j'étais malade.", at: "Hier", unread: 1 },
    { id: "c-noah", name: "Noah Petit", role: "Alternant · Bachelor AI Business", kind: "alternant", initials: "NP", learnerId: "l-noah", preview: "Merci pour vos retours !", at: "Lun.", unread: 0 },
    { id: "c-tom", name: "Tom Leroy", role: "Alternant · Bachelor AI Business", kind: "alternant", initials: "TL", learnerId: "l-tom", preview: "C'est noté pour demain 10 h.", at: "16 oct.", unread: 0 },
    { id: "c-school", name: "Byound School", role: "Byound School", kind: "cfa", initials: "BY", learnerId: null, preview: "Calendrier de novembre disponible.", at: "14 oct.", unread: 1 },
  ];
}

export function jadeThread(id: string) {
  const conversation = jadeConversations().find((item) => item.id === id) ?? jadeConversations()[0];
  const messages = id === "c-lea" || conversation.id === "c-lea"
    ? [
        { id: "msg-1", mine: false, body: "Bonjour Jade, j'ai terminé la campagne de 20 appels. 6 rendez-vous obtenus !", at: "09:40", mission: null },
        { id: "msg-2", mine: false, body: "J'ai déposé le compte rendu de ma campagne d'appels.", at: "09:42", mission: { title: "Campagne de 20 appels de prospection", meta: "Mission · CCP1 · à valider", href: "/dashboard/tuteur/missions?statut=a_valider" } },
        { id: "msg-3", mine: true, body: "Bravo Léa, très beau résultat. Je regarde le compte rendu ce matin.", at: "09:51", mission: null },
      ]
    : [{ id: "msg-1", mine: false, body: conversation.preview, at: conversation.at, mission: null }];
  return { conversation, messages };
}

export function jadeResources() {
  return {
    featured: {
      id: "res-guide",
      title: "Guide du tuteur Byound School",
      description: "Votre rôle, le calendrier de l'année, le livret, les évaluations et les bons réflexes.",
      action: "Télécharger le PDF",
    },
    badge: {
      done: 2,
      total: 4,
      steps: [
        { id: "guide", label: "Lire le guide du tuteur", done: true },
        { id: "onboarding", label: "Réaliser l'entretien d'intégration", done: true },
        { id: "tripartite", label: "Participer à une visite tripartite", done: false },
        { id: "periods", label: "Signer 2 périodes du livret", done: false },
      ],
    },
    resources: [
      { id: "r1", category: "guide", title: "Le rôle du maître d'apprentissage", description: "Missions, obligations et posture du tuteur au quotidien.", format: "Fiche · 4 pages", action: "Lire", external: false },
      { id: "r2", category: "guide", title: "Accueillir un alternant : les 30 premiers jours", description: "Check-list d'intégration semaine par semaine.", format: "Guide · 6 pages", action: "Lire", external: false },
      { id: "r3", category: "template", title: "Trame d'entretien mensuel", description: "Questions clés, objectifs du mois, points de vigilance.", format: "Modèle · DOCX / PDF", action: "Télécharger", external: false },
      { id: "r4", category: "template", title: "Préparer la visite tripartite", description: "Ce que le CFA attend, documents à avoir sous la main.", format: "Check-list · PDF", action: "Télécharger", external: false },
      { id: "r5", category: "template", title: "Grille d'évaluation du titre NTC", description: "Critères par bloc de compétences et niveaux attendus.", format: "Modèle · PDF", action: "Télécharger", external: false },
      { id: "r6", category: "aid", title: "Aides à l'embauche d'un alternant", description: "Dispositifs en vigueur et démarches, sur le site officiel.", format: "Lien externe", action: "Ouvrir", external: true, url: "https://www.service-public.fr" },
      { id: "r7", category: "rules", title: "Temps de travail et absences", description: "Ce que prévoit le contrat d'apprentissage et comment signaler une absence.", format: "Fiche · 2 pages", action: "Lire", external: false },
      { id: "r8", category: "video", title: "Donner un feedback qui fait progresser", description: "Méthode simple en 3 temps, illustrée par un cas réel.", format: "Vidéo", action: "Regarder", external: false },
    ],
    referent: { conversationId: "c-cfa", label: "Camille Ferrand" },
  };
}
