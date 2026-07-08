import type { SupabaseClient } from "@supabase/supabase-js";

export function slugifyQuizTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "quiz"}-${Date.now()}`;
}

export async function resolveQuizAuthorOrgId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1);

  if (memberships?.[0]?.org_id) {
    return String(memberships[0].org_id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, company_id, school_id")
    .eq("id", userId)
    .maybeSingle();

  const fallbackOrg = profile?.company_id || profile?.school_id;
  if (fallbackOrg) return String(fallbackOrg);

  return null;
}

type InsertQuizTestInput = {
  title: string;
  description: string;
  questions: unknown[];
  userId: string;
  orgId?: string | null;
  evaluationType?: string;
  scoring?: Record<string, unknown> | null;
};

export async function insertQuizTestRow(
  supabase: SupabaseClient,
  input: InsertQuizTestInput,
): Promise<{ data: { id: string } | null; error: { message?: string; code?: string } | null }> {
  const slug = slugifyQuizTitle(input.title);

  let payload: Record<string, unknown> = {
    title: input.title,
    slug,
    description: input.description,
    status: "draft",
    kind: "quiz",
    questions: input.questions,
    created_by: input.userId,
    creator_id: input.userId,
    owner_id: input.userId,
    evaluation_type: input.evaluationType || "qcm",
    scoring: input.scoring ?? null,
    form_url: "",
  };

  if (input.orgId) {
    payload.org_id = input.orgId;
  }

  const optionalKeys = [
    "org_id",
    "owner_id",
    "creator_id",
    "evaluation_type",
    "scoring",
    "form_url",
    "questions",
    "kind",
    "description",
  ] as const;

  for (let attempt = 0; attempt < optionalKeys.length + 3; attempt++) {
    const { data, error } = await supabase.from("tests").insert(payload).select("id").single();

    if (!error && data?.id) {
      return { data: { id: String(data.id) }, error: null };
    }

    if (!error) {
      return { data: null, error: { message: "Test créé sans identifiant retourné" } };
    }

    const code = String(error.code ?? "");
    const message = String(error.message ?? "");

    if (code === "23502" && message.includes("form_url")) {
      payload.form_url = "";
      continue;
    }

    if (code === "42703") {
      const match = message.match(/'([^']+)' column/i) ?? message.match(/column "?(\w+)"?/i);
      const column = match?.[1];
      if (column && column in payload) {
        delete payload[column];
        continue;
      }
      for (const key of optionalKeys) {
        if (message.toLowerCase().includes(key) && key in payload) {
          delete payload[key];
          break;
        }
      }
      continue;
    }

    if (code === "23505" && message.includes("slug")) {
      payload.slug = slugifyQuizTitle(input.title);
      continue;
    }

    return { data: null, error: { message, code } };
  }

  return { data: null, error: { message: "Impossible de créer le test après plusieurs tentatives" } };
}
