/**
 * Prénom affiché dans le dashboard apprenant (salutation « Bonjour … »).
 * Priorité : profil → métadonnées auth → heuristique e-mail (ex. timmydarcy44 → Timmy).
 */
export function resolveLearnerDisplayFirstName(opts: {
  profileFirstName?: string | null;
  metadataFirstName?: string | null;
  metadataGivenName?: string | null;
  metadataPrenom?: string | null;
  email?: string | null;
}): string {
  const direct =
    opts.profileFirstName?.trim() ||
    opts.metadataFirstName?.trim() ||
    opts.metadataPrenom?.trim() ||
    opts.metadataGivenName?.trim();
  if (direct) return direct;

  const local = opts.email?.split("@")[0]?.trim().toLowerCase();
  if (!local) return "Apprenant";

  const base = local.replace(/\d+$/g, "");
  if (!base) return "Apprenant";

  const separated = base.split(/[._-]+/).filter(Boolean);
  if (separated[0] && separated[0].length >= 2) {
    const p = separated[0];
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  const compound = base.match(/^([a-z]{2,12})([a-z]{2,})$/i);
  if (compound?.[1]) {
    const first = compound[1];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }

  if (base.length >= 2) {
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  return "Apprenant";
}
