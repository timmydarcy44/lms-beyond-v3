/** Emails reconnus comme super admins LMS (aligné avec `super-admin.ts`). */
/** Si vous ajoutez un e-mail ici, synchronisez aussi `supabase/migrations/20260503220000_list_organizations_catalogue_rpc.sql` (RPC catalogue galaxies). */

const BUILTIN_SUPER_ADMIN_EMAILS = new Set([
  "timmydarcy44@gmail.com",
  "contentin.cabinet@gmail.com",
  "jerome.picot@edgebs.fr",
]);

function parseSuperAdminEmailsFromEnv(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS;
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmailAllowlisted(email: string | null | undefined): boolean {
  const norm = email?.trim().toLowerCase();
  if (!norm) return false;
  if (BUILTIN_SUPER_ADMIN_EMAILS.has(norm)) return true;
  return parseSuperAdminEmailsFromEnv().includes(norm);
}
