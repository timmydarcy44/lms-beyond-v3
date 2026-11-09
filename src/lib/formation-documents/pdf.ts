import { jsPDF } from "jspdf";
import type { Lot4DocumentKind } from "@/lib/formation-documents/constants";
import {
  eurosFromCents,
  type DossierDocContext,
} from "@/lib/formation-documents/context";
import {
  formatDateAdmin,
  formatDatesLong,
  formatDatesShort,
  formatDuration,
  formatHours,
  slotsFromDocContext,
} from "@/lib/formation-documents/session-dates";

type BuildOpts = {
  ctx: DossierDocContext;
  kind: Lot4DocumentKind;
  /** Personnalisation convocation / certificat / attestation */
  participantName?: string | null;
  /** Demi-journées suivies (certificat) */
  attendedHalfDays?: number | null;
  plannedHalfDays?: number | null;
};

function ofBlock(ctx: DossierDocContext): string[] {
  const o = ctx.of;
  const lines = [o.legal_name];
  if (o.nda) lines.push(`NDA ${o.nda}`);
  if (o.siret) lines.push(`SIRET ${o.siret}`);
  if (o.siren && !o.siret) lines.push(`SIREN ${o.siren}`);
  if (o.vat_intra) lines.push(`TVA ${o.vat_intra}`);
  const addr = [o.address_line, [o.address_zip, o.address_city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (addr) lines.push(addr);
  return lines;
}

function drawHeader(doc: jsPDF, ctx: DossierDocContext, title: string) {
  const margin = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 17, 17);
  doc.text(ctx.of.legal_name || "Byound", margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 100);
  let y = 28;
  for (const line of ofBlock(ctx).slice(1)) {
    doc.text(line, margin, y);
    y += 4.2;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 17, 17);
  doc.text(title, margin, Math.max(y + 12, 48));
  return Math.max(y + 20, 56);
}

function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text("Document généré par Byound — www.byound.fr", pageW / 2, pageH - 10, {
    align: "center",
  });
}

function moneyLines(ctx: DossierDocContext): string[] {
  return [
    `Montant HT : ${eurosFromCents(ctx.dossier.amount_ht_cents)}`,
    `TVA : ${eurosFromCents(ctx.dossier.amount_tva_cents)}`,
    `Montant TTC : ${eurosFromCents(ctx.dossier.amount_ttc_cents ?? ctx.dossier.amount_ht_cents)}`,
  ];
}

function slotsSummary(ctx: DossierDocContext): string[] {
  if (!ctx.slots.length) return ["Dates : à confirmer"];
  const slots = slotsFromDocContext(ctx.slots);
  const short = formatDatesShort(slots);
  const hours = formatHours(slots);
  return [
    short ? `Dates : ${short}` : "Dates : à confirmer",
    hours ? `Horaires : ${hours}` : "",
  ].filter(Boolean);
}

function buildDevis(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Devis de formation");
  const margin = 18;
  const ref = `DEV-${ctx.dossier.id.slice(0, 8).toUpperCase()}`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);
  doc.text(`Référence : ${ref}`, margin, y);
  y += 7;
  doc.text(`Date : ${formatDateAdmin()}`, margin, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Client", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(ctx.organization.name, margin, y);
  y += 5;
  if (ctx.organization.siret) {
    const siretDigits = String(ctx.organization.siret).replace(/\D/g, "");
    const siretLabel =
      siretDigits.length === 14
        ? siretDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4")
        : siretDigits;
    doc.text(`SIRET ${siretLabel}`, margin, y);
    y += 5;
  }
  if (ctx.dossier.contact_name) {
    doc.text(`Contact : ${ctx.dossier.contact_name}`, margin, y);
    y += 5;
  }
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Prestation", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const title = ctx.dossier.course_title || ctx.session?.title || "Formation";
  doc.text(title, margin, y);
  y += 6;
  if (ctx.dossier.modality_intra_inter) {
    doc.text(`Modalité : ${ctx.dossier.modality_intra_inter}`, margin, y);
    y += 5;
  }
  if (ctx.dossier.modality_presence) {
    doc.text(`Présence : ${ctx.dossier.modality_presence}`, margin, y);
    y += 5;
  }
  y += 8;

  for (const line of moneyLines(ctx)) {
    doc.text(line, margin, y);
    y += 6;
  }
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text(
    "Devis valable 30 jours. L'acceptation vaut commande sous réserve de convention signée.",
    margin,
    y,
    { maxWidth: 174 },
  );
}

