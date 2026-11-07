import { jsPDF } from "jspdf";
import type { Lot4DocumentKind } from "@/lib/formation-documents/constants";
import {
  eurosFromCents,
  formatFrDate,
  type DossierDocContext,
} from "@/lib/formation-documents/context";

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
  return ctx.slots.map((s) => {
    const part = s.day_part === "matin" ? "matin" : "après-midi";
    return `${formatFrDate(s.slot_date)} · ${part}`;
  });
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
  doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Client", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(ctx.organization.name, margin, y);
  y += 5;
  if (ctx.organization.siret) {
    doc.text(`SIRET ${ctx.organization.siret}`, margin, y);
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

function buildConvention(doc: jsPDF, ctx: DossierDocContext) {
  let y = drawHeader(doc, ctx, "Convention de formation");
  const margin = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);

  const blocks = [
    `Entre ${ctx.of.legal_name}, organisme de formation${ctx.of.nda ? ` (NDA ${ctx.of.nda})` : ""}, ci-après « l'Organisme »,`,
    `Et ${ctx.organization.name}${ctx.organization.siret ? ` (SIRET ${ctx.organization.siret})` : ""}, ci-après « le Client »,`,
    `Il est convenu ce qui suit.`,
    `Article 1 — Objet : ${ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle"}.`,
    `Article 2 — Modalités : ${[ctx.dossier.modality_intra_inter, ctx.dossier.modality_presence].filter(Boolean).join(" · ") || "à préciser"}.`,
    `Article 3 — Dates :`,
    ...slotsSummary(ctx),
    `Article 4 — Lieu : ${ctx.session?.location_label || "à confirmer"}.`,
    `Article 5 — Prix : ${moneyLines(ctx).join(" · ")}.`,
    `Article 6 — Financement : ${ctx.dossier.funding_type || "à préciser"}.`,
    `Article 7 — Les CGV et le règlement intérieur joints font partie intégrante de la présente convention.`,
  ];

  for (const line of blocks) {
    const wrapped = doc.splitTextToSize(line, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5.2 + 2;
    if (y > 260) {
      doc.addPage();
      y = 24;
    }
  }

  y += 10;
  doc.text("Pour l'Organisme", margin, y);
  doc.text("Pour le Client", margin + 95, y);
  y += 18;
  doc.setDrawColor(180, 180, 190);
  doc.line(margin, y, margin + 60, y);
  doc.line(margin + 95, y, margin + 155, y);
  y += 6;
  doc.setFontSize(8);
  doc.text("Signature électronique via le lien reçu par e-mail", margin, y);
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
  doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
  y += 16;
  doc.text("Signature de l'organisme", margin, y);
}

function buildAttestation(doc: jsPDF, ctx: DossierDocContext, participantName?: string | null) {
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
  doc.text(`Client : ${ctx.organization.name}`, margin, y);
  y += 8;
  for (const line of slotsSummary(ctx)) {
    doc.text(line, margin, y);
    y += 5.5;
  }
  y += 12;
  doc.text(`Délivré le ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
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
      buildAttestation(doc, opts.ctx, opts.participantName);
      break;
  }
  drawFooter(doc);
  const array = doc.output("arraybuffer");
  return Buffer.from(array);
}
