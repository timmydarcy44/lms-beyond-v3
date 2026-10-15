"use server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { JADE_DEMO_EMAIL } from "@/lib/demo/jade-account";
import { JADE_DEMO_PASSWORD } from "@/lib/demo/jade-password";
import { resolveAuthUserIdByEmail } from "@/lib/expert/resolve-auth-user";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function ensureJadeDemoAccount(): Promise<{ ok: boolean; message: string }> {
  const allowed = await isSuperAdmin();
  if (!allowed) return { ok: false, message: "Accès réservé au super admin." };

  const client = getServiceRoleClient();
  if (!client) return { ok: false, message: "Client service indisponible." };

  const profilePayload = {
    email: JADE_DEMO_EMAIL,
    first_name: "Jade",
    last_name: "Martin",
    full_name: "Jade Martin",
    role: "demo",
  };

  const { data: existingProfile } = await client.from("profiles").select("id").ilike("email", JADE_DEMO_EMAIL).maybeSingle();
  let userId = existingProfile?.id ?? (await resolveAuthUserIdByEmail(client, JADE_DEMO_EMAIL));

  if (!userId) {
    const { data: created, error: createError } = await client.auth.admin.createUser({
      email: JADE_DEMO_EMAIL,
      password: JADE_DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Jade Martin", first_name: "Jade", last_name: "Martin", needs_password_setup: false, signup_source: "jade_demo", role: "demo" },
    });
    if (createError || !created.user) return { ok: false, message: createError?.message || "Création impossible." };
    userId = created.user.id;
  } else {
    const { error } = await client.auth.admin.updateUserById(userId, {
      password: JADE_DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Jade Martin", needs_password_setup: false, signup_source: "jade_demo" },
    });
    if (error) return { ok: false, message: error.message };
  }

  const { error: profileError } = await client.from("profiles").upsert({ id: userId, ...profilePayload }, { onConflict: "id" });
  if (profileError) return { ok: false, message: profileError.message };
  return { ok: true, message: existingProfile?.id ? "Le compte démo est prêt." : "Le compte démo a été créé." };
}
