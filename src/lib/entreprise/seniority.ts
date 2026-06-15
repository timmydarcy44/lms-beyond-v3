/** Calcule l'ancienneté lisible à partir d'une date d'entrée. */
export function formatSeniority(hireDate: string | null | undefined, now = new Date()): string | null {
  if (!hireDate?.trim()) return null;
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime())) return null;

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mois`);
  if (parts.length === 0) return "Moins d'un mois";
  return parts.join(" et ");
}
