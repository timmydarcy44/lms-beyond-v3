import { jsPDF } from "jspdf";
import {
  BENEFICIARY_SITUATION_LABEL,
  EXCHANGE_MODE_LABEL,
  FUNDING_LABEL,
  PLACE_MODE_LABEL,
  type OrganizationNeedAnalysis,
} from "@/lib/control/need-analyses";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString("fr-FR");
}

type NameMap = Record<string, string>;

/** Génère le PDF preuve Qualiopi (indicateur 4). */
export function buildNeedAnalysisPdf(
  analysis: OrganizationNeedAnalysis,
  opts: {
    clientName: string;
    conductedByName?: string | null;
    validatedByName?: string | null;
    createdByName?: string | null;
    updatedByName?: string | null;
  },
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 14;
  const pageW = 210;
  let y = 16;

  const ensure = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = 16;
    }
  };

  const line = (label: string, value: string, wide = false) => {
    if (!value.trim()) return;
    ensure(wide ? 18 : 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const chunks = doc.splitTextToSize(value, pageW - margin * 2);
    doc.text(chunks, margin, y);
    y += chunks.length * 4.2 + 3;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Byound — Analyse du besoin", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Client : ${opts.clientName}`, margin, y);
  y += 5;
  doc.text(`Titre : ${analysis.title || "Analyse du besoin"}`, margin, y);
  y += 5;
  doc.text(
    `Type : ${analysis.request_type === "particulier" ? "Particulier" : "Entreprise"}`,
    margin,
    y,
  );
  y += 8;

  line("Date de l'échange", fmtDate(analysis.exchange_date));
  line(
    "Mode d'échange",
    analysis.exchange_mode ? EXCHANGE_MODE_LABEL[analysis.exchange_mode] : "",
  );
  line(
    "Interlocuteur",
    [analysis.interlocutor_name, analysis.interlocutor_role].filter(Boolean).join(" — "),
  );
  line("Analyse menée par", opts.conductedByName || analysis.conducted_by || "");

  if (analysis.request_type === "particulier") {
    const d = analysis.details;
    line(
      "Situation actuelle",
      d.beneficiary_situation ? BENEFICIARY_SITUATION_LABEL[d.beneficiary_situation] : "",
    );
    line("Projet professionnel", d.professional_project, true);
    line("Motivations et attentes", d.motivations, true);
    line("Connaissances / expérience", d.domain_experience, true);
    line("Temps disponible / semaine", d.weekly_availability);
    line(
      "Équipement",
      [
        d.has_computer != null ? `Ordinateur : ${d.has_computer ? "oui" : "non"}` : null,
        d.has_internet != null ? `Internet : ${d.has_internet ? "oui" : "non"}` : null,
        d.digital_ease ? `Aisance : ${d.digital_ease}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    );
  } else {
    line("Effectif", analysis.details.headcount);
    line("Postes / métiers", analysis.details.roles);
    line("Niveau", analysis.details.level);
    line("Expérience", analysis.details.experience);
    line("Notes public", analysis.details.audience_notes, true);
  }

  line(
    analysis.request_type === "particulier"
      ? "Pourquoi cette formation, maintenant ?"
      : "Contexte / problème",
    analysis.context_problem,
    true,
  );
  line(
    analysis.request_type === "particulier"
      ? "Ce que la personne veut être capable de faire"
      : "Résultats attendus",
    analysis.expected_outcomes,
    true,
  );

  line(
    "Modalité",
    analysis.details.place_mode ? PLACE_MODE_LABEL[analysis.details.place_mode] : "",
  );
  line("Lieu", analysis.details.place);
  line("Durée", analysis.details.duration);
  line("Dates", analysis.details.dates);
  if (analysis.request_type === "particulier") {
    line("Prix annoncé (TTC)", analysis.details.announced_price_ttc);
  } else {
    line("Budget", analysis.details.budget);
  }
  line(
    "Financement",
    analysis.details.funding ? FUNDING_LABEL[analysis.details.funding] : "",
  );

  line(
    "Question aménagement posée",
    analysis.accessibility_asked ? "Oui" : "Non",
  );
  line("Besoin d'aménagement", analysis.accessibility_needed || "");
  if (analysis.accessibility_needed === "oui" || analysis.disability_accommodations) {
    line("Aménagements", analysis.disability_accommodations, true);
    line("Adaptations décidées", analysis.decided_adaptations, true);
  }

  line("Validée par (Byound)", opts.validatedByName || analysis.validated_by || "");
  line("Date validation interne", fmtDate(analysis.validated_at));
  line("Envoyée au client le", fmtDate(analysis.client_sent_at));
  line("Validée par le client le", fmtDate(analysis.client_validated_at));

  if (analysis.recommendations.length) {
    line(
      "Préconisations",
      analysis.recommendations.map((r) => `• ${r.label}${r.notes ? ` — ${r.notes}` : ""}`).join("\n"),
      true,
    );
  }

  y += 4;
  ensure(16);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `Créée le ${fmtDate(analysis.created_at)} par ${opts.createdByName || "—"} · Modifiée le ${fmtDate(analysis.updated_at)} par ${opts.updatedByName || "—"}`,
    margin,
    y,
  );
  doc.setTextColor(0);

  const ab = doc.output("arraybuffer");
  return Buffer.from(ab);
}

export function needAnalysisPdfFileName(clientName: string, dateIso: string | null): string {
  const safe = clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "Client";
  const day = (dateIso || new Date().toISOString()).slice(0, 10);
  return `Analyse-besoin_${safe}_${day}.pdf`;
}

export type { NameMap };
