import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import type { User } from "@supabase/supabase-js";

export async function assertJessicaAdmin(): Promise<User | null> {
  if (!(await isSuperAdmin())) return null;
  const auth = await getServerClient();
  if (!auth) return null;
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user || user.email !== JESSICA_CONTENTIN_EMAIL) return null;
  return user;
}
