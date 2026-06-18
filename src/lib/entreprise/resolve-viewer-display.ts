type ViewerProfileInput = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type ViewerMetaInput = Record<string, unknown> | null | undefined;

/** Nom affiché RH entreprise — profil DB prioritaire, puis métadonnées auth. */
export function resolveEnterpriseViewerDisplay(
  profile: ViewerProfileInput | null | undefined,
  authEmail: string | null | undefined,
  metadata?: ViewerMetaInput,
): { prenom: string | null; nom: string | null; email: string | null; displayName: string } {
  const meta = metadata ?? {};
  const prenom =
    profile?.first_name?.trim() ||
    (typeof meta.first_name === "string" ? meta.first_name.trim() : "") ||
    (typeof meta.prenom === "string" ? meta.prenom.trim() : "") ||
    null;
  const nom =
    profile?.last_name?.trim() ||
    (typeof meta.last_name === "string" ? meta.last_name.trim() : "") ||
    (typeof meta.nom === "string" ? meta.nom.trim() : "") ||
    null;

  const fromFull = profile?.full_name?.trim();
  const full = [prenom, nom].filter(Boolean).join(" ").trim() || fromFull || "";
  const email = authEmail?.trim() || profile?.email?.trim() || null;

  return {
    prenom,
    nom,
    email,
    displayName: full || email || "—",
  };
}