function writeBlocks(
  doc: jsPDF,
  blocks: string[],
  startY: number,
  opts?: { margin?: number; fontSize?: number; gap?: number },
): number {
  const margin = opts?.margin ?? 18;
  const fontSize = opts?.fontSize ?? 10;
  const gap = opts?.gap ?? 3;
  let y = startY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(40, 40, 50);
  for (const line of blocks) {
    const isTitle = line.startsWith("Article ") || line.startsWith("Annexe");
    doc.setFont("helvetica", isTitle ? "bold" : "normal");
    doc.setFontSize(isTitle ? fontSize + 1 : fontSize);
    const wrapped = doc.splitTextToSize(line, 174);
    if (y + wrapped.length * 5 > 270) {
      doc.addPage();
      y = 24;
    }
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + gap;
  }
  return y;
}

function modalityLabel(ctx: DossierDocContext): string {
  const parts: string[] = [];
  if (ctx.dossier.modality_intra_inter === "intra") parts.push("Intra-entreprise");
  else if (ctx.dossier.modality_intra_inter === "inter") parts.push("Inter-entreprises");
  else if (ctx.dossier.modality_intra_inter) parts.push(ctx.dossier.modality_intra_inter);
  if (ctx.dossier.modality_presence === "presentiel") parts.push("présentiel");
  else if (ctx.dossier.modality_presence === "distanciel") parts.push("distanciel");
  else if (ctx.dossier.modality_presence === "hybride") parts.push("hybride");
  else if (ctx.dossier.modality_presence) parts.push(ctx.dossier.modality_presence);
  return parts.join(" · ") || "à préciser";
}

function fundingLabel(raw: string | null): string {
  if (!raw) return "à préciser";
  const map: Record<string, string> = {
    opco: "OPCO (subrogation)",
    entreprise: "Entreprise",
    particulier: "Particulier",
    fifpl: "FIF PL",
    agefice: "AGEFICE",
    cpf: "CPF",
  };
  return map[raw] || raw;
}

