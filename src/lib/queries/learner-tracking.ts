"use server";

type SupabaseAdminClient = {
  auth?: {
    admin?: {
      listUsers?: (opts: { page?: number; perPage?: number }) => Promise<{
        data?: { users?: Array<{ id: string; last_sign_in_at?: string | null }> };
      }>;
      getUserById?: (id: string) => Promise<{
        data?: { user?: { id: string; last_sign_in_at?: string | null } };
        error?: unknown;
      }>;
    };
  };
  from: (table: string) => {
    select: (columns: string) => {
      in: (column: string, values: string[]) => Promise<{ data?: Array<{ user_id: string }> }>;
    };
  };
};

/** Dernière connexion pour une liste d'utilisateurs (auth.admin.getUserById). */
export async function fetchLastSignInForUserIds(
  supabase: SupabaseAdminClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
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
          if (error || !data?.user?.last_sign_in_at) return null;
          return { id, lastSignInAt: data.user.last_sign_in_at };
        } catch {
          return null;
        }
      }),
    );
    for (const row of results) {
      if (row?.lastSignInAt) map.set(row.id, row.lastSignInAt);
    }
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
      if (u.last_sign_in_at) map.set(u.id, u.last_sign_in_at);
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
