/** Helpers partagés pour la génération de missions (sans dépendance IA). */

export function secondarySkillsFor(primary: string): string[] {
  const key = primary.toLowerCase();
  if (key.includes("commun")) return ["Argumentation", "Influence"];
  if (key.includes("negoc")) return ["Écoute active", "Influence"];
  if (key.includes("argument")) return ["Communication", "Persuasion"];
  if (key.includes("écoute") || key.includes("ecoute")) return ["Empathie", "Communication"];
  if (key.includes("leader")) return ["Communication", "Prise de décision"];
  if (key.includes("organ")) return ["Priorisation", "Autonomie"];
  return ["Communication", "Adaptabilité"];
}
