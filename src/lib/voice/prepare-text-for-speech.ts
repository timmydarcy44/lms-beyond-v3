/** Nettoie le texte avant synthèse vocale (pas de markdown, prononciation FR). */
export function stripMarkdownForSpeech(text: string): string {
  return (
    text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/#{1,6}\s*/g, "")
      .replace(/`+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Remplace les termes mal prononcés par la synthèse voix. */
export function fixSpeechPronunciation(text: string): string {
  return text
    .replace(/\bpipeline\b/gi, "pipe line commercial")
    .replace(/\bpipelines\b/gi, "pipe lines commerciaux")
    .replace(/\bBTOB\b/gi, "B to B")
    .replace(/\bBTob\b/gi, "B to B");
}

export function prepareTextForSpeech(text: string): string {
  return fixSpeechPronunciation(stripMarkdownForSpeech(text));
}
