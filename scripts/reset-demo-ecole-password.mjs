/**
 * Réinitialise le mot de passe Supabase Auth pour demo@ecole.fr via l’API Admin (hash correct pour GoTrue).
 *
 * Usage (à la racine du repo) :
 *   node scripts/reset-demo-ecole-password.mjs "VotreMotDePasse"
 *
 * Prérequis dans .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const password = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!password || String(password).length < 6) {
  console.error('Usage: node scripts/reset-demo-ecole-password.mjs "MotDePasseAuMoins6Caracteres"');
  process.exit(1);
}
if (!url || !key) {
  console.error("Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
if (error) {
  console.error("listUsers:", error.message);
  process.exit(1);
}

const user = data.users.find((u) => (u.email ?? "").toLowerCase().trim() === "demo@ecole.fr");
if (!user) {
  console.error("Aucun utilisateur auth avec l’e-mail demo@ecole.fr.");
  process.exit(1);
}

const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
  password: String(password),
  email_confirm: true,
});

if (upErr) {
  console.error("updateUserById:", upErr.message);
  process.exit(1);
}

console.log("OK — mot de passe mis à jour pour demo@ecole.fr (id:", user.id + ").");
