/**
 * Crée un compte avec accès exclusif au dashboard club.
 * Usage: node scripts/create-club-account.mjs [email] [password]
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? "mos2026@gmail.com").trim().toLowerCase();
const password = process.argv[3] ?? "MOS2026";

const envPath = new URL("../.env.local", import.meta.url);
const env = fs.readFileSync(envPath, "utf8");
const url = env.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: existing } = await sb.from("profiles").select("id, email").eq("email", email).maybeSingle();

  let userId = existing?.id ?? null;

  if (userId) {
    await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log(`Compte existant mis à jour: ${email}`);
  } else {
    const { data: created, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "MOS 2026", first_name: "MOS" },
    });
    if (error) throw error;
    userId = created.user.id;
    console.log(`Compte créé: ${email} (${userId})`);
  }

  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        role: "club",
        role_type: "club",
        first_name: "MOS",
        last_name: "2026",
        full_name: "MOS 2026",
        company_id: null,
        school_id: null,
      },
      { onConflict: "id" },
    )
    .select("id, email, role, role_type")
    .single();

  if (profileError) throw profileError;
  console.log("Profil club configuré:", profile);
  console.log(`Connexion: ${email} / ${password}`);
  console.log("URL: https://beyondcenter.fr/dashboard/club");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
