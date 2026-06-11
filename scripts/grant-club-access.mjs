/**
 * Accorde l'accès dashboard club à un utilisateur (role_type = club).
 * Usage: node scripts/grant-club-access.mjs [email]
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? "timmydarcy44@gmail.com").trim().toLowerCase();

const envPath = new URL("../.env.local", import.meta.url);
const env = fs.readFileSync(envPath, "utf8");
const url = env.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: profile, error: findError } = await sb
    .from("profiles")
    .select("id, email, role, role_type")
    .eq("email", email)
    .maybeSingle();

  if (findError) throw findError;
  if (!profile?.id) {
    throw new Error(`Profil introuvable pour ${email}`);
  }

  const { data: updated, error: updateError } = await sb
    .from("profiles")
    .update({ role: "club", role_type: "club" })
    .eq("id", profile.id)
    .select("id, email, role, role_type")
    .single();

  if (updateError) throw updateError;

  console.log("Accès club accordé :");
  console.log(updated);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
