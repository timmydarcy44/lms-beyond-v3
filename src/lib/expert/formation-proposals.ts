import { getSession } from "@/lib/auth/session";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { missingRelation } from "@/lib/expert/care-auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const FORMATION_PROPOSAL_SQL_HINT =
  "Collez supabase/migrations/20261030123000_expert_formation_proposals.sql puis 20261103180000_expert_formation_proposal_details.sql dans le SQL Editor Supabase.";

export type FormationProposalStatus = "pending" | "approved" | "rejected";

export type FormationProposal = {
  id: string;
  expertId: string;
  expertName: string;
  title: string;
  presentation: string;
  objectives: string;
  prerequisites: string;
  audience: string;
  content: string;
  priceEur: number | null;
  formats: string[];
  status: FormationProposalStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const STATUSES = new Set<FormationProposalStatus>(["pending", "approved", "rejected"]);

function asStatus(value: unknown): FormationProposalStatus {
  const status = String(value ?? "pending");
  return STATUSES.has(status as FormationProposalStatus) ? (status as FormationProposalStatus) : "pending";
}

function mapRow(row: Record<string, unknown>, expertName = ""): FormationProposal {
  return {
    id: String(row.id),
    expertId: String(row.expert_id),
    expertName,
    title: String(row.title ?? ""),
    presentation: String(row.presentation ?? ""),
    objectives: String(row.objectives ?? ""),
    prerequisites: String(row.prerequisites ?? ""),
    audience: String(row.audience ?? ""),
    content: String(row.content ?? ""),
    priceEur:
      row.price_eur == null || row.price_eur === ""
        ? null
        : Number.isFinite(Number(row.price_eur))
          ? Number(row.price_eur)
          : null,
    formats: Array.isArray(row.formats) ? row.formats.map((item) => String(item)) : [],
    status: asStatus(row.status),
    reviewNote: row.review_note ? String(row.review_note) : null,
    createdAt: String(row.created_at ?? ""),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
  };
}

const EXPERT_WRITER_SELECT = "id, first_name, last_name";

async function expertByEmail(
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  email: string,
) {
  const { data } = await db
    .from("experts")
    .select(EXPERT_WRITER_SELECT)
    .ilike("email", email.trim())
    .limit(1);
  return data?.[0] ?? null;
}

export async function requireExpertWriter() {
  const session = await getSession();
  if (!session?.id) return { ok: false as const, status: 401, error: "Connexion requise" };
  const db = getServiceRoleClient();
  if (!db) return { ok: false as const, status: 503, error: "Service indisponible" };
  const lookup = await db.from("experts").select(EXPERT_WRITER_SELECT).eq("id", session.id).maybeSingle();
  if (lookup.error) return { ok: false as const, status: 503, error: "Service indisponible" };
  let expert = lookup.data;
  if (!expert && session.email) expert = await expertByEmail(db, session.email);
  if (!expert && isJadeDemoEmail(session.email)) {
    const created = await db
      .from("experts")
      .upsert(
        {
          id: session.id,
          email: "jade@byound.fr",
          first_name: "Jade",
          last_name: "Martin",
          is_active: true,
          review_status: "approved",
          registration_step: 4,
        },
        { onConflict: "id" },
      )
      .select(EXPERT_WRITER_SELECT)
      .maybeSingle();
    expert = created.data ?? (await expertByEmail(db, "jade@byound.fr"));
  }
  if (!expert) return { ok: false as const, status: 403, error: "Réservé aux experts Byound" };
  const name = [expert.first_name, expert.last_name].filter(Boolean).join(" ").trim();
  return { ok: true as const, db, expertId: String(expert.id), expertName: name || "Jade Martin" };
}

export async function listExpertFormationProposals(expertId: string): Promise<FormationProposal[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data, error } = await db
    .from("expert_formation_proposals")
    .select("*")
    .eq("expert_id", expertId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function listFormationProposalsForReview(): Promise<{ rows: FormationProposal[]; missing: boolean }> {
  const db = getServiceRoleClient();
  if (!db) return { rows: [], missing: false };
  const { data, error } = await db
    .from("expert_formation_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { rows: [], missing: missingRelation(error) };
  const expertIds = [...new Set((data ?? []).map((row) => String(row.expert_id)))];
  const names = new Map<string, string>();
  if (expertIds.length) {
    const { data: experts } = await db.from("experts").select("id, first_name, last_name").in("id", expertIds);
    for (const expert of experts ?? []) {
      names.set(String(expert.id), [expert.first_name, expert.last_name].filter(Boolean).join(" ").trim());
    }
  }
  const rows = (data ?? []).map((row) => mapRow(row as Record<string, unknown>, names.get(String(row.expert_id)) ?? ""));
  rows.sort((a, b) => {
    if (a.status === b.status) return b.createdAt.localeCompare(a.createdAt);
    if (a.status === "pending") return -1;
    if (b.status === "pending") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return { rows, missing: false };
}
