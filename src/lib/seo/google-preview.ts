import { seoWordCount } from "@/lib/seo/score";

export const GOOGLE_TITLE_MAX = 60;
export const GOOGLE_DESC_MAX = 158;

export function clipGoogleSnippet(value: string, max: number): { text: string; clipped: boolean } {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return { text, clipped: false };
  const slice = text.slice(0, max).replace(/\s+\S*$/, "").trimEnd();
  return { text: `${slice || text.slice(0, max)}…`, clipped: true };
}

export function googleTitlePreview(title: string) {
  return clipGoogleSnippet(title, GOOGLE_TITLE_MAX);
}

export function googleDescriptionPreview(description: string) {
  return clipGoogleSnippet(description, GOOGLE_DESC_MAX);
}

export type CharMeterTone = "green" | "orange" | "red";

export function charMeter(length: number, min: number, max: number, barMax: number) {
  const tone: CharMeterTone = length > max ? "red" : length >= min ? "green" : "orange";
  const fill = Math.min(100, (length / barMax) * 100);
  const zoneLeft = (min / barMax) * 100;
  const zoneWidth = ((max - min) / barMax) * 100;
  const ideal = `idéal ${min} à ${max}`;
  const label = `${length} caractère${length > 1 ? "s" : ""} · ${ideal}`;
  const hint =
    length === 0
      ? "Champ vide — remplissez-le pour apparaître dans Google."
      : length < min
        ? "Trop court : décrivez la page et donnez envie de cliquer."
        : length > max
          ? "Trop long : Google coupera vers la fin de la zone verte."
          : "Longueur dans la zone idéale.";
  return { length, tone, fill, zoneLeft, zoneWidth, label, hint };
}

export function wordMeter(text: string, min = 80, max = 300) {
  const length = seoWordCount(text);
  const tone: CharMeterTone = length > max ? "red" : length >= min ? "green" : "orange";
  const fill = Math.min(100, (length / max) * 100);
  const zoneLeft = (min / max) * 100;
  const zoneWidth = ((max - min) / max) * 100;
  const label = `${length} / ${max} mots conseillés`;
  const hint =
    length === 0
      ? "Résumé manquant. Visez 80 à 300 mots pour llms.txt."
      : length < min
        ? `Résumé trop court (${length} mot${length > 1 ? "s" : ""}). 80 mots minimum.`
        : length > max
          ? "Un peu long : 300 mots suffisent pour les IA."
          : "Longueur dans la zone conseillée.";
  return { length, tone, fill, zoneLeft, zoneWidth, label, hint };
}
