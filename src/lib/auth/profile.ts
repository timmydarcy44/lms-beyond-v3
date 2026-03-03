import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export type ProfileWithAccess = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  role_type: string | null;
  school_id: string | null;
  access_lms: boolean | null;
  access_connect: boolean | null;
  access_care: boolean | null;
};

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const PROFILE_SELECT =
  "id, email, full_name, avatar_url, role, role_type, school_id, access_lms, access_connect, access_care";

const pickProfileByEmail = (rows: ProfileWithAccess[] | null, userId: string) => {
  if (!rows || rows.length === 0) return null;
  const exact = rows.find((row) => String(row.id ?? "") === userId);
  return exact ?? rows[0] ?? null;
};

const queryProfileById = async (client: Awaited<ReturnType<typeof getServerClient>>, userId: string) => {
  if (!client) return null;
  const { data } = await client
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileWithAccess | null) ?? null;
};

const queryProfilesByEmail = async (
  client: Awaited<ReturnType<typeof getServerClient>>,
  email: string,
  userId: string,
) => {
  if (!client) return null;
  const { data } = await client
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(10);
  return pickProfileByEmail((data as ProfileWithAccess[] | null) ?? null, userId);
};

const bootstrapMissingProfile = async (user: AuthUser) => {
  const service = getServiceRoleClient();
  if (!service) return;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (typeof metadata.full_name === "string" ? metadata.full_name.trim() : "") || user.email || null;
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : null;
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : null;
  const roleType =
    (typeof metadata.role_type === "string" ? metadata.role_type.trim() : "") || "particulier";
  await service.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role_type: roleType,
    },
    { onConflict: "id" },
  );
};

export async function getCurrentProfileWithAccess() {
  const supabase = await getServerClient();
  if (!supabase) return { user: null, profile: null as ProfileWithAccess | null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { user: null, profile: null as ProfileWithAccess | null };

  let profile = await queryProfileById(supabase, user.id);
  const emailValue = String(user.email ?? "").trim();

  if (!profile && emailValue) {
    profile = await queryProfilesByEmail(supabase, emailValue, user.id);
  }

  if (!profile) {
    const service = getServiceRoleClient();
    if (service) {
      const { data: byId } = await service
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();
      profile = (byId as ProfileWithAccess | null) ?? null;
      if (!profile && emailValue) {
        const { data: byEmail } = await service
          .from("profiles")
          .select(PROFILE_SELECT)
          .eq("email", emailValue)
          .order("updated_at", { ascending: false })
          .limit(10);
        profile = pickProfileByEmail((byEmail as ProfileWithAccess[] | null) ?? null, user.id);
      }
    }
  }

  // Ensure every authenticated account has a profile row keyed by auth user id.
  if (!profile) {
    await bootstrapMissingProfile({
      id: user.id,
      email: user.email,
      user_metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
    });
    profile = await queryProfileById(supabase, user.id);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      user_metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
    },
    profile,
  };
}

