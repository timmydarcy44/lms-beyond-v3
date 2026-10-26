const TENDER = /appel d['’]offres|accord-cadre|march[eé] public|bon de commande|mise en concurrence|proc[eé]dure adapt|avis de march|prestations? de |fourniture d['’]/i;

export function isCallForTender(value: string) {
  return TENDER.test(value);
}
