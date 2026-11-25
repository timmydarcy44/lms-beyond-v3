import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { formatOpenDay } from "@/lib/lms/module-open";

export function buildModuleScheduleEmail(params: {
  firstName: string;
  finishedModuleTitle: string;
  nextModuleTitle: string;
  opensAtMs: number;
  courseTitle?: string | null;
  playHref?: string | null;
}) {
  const prenom = params.firstName.trim() || "bonjour";
  const finished = params.finishedModuleTitle.trim() || "le module précédent";
  const next = params.nextModuleTitle.trim() || "le prochain module";
  const opens = formatOpenDay(params.opensAtMs);
  const course = params.courseTitle?.trim();

  const sentence = `Bravo ${prenom}, vous venez de terminer « ${finished} ». Le prochain module « ${next} » sera ouvert à compter du ${opens}.`;

  const html = buildEdgeEmailShell({
    title: "Bravo — prochain module programmé",
    preheader: sentence,
    bodyHtml: [
      edgeEmailParagraph(`Bonjour ${escapeEdgeEmailHtml(prenom)},`),
      edgeEmailParagraph(
        `Bravo : vous venez de terminer « ${escapeEdgeEmailHtml(finished)} »${
          course ? ` dans « ${escapeEdgeEmailHtml(course)} »` : ""
        }.`,
      ),
      edgeEmailParagraph(
        `Le prochain module « ${escapeEdgeEmailHtml(next)} » sera ouvert à compter du ${escapeEdgeEmailHtml(opens)}. Nous vous préviendrons aussi par e-mail le jour de l’ouverture.`,
      ),
    ].join(""),
    cta: params.playHref
      ? { label: "Retourner à la formation", href: params.playHref }
      : undefined,
    footerNote: "Byound",
  });

  return {
    subject: `Bravo — prochain module le ${opens}`,
    html,
    sentence,
  };
}
