const PLACEHOLDER_FIRST_NAMES = new Set(["apprenant", "learner", "user", "utilisateur"]);

function isUsableName(value: string | null | undefined): value is string {
  const t = value?.trim();
  if (!t) return false;
  return !PLACEHOLDER_FIRST_NAMES.has(t.toLowerCase());
}

function capitalizeWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

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
    (isUsableName(opts.profileFirstName) && opts.profileFirstName.trim()) ||
    (isUsableName(opts.metadataFirstName) && opts.metadataFirstName.trim()) ||
    (isUsableName(opts.metadataPrenom) && opts.metadataPrenom.trim()) ||
    (isUsableName(opts.metadataGivenName) && opts.metadataGivenName.trim()) ||
    "";
  if (direct) return direct;

  const local = opts.email?.split("@")[0]?.trim().toLowerCase();
  if (!local) return "Apprenant";

  // timmydarcy44+alias → timmydarcy44
  const localBase = local.split("+")[0] ?? local;
  const base = localBase.replace(/\d+$/g, "");
  if (!base) return "Apprenant";

  const separated = base.split(/[._-]+/).filter(Boolean);
  if (separated.length > 1 && separated[0] && separated[0].length >= 2) {
    return capitalizeWord(separated[0]);
  }

  // timmydarcy → Timmy (préfixe 3–6 lettres, reste ≥ 4)
  for (const len of [5, 4, 6, 3]) {
    if (base.length >= len + 4) {
      return capitalizeWord(base.slice(0, len));
    }
  }

  if (base.length >= 2) {
    return capitalizeWord(base);
  }

  return "Apprenant";
}