function buildConvention(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Convention de formation professionnelle");
  const margin = 18;
  const courseTitle =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";
  const ref = `CONV-${ctx.dossier.id.slice(0, 8).toUpperCase()}`;
  const ofAddr = [
    ctx.of.address_line,
    [ctx.of.address_zip, ctx.of.address_city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const blocks: string[] = [
    `Référence : ${ref} — Date : ${formatDateAdmin()}`,
    "",
    `Entre les soussignés :`,
    `${ctx.of.legal_name}, organisme de formation${ctx.of.nda ? ` déclaré sous le NDA ${ctx.of.nda}` : ""}${ctx.of.siret ? `, SIRET ${ctx.of.siret}` : ""}${ofAddr ? `, dont le siège est situé ${ofAddr}` : ""}, ci-après dénommé « l'Organisme »,`,
    `Et`,
    `${ctx.organization.name}${ctx.organization.siret ? ` (SIRET ${ctx.organization.siret})` : ""}${ctx.dossier.contact_name ? `, représentée par ${ctx.dossier.contact_name}` : ""}${ctx.dossier.contact_email ? ` (${ctx.dossier.contact_email})` : ""}${ctx.dossier.contact_phone ? `, tél. ${ctx.dossier.contact_phone}` : ""}, ci-après dénommé « le Client »,`,
    `Il a été convenu ce qui suit.`,
    "",
    `Article 1 — Objet`,
    `La présente convention a pour objet la réalisation par l'Organisme de l'action de formation intitulée « ${courseTitle} ».`,
    ctx.course?.short_description || "",
    "",
    `Article 2 — Nature et caractéristiques de l'action`,
    `Nature : action de formation professionnelle continue.`,
    `Modalité : ${modalityLabel(ctx)}.`,
    `Durée : ${
      ctx.course?.duration ||
      (ctx.slots.length ? formatDuration(slotsFromDocContext(ctx.slots)) : "à confirmer")
    }.`,
    ctx.course?.level ? `Niveau : ${ctx.course.level}.` : "",
    ctx.course?.prerequisites ? `Prérequis : ${ctx.course.prerequisites}` : "",
    ctx.course?.audience?.length
      ? `Public concerné : ${ctx.course.audience.join(", ")}.`
      : "",
    "",
    `Article 3 — Objectifs pédagogiques`,
    ...(ctx.course?.objectives?.length
      ? ctx.course.objectives.map((o, i) => `${i + 1}. ${o}`)
      : ["Objectifs détaillés communiqués dans le programme joint."]),
    "",
    ...(ctx.course?.skills?.length
      ? [
          `Compétences visées :`,
          ...ctx.course.skills.map((s) => `• ${s}`),
          "",
        ]
      : []),
    `Article 4 — Dates et horaires`,
    ...(ctx.slots.length
      ? [
          formatDatesLong(slotsFromDocContext(ctx.slots)),
          formatHours(slotsFromDocContext(ctx.slots))
            ? `Horaires : ${formatHours(slotsFromDocContext(ctx.slots))}`
            : "",
        ].filter(Boolean)
      : ["Dates à confirmer d'un commun accord."]),
    "",
    `Article 5 — Lieu`,
    ctx.session?.location_label || "Lieu selon demande (dates à confirmer).",
    "",
    `Article 6 — Stagiaires`,
    ctx.participants.length
      ? `Nombre de stagiaires : ${ctx.participants.length}.`
      : "Liste des stagiaires transmise par le Client avant le démarrage.",
    ...ctx.participants.map(
      (p) => `• ${p.name}${p.job_title ? ` — ${p.job_title}` : ""}${p.email ? ` (${p.email})` : ""}`,
    ),
    "",
    `Article 7 — Prix et conditions financières`,
    ...moneyLines(ctx),
    `Financement : ${fundingLabel(ctx.dossier.funding_type)}.`,
    `Le règlement s'effectue selon les modalités indiquées sur le devis et la facture.`,
    "",
    `Article 8 — Obligations des parties`,
    `L'Organisme s'engage à mettre en œuvre les moyens pédagogiques, techniques et d'encadrement nécessaires à la qualité de l'action.`,
    `Le Client s'engage à transmettre les informations nécessaires, à assurer la présence des stagiaires et à régler le prix convenu.`,
    "",
    `Article 9 — Documents contractuels`,
    `Les conditions générales de vente, le règlement intérieur et le programme de formation joints (ou accessibles via le lien de signature) font partie intégrante de la présente convention.`,
    "",
    `Article 10 — Droit applicable`,
    `La présente convention est soumise au droit français. Les parties s'efforceront de résoudre à l'amiable tout différend avant tout recours.`,
  ].filter((line) => line !== undefined);

  y = writeBlocks(
    doc,
    blocks.filter((b) => b !== ""),
    y,
    { margin, fontSize: 10, gap: 2.5 },
  );

  y += 12;
  if (y > 250) {
    doc.addPage();
    y = 30;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Pour l'Organisme", margin, y);
  doc.text("Pour le Client", margin + 95, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(ctx.of.legal_name, margin, y);
  doc.text(ctx.organization.name, margin + 95, y);
  y += 16;
  doc.setDrawColor(180, 180, 190);
  doc.line(margin, y, margin + 60, y);
  doc.line(margin + 95, y, margin + 155, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 110);
  doc.text("Signature électronique via le lien reçu par e-mail", margin, y);
  doc.text(
    ctx.dossier.contact_name ? `Signataire : ${ctx.dossier.contact_name}` : "Signature Client",
    margin + 95,
    y,
  );
}

function buildCgv(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Conditions générales de vente");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 50);
  const paras = [
    "1. Objet — Les présentes CGV régissent les prestations de formation professionnelle dispensées par l'Organisme.",
    "2. Commande — La commande est ferme après acceptation du devis et signature de la convention.",
    "3. Prix — Les prix sont indiqués en euros HT. La TVA applicable figure sur le devis et la facture.",
    "4. Paiement — Sauf mention contraire, règlement à 30 jours date de facture. En cas de subrogation OPCO, le Client reste garant.",
    "5. Annulation — Toute annulation Client à moins de 10 jours ouvrés avant le début peut entraîner facturation partielle ou totale.",
    "6. Responsabilité — L'Organisme met en œuvre les moyens nécessaires à la qualité pédagogique ; il ne garantit pas un résultat professionnel individuel.",
    "7. Données — Les données sont traitées conformément à la réglementation applicable et à la politique de confidentialité Byound.",
    "8. Litiges — Droit français. Recherche de solution amiable préalable.",
  ];
  for (const p of paras) {
    const wrapped = doc.splitTextToSize(p, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 4;
    if (y > 270) {
      doc.addPage();
      y = 24;
    }
  }
}

function buildReglement(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Règlement intérieur");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 50);
  const paras = [
    "Le présent règlement s'applique à toute personne participant à une action de formation organisée par " +
      (ctx.of.legal_name || "Byound") +
      ".",
    "Horaires — Les horaires sont communiqués sur la convocation. Les retards répétés peuvent être signalés à l'employeur.",
    "Présence — L'émargement électronique (ou sur appareil formateur) constitue la preuve de présence pour chaque demi-journée.",
    "Comportement — Respect mutuel, confidentialité des échanges entre participants, interdiction de tout harcèlement.",
    "Sécurité — Respect des consignes du lieu d'accueil. Signaler tout besoin d'aménagement au référent handicap de l'Organisme.",
    "Matériel — Le matériel mis à disposition reste propriété de l'Organisme ou du lieu d'accueil.",
    "Sanctions — En cas de manquement grave, l'Organisme peut exclure le participant après information du Client.",
  ];
  for (const p of paras) {
    const wrapped = doc.splitTextToSize(p, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 4;
  }
}

function buildConvocation(doc: jsPDF, ctx: DossierDocContext, participantName?: string | null) {
  let y = drawHeader(doc, ctx, "Convocation");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);

  doc.text(`À l'attention de ${participantName || "la participante / le participant"}`, margin, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text(ctx.dossier.course_title || ctx.session?.title || "Formation", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");

  for (const line of slotsSummary(ctx)) {
    doc.text(line, margin, y);
    y += 6;
  }
  y += 4;
  doc.text(`Lieu : ${ctx.session?.location_label || "communiqué ultérieurement"}`, margin, y);
  y += 10;

  const notes = [
    "Le jour J, munissez-vous de votre téléphone pour émarger (code salle annoncé par le formateur).",
    "Aucun lien d'émargement n'est envoyé à l'avance — présentez-vous en salle.",
    "En cas d'empêchement, prévenez votre contact Byound dès que possible.",
  ];
  doc.setFontSize(10);
  for (const n of notes) {
    const wrapped = doc.splitTextToSize(`• ${n}`, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 3;
  }
}

function buildProgramme(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Programme de formation");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);
  const title = ctx.dossier.course_title || ctx.session?.title || "Formation";
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  const lines = [
    `Public : salariés / demandeurs d'emploi selon dossier.`,
    `Modalité : ${[ctx.dossier.modality_intra_inter, ctx.dossier.modality_presence].filter(Boolean).join(" · ") || "à préciser"}.`,
    `Lieu : ${ctx.session?.location_label || "à confirmer"}.`,
    "Objectifs : développer les compétences visées par le programme pédagogique Byound.",
    "Moyens : apports théoriques, mises en situation, échanges entre pairs.",
    "Évaluation : positionnement (Lot 6), émargement, évals à chaud / à froid.",
    "Dates :",
    ...slotsSummary(ctx),
  ];
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5.2 + 2;
  }
}

function buildLivret(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Livret d'accueil");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 50);
  const paras = [
    `Bienvenue chez ${ctx.of.legal_name}. Ce livret regroupe les informations utiles pour votre parcours.`,
    "Contact pédagogique : votre formateur vous sera présenté le jour J.",
    "Référent handicap : contactez Byound pour toute demande d'aménagement.",
    "Émargement : chaque demi-journée se signe depuis votre téléphone (code salle) ou sur l'appareil du formateur.",
    "Règlement intérieur et CGV : joints à la convention ou disponibles sur demande.",
    `Lieu : ${ctx.session?.location_label || "communiqué avec la convocation"}.`,
  ];
  for (const p of paras) {
    const wrapped = doc.splitTextToSize(p, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 4;
  }
}

function buildCertificat(
  doc: jsPDF,
  ctx: DossierDocContext,
  participantName?: string | null,
  attended?: number | null,
  planned?: number | null,
) {
  let y = drawHeader(doc, ctx, "Certificat de réalisation");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);
  doc.text(
    `Je soussigné, représentant ${ctx.of.legal_name}, certifie que`,
    margin,
    y,
    { maxWidth: 174 },
  );
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(participantName || "le/la participant·e", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `a suivi la formation « ${ctx.dossier.course_title || ctx.session?.title || "Formation"} ».`,
    margin,
    y,
    { maxWidth: 174 },
  );
  y += 12;
  const a = attended ?? 0;
  const p = planned ?? (ctx.slots.length || 0);
  doc.text(`Durée réalisée : ${a} demi-journée(s) sur ${p} planifiée(s).`, margin, y);
  y += 8;
  for (const line of slotsSummary(ctx)) {
    doc.text(`• ${line}`, margin, y);
    y += 5.5;
  }
  y += 12;
  doc.text(`Fait le ${formatDateAdmin()}`, margin, y);
  y += 16;
  doc.text("Signature de l'organisme", margin, y);
}

function buildAttestation(
  doc: jsPDF,
  ctx: DossierDocContext,
  participantName?: string | null,
  attended?: number | null,
  planned?: number | null,
) {
  let y = drawHeader(doc, ctx, "Attestation de fin de formation");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);
  doc.text(`${ctx.of.legal_name} atteste que`, margin, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(participantName || "le/la participant·e", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `a achevé la formation « ${ctx.dossier.course_title || ctx.session?.title || "Formation"} ».`,
    margin,
    y,
    { maxWidth: 174 },
  );
  y += 12;
  const a = attended ?? 0;
  const p = planned ?? (ctx.slots.length || 0);
  doc.text(`Présence : ${a} demi-journée(s) sur ${p} planifiée(s).`, margin, y);
  y += 8;
  doc.text(`Client : ${ctx.organization.name}`, margin, y);
  y += 8;
  for (const line of slotsSummary(ctx)) {
    doc.text(line, margin, y);
    y += 5.5;
  }
  y += 12;
  doc.text(`Délivré le ${formatDateAdmin()}`, margin, y);
}

export function buildFormationDocumentPdf(opts: BuildOpts): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  switch (opts.kind) {
    case "devis":
      buildDevis(doc, opts.ctx);
      break;
    case "convention":
      buildConvention(doc, opts.ctx);
      break;
    case "cgv":
      buildCgv(doc, opts.ctx);
      break;
    case "reglement":
      buildReglement(doc, opts.ctx);
      break;
    case "programme":
      buildProgramme(doc, opts.ctx);
      break;
    case "convocation":
      buildConvocation(doc, opts.ctx, opts.participantName);
      break;
    case "livret":
      buildLivret(doc, opts.ctx);
      break;
    case "certificat":
      buildCertificat(
        doc,
        opts.ctx,
        opts.participantName,
        opts.attendedHalfDays,
        opts.plannedHalfDays,
      );
      break;
    case "attestation":
      buildAttestation(
        doc,
        opts.ctx,
        opts.participantName,
        opts.attendedHalfDays,
        opts.plannedHalfDays,
      );
      break;
  }
  drawFooter(doc);
  const array = doc.output("arraybuffer");
  return Buffer.from(array);
}
