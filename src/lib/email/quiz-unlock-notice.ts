import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export function quizUnlockSentence(score: number, moduleName: string): string {
  const shown = Math.min(100, Math.max(0, Math.round(score)));
  const name = moduleName.trim();
  return `Bravo, votre score au quiz est de ${shown}%, votre accès pour le module ${name} est ouvert.`;
}

export function buildQuizUnlockEmail(params: { score: number; moduleName: string }) {
  const sentence = quizUnlockSentence(params.score, params.moduleName);
  const html = buildEdgeEmailShell({
    title: "Bravo.",
    preheader: sentence,
    bodyHtml: `<p>${escapeEdgeEmailHtml(sentence)}</p>`,
    footerNote: "Byound",
  });
  return {
    subject: `Bravo, le module ${params.moduleName.trim()} est ouvert`,
    html,
    sentence,
  };
}
