"use server";

type AuthUserRow = {
  id: string;
  last_sign_in_at?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type SupabaseAdminClient = {
  auth?: {
    admin?: {
      listUsers?: (opts: { page?: number; perPage?: number }) => Promise<{
        data?: { users?: AuthUserRow[] };
      }>;
      getUserById?: (id: string) => Promise<{
        data?: { user?: AuthUserRow };
        error?: { message?: string } | null;
      }>;
    };
  };
  from: (table: string) => {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[],
      ) => Promise<{ data?: Array<{ user_id: string }>; error?: { message?: string } | null }>;
    };
  };
};

export type AuthAccessStatus = {
  authFound: boolean;
  /** Uniquement auth.users.last_sign_in_at */
  lastSignInAt: string | null;
  /** false si needs_password_setup === true ; null si user Auth introuvable */
  passwordSet: boolean | null;
};

function isoOrNull(value: unknown): string | null {
  const iso = String(value ?? "").trim();
  if (!iso) return null;
  if (!Number.isFinite(Date.parse(iso))) return null;
  return iso;
}

function statusFromAuthUser(user: AuthUserRow | null | undefined): AuthAccessStatus {
  if (!user?.id) {
    return { authFound: false, lastSignInAt: null, passwordSet: null };
  }
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    authFound: true,
    lastSignInAt: isoOrNull(user.last_sign_in_at),
    passwordSet: meta.needs_password_setup !== true,
  };
}

/** Statut d'accès Auth pour une liste d'utilisateurs (batch getUserById). */
export async function fetchAuthAccessStatusForUserIds(
  supabase: SupabaseAdminClient,
  userIds: string[],
): Promise<Map<string, AuthAccessStatus>> {
  const map = new Map<string, AuthAccessStatus>();
  if (userIds.length === 0) return map;

  const getUserById = supabase.auth?.admin?.getUserById;
  if (!getUserById) return map;

  const batchSize = 20;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const { data, error } = await getUserById(id);
          if (error) {
            console.error("[fetchAuthAccessStatusForUserIds] getUserById", id, error.message ?? error);
            return { id, status: statusFromAuthUser(null) };
          }
          return { id, status: statusFromAuthUser(data?.user) };
        } catch (err) {
          console.error("[fetchAuthAccessStatusForUserIds] getUserById threw", id, err);
          return { id, status: statusFromAuthUser(null) };
        }
      }),
    );
    for (const row of results) {
      map.set(row.id, row.status);
    }
  }

  return map;
}

/** Dernière connexion Auth (last_sign_in_at uniquement). */
export async function fetchLastSignInForUserIds(
  supabase: SupabaseAdminClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const statuses = await fetchAuthAccessStatusForUserIds(supabase, userIds);
  const map = new Map<string, string>();
  for (const [id, status] of statuses) {
    if (status.lastSignInAt) map.set(id, status.lastSignInAt);
  }
  return map;
}

/** Dernière connexion pour tous les utilisateurs (pagination auth.admin.listUsers). */
export async function fetchLastSignInMap(
  supabase: SupabaseAdminClient,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const listUsers = supabase.auth?.admin?.listUsers;
  if (!listUsers) return map;

  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 20; i += 1) {
    const { data } = await listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      const at = isoOrNull(u.last_sign_in_at);
      if (at) map.set(u.id, at);
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return map;
}

/** Nombre de tests / quiz complétés par utilisateur. */
export async function fetchTestCountForUserIds(
  supabase: SupabaseAdminClient,
  userIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (userIds.length === 0) return map;

  const [testRes, mentalRes] = await Promise.all([
    supabase.from("test_attempts").select("user_id").in("user_id", userIds),
    supabase.from("mental_health_assessments").select("user_id").in("user_id", userIds),
  ]);

  if (testRes.error) {
    console.error("[fetchTestCountForUserIds] test_attempts:", testRes.error.message);
  }
  if (mentalRes.error) {
    console.error("[fetchTestCountForUserIds] mental_health_assessments:", mentalRes.error.message);
  }

  const testAttempts = testRes.data ?? [];
  const mentalHealthAssessments = mentalRes.data ?? [];

  for (const row of testAttempts ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
  }
  for (const row of mentalHealthAssessments ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
  }

  return map;
}

/** Dernière connexion d'un seul utilisateur. */
export async function fetchLastSignInForUser(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<string | null> {
  const map = await fetchLastSignInForUserIds(supabase, [userId]);
  return map.get(userId) ?? null;
}
