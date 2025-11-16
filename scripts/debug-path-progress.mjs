import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Supabase URL:", url);

  const { data, error } = await supabase
    .from("path_progress")
    .select("user_id, path_id, progress_percent, last_accessed_at")
    .eq("user_id", "d59c9aab-44dd-48ae-8f6d-a49a8867d003");

  if (error) {
    console.error("Error fetching path_progress", error);
  } else {
    console.log("path_progress rows:", data);
  }

  const { data: paths, error: pathsError } = await supabase
    .from("paths")
    .select("id, title, status, slug")
    .limit(10);

  if (pathsError) {
    console.error("Error fetching paths", pathsError);
  } else {
    console.log("paths sample:", paths);
  }
}

main().catch((err) => {
  console.error("Unexpected error", err);
  process.exit(1);
});
