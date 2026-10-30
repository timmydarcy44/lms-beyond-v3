import type { SupabaseClient } from "@supabase/supabase-js";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { loadOfferCompatibility } from "@/lib/offres/compatibility";
import { listPublicOffers } from "@/lib/offres/public-offers";
import { isCompleteSoftSkillsScores, fetchLatestSoftSkillsResult } from "@/lib/soft-skills/resolve-soft-skills-result";

export type HomeApplication = {
  id: string;
  slug: string;
  title: string;
  city: string;
  sector: string;
  cursus: string;
  closed: boolean;
  status: "draft" | "submitted";
  submittedAt: string | null;
  stage: "new" | "interview" | "retained" | "rejected";
  phone: string;
  place: string;
  cvName: string;
  pitch: string;
  profileDone: boolean;
  tests: { soft: boolean; disc: boolean; idmc: boolean };
  compatibility: { matched: number | null; total: number; revealed: boolean };
  share: { soft: boolean; disc: boolean; idmc: boolean };
  others: { id: string; title: string; city: string }[];
  similar: { slug: string; title: string; sector: string; city: string; cursus: string }[];
  resumeToken: string | null;
  firstName: string;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function loadHomeApplication(db: SupabaseClient, userId: string): Promise<HomeApplication | null> {
  const rich = await db
    .from("applications")
    .select("id, job_id, status, stage, created_at, submitted_at, phone, city, cv_path, pitch, share_soft, share_disc, share_idmc")
    .eq("talent_id", userId)
    .in("status", ["draft", "submitted"])
    .order("created_at", { ascending: false });
  const rows = rich.error
    ? await db.from("applications").select("id, job_id, status, stage, created_at").eq("talent_id", userId).in("status", ["draft", "submitted"]).order("created_at", { ascending: false })
    : rich;
  const list = (rows.data ?? []) as Array<Record<string, unknown>>;
  const current = list[0];
  if (!current) return null;

  const offer = await db
    .from("job_offers")
    .select("id, title, city, status, public_slug, public_status, diploma_prepared, school_id")
    .eq("id", text(current.job_id))
    .maybeSingle();
  const job = offer.data as Record<string, unknown> | null;
  if (!job) return null;

  const profile = await db.from("profiles").select("first_name, phone, telephone, city, cv_url, cv_file_name").eq("id", userId).maybeSingle();
  const person = (profile.data ?? {}) as Record<string, unknown>;
  const phone = text(current.phone) || text(person.phone) || text(person.telephone);
  const place = text(current.city) || text(person.city);
  const cvPath = text(current.cv_path) || text(person.cv_url);
  const profileDone = phone.replace(/\D/g, "").length >= 8 && place.length >= 2;

  const [soft, disc, idmc] = await Promise.all([
    fetchLatestSoftSkillsResult(db, userId, "scores"),
    db.from("disc_resultats").select("profile_id").eq("profile_id", userId).maybeSingle(),
    db.from("idmc_resultats").select("profile_id").eq("profile_id", userId).maybeSingle(),
  ]);
  const tests = {
    soft: isCompleteSoftSkillsScores(soft?.scores),
    disc: Boolean(disc.data),
    idmc: Boolean(idmc.data),
  };
  const slug = text(job.public_slug);
  const compatibility = slug ? await loadOfferCompatibility(db, slug, userId) : { matched: null, total: 0, revealed: false, skills: [] };
  const diploma = text(job.diploma_prepared).toLowerCase();
  const alias = diploma ? await db.from("cursus_aliases").select("cursus_id").eq("alias", diploma).maybeSingle() : { data: null };
  const cursusId = text((alias.data as { cursus_id?: string } | null)?.cursus_id);
  const cursus = cursusId ? getCfaSpecializationLabel(cursusId) : text(job.diploma_prepared);
  const closed = text(job.status) !== "active" || text(job.public_status) === "blocked";
  const stageValue = text(current.stage);
  const stage = stageValue === "interview" || stageValue === "retained" || stageValue === "rejected" ? stageValue : "new";
  const status = text(current.status) === "submitted" ? "submitted" : "draft";

  let resumeToken: string | null = null;
  if (status === "submitted" && cursusId) {
    const cfa = await db.from("cfa_applications").select("resume_token").eq("profile_id", userId).neq("status", "rejected").order("created_at", { ascending: false }).limit(1).maybeSingle();
    resumeToken = text((cfa.data as { resume_token?: string } | null)?.resume_token) || null;
  }

  const publicOffers = status === "submitted" || closed ? await listPublicOffers(db) : [];
  const similar = publicOffers
    .filter((item) => item.slug !== slug && (!cursus || item.cursus === cursus))
    .slice(0, 2)
    .map((item) => ({ slug: item.slug, title: item.title, sector: item.sector, city: item.city, cursus: item.cursus }));

  const others = await Promise.all(
    list.slice(1, 4).map(async (item) => {
      const linked = await db.from("job_offers").select("title, city").eq("id", text(item.job_id)).maybeSingle();
      const data = linked.data as { title?: string | null; city?: string | null } | null;
      return { id: text(item.id), title: text(data?.title) || "Offre", city: text(data?.city) };
    }),
  );

  return {
    id: text(current.id),
    slug,
    title: text(job.title) || "Offre",
    city: text(job.city),
    sector: "",
    cursus,
    closed,
    status,
    submittedAt: text(current.submitted_at) || null,
    stage,
    phone,
    place,
    cvName: text(person.cv_file_name) || (cvPath ? "CV déposé" : ""),
    pitch: text(current.pitch),
    profileDone,
    tests,
    compatibility: { matched: compatibility.matched, total: compatibility.total, revealed: compatibility.revealed },
    share: {
      soft: current.share_soft !== false,
      disc: current.share_disc !== false,
      idmc: current.share_idmc === true,
    },
    others: others.filter((item) => item.title),
    similar,
    resumeToken,
    firstName: text(person.first_name),
  };
}

export async function testsComplete(db: SupabaseClient, userId: string) {
  const [soft, disc, idmc] = await Promise.all([
    fetchLatestSoftSkillsResult(db, userId, "scores"),
    db.from("disc_resultats").select("profile_id").eq("profile_id", userId).maybeSingle(),
    db.from("idmc_resultats").select("profile_id").eq("profile_id", userId).maybeSingle(),
  ]);
  return {
    soft: isCompleteSoftSkillsScores(soft?.scores),
    disc: Boolean(disc.data),
    idmc: Boolean(idmc.data),
  };
}
