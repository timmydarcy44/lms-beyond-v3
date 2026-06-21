import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const service = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await service
  .from("profiles")
  .select("id, email, role_type, role, school_id, entreprise_id, onboarding_completed")
  .or("role_type.eq.particulier,role.eq.particulier,role_type.eq.learner")
  .limit(20);

if (error) {
  console.error(error);
  process.exit(1);
}

const filtered = (data ?? []).filter((p) => !p.school_id && !p.entreprise_id);
console.log(JSON.stringify(filtered, null, 2));
