import { getServiceRoleClient } from "@/lib/supabase/server";

/** Preuve « validée par le tuteur » sur la compétence liée. Ne délivre pas de badge. */
export async function recordTutorValidatedProof(learnerId: string, label: string, note: string) {
  const name = label.trim();
  if (!name) return;
  const service = getServiceRoleClient();
  if (!service) return;

  const { data } = await service
    .from("profiles")
    .select("hard_skills, skills_metadata")
    .eq("id", learnerId)
    .maybeSingle();

  const skills = Array.isArray(data?.hard_skills) ? data.hard_skills.map((item) => String(item)) : [];
  const meta =
    data?.skills_metadata && typeof data.skills_metadata === "object"
      ? { ...(data.skills_metadata as Record<string, unknown>) }
      : {};
  if (!skills.includes(name)) skills.push(name);
  const previous = meta[name] && typeof meta[name] === "object" ? (meta[name] as Record<string, unknown>) : {};
  meta[name] = {
    ...previous,
    category: previous.category ?? "Alternance",
    proofLevel: "justified",
    source: previous.source ?? "manual",
    proof: { type: "other", note },
  };

  await service.from("profiles").update({ hard_skills: skills, skills_metadata: meta }).eq("id", learnerId);
}
