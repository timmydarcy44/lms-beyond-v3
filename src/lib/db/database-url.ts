/**
 * Résout l'URL Postgres pour Prisma (Open Badges, assessments, etc.).
 * Priorité : DATABASE_URL explicite, puis chaîne Supabase dérivée du mot de passe DB.
 */
export function getDatabaseUrl(): string | undefined {
  const explicit = [
    process.env.DATABASE_URL,
    process.env.DIRECT_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
  ];
  for (const value of explicit) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return buildSupabaseDirectUrl();
}

function getSupabaseProjectUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    ?? process.env.SUPABASE_URL?.trim()
  );
}

/** Définit process.env.DATABASE_URL pour Prisma si dérivable (mot de passe Supabase, etc.). */
export function resolveAndApplyDatabaseUrl(): string | undefined {
  const url = getDatabaseUrl();
  if (url) {
    process.env.DATABASE_URL = url;
  }
  return url;
}

function buildSupabaseDirectUrl(): string | undefined {
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim()
    ?? process.env.POSTGRES_PASSWORD?.trim();
  const supabaseUrl = getSupabaseProjectUrl();
  if (!password || !supabaseUrl) return undefined;

  try {
    const host = new URL(supabaseUrl).hostname;
    const ref = host.split(".")[0];
    if (!ref) return undefined;
    const encoded = encodeURIComponent(password);
    const mode = process.env.SUPABASE_DB_CONNECTION?.trim().toLowerCase() ?? "session";
    const region = process.env.SUPABASE_DB_REGION?.trim();

    if (mode === "direct") {
      return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;
    }

    if (region) {
      return `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
    }

    // Session pooler (hôte db.*) — format recommandé par Supabase quand seul le mot de passe est connu
    return `postgresql://postgres.${ref}:${encoded}@db.${ref}.supabase.co:5432/postgres`;
  } catch {
    return undefined;
  }
}

export function getDatabaseConfigError(): string {
  return [
    "Connexion Prisma indisponible : copiez DATABASE_URL depuis Supabase → Settings → Database → URI,",
    "ou définissez SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL",
    "(utilisateur session postgres.[ref] ; option SUPABASE_DB_REGION pour le pooler AWS).",
  ].join(" ");
}
