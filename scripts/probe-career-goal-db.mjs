import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log("Supabase URL:", url);

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const service = createClient(url, key, { auth: { persistSession: false } });

const PAUL = "23251989-2c4b-44d6-9616-e7f11078374a";

const { data: paul, error: paulErr } = await service
  .from("profiles")
  .select("id, email, role_type, role, school_id, entreprise_id")
  .eq("id", PAUL)
  .maybeSingle();

console.log("Paul:", paul, paulErr?.message);

const { data: cols, error: colErr } = await service.rpc("to_regclass", { name: "profiles" }).maybeSingle?.();
// fallback: try career_goal select
const { error: cgErr } = await service.from("profiles").select("career_goal").limit(1);
console.log("career_goal column:", cgErr ? cgErr.message : "exists");

const { data: parts, error: pErr } = await service
  .from("profiles")
  .select("id, email, role_type, role, school_id, entreprise_id")
  .eq("role_type", "particulier")
  .limit(10);

console.log("particuliers sample:", parts, pErr?.message);
