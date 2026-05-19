import { notFound } from "next/navigation";
import Link from "next/link";

import { getServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";

const DEFAULT_INSTRUCTOR_AVATAR = "/fallback.svg";

type CourseRow = Record<string, unknown> & {
  id: string;
  cover_image?: string | null;
  builder_snapshot?: unknown;
};

type InstructorProfile = Record<string, unknown> & {
  id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  professional_title?: string | null;
  headline?: string | null;
};

type CatalogSnapshot = {
  general?: { objectifs?: unknown; instructor_ids?: unknown };
} | null;

function parseCatalogSnapshot(builderSnapshot: unknown): CatalogSnapshot {
  if (builderSnapshot == null) return null;
  if (typeof builderSnapshot === "object" && !Array.isArray(builderSnapshot)) {
    return builderSnapshot as CatalogSnapshot;
  }
  if (typeof builderSnapshot === "string") {
    try {
      return JSON.parse(builderSnapshot) as CatalogSnapshot;
    } catch {
      return null;
    }
  }
  return null;
}

function firstInstructorIdFromSnapshot(snapshot: CatalogSnapshot): string | undefined {
  const raw = snapshot?.general?.instructor_ids;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const first = raw[0];
  if (first == null) return undefined;
  const id = String(first).trim();
  return id === "" ? undefined : id;
}

async function loadProfileSafe(
  supabase: NonNullable<Awaited<ReturnType<typeof getServerClient>>>,
  id: string,
): Promise<InstructorProfile | null> {
  if (!id || typeof id !== "string" || id.trim() === "") return null;
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id.trim()).maybeSingle();
    if (error || !data) return null;
    return data as InstructorProfile;
  } catch {
    return null;
  }
}

function avatarSrc(p: InstructorProfile): string {
  const a = (typeof p.avatar_url === "string" ? p.avatar_url : "").trim();
  const ph = (typeof p.photo_url === "string" ? p.photo_url : "").trim();
  return a || ph || DEFAULT_INSTRUCTOR_AVATAR;
}

export default async function FormationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await getServerClient();
  if (!supabase) notFound();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, cover_image, builder_snapshot")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (courseError || !course) notFound();

  const courseRow = course as CourseRow;

  const detail = await getLearnerContentDetail("formations", slug);
  if (!detail) notFound();
  const info = detail.detail;

  const snapshot = parseCatalogSnapshot(courseRow.builder_snapshot);
  const instructorId = firstInstructorIdFromSnapshot(snapshot);
  let instructorProfile: InstructorProfile | null = null;
  if (instructorId) {
    instructorProfile = await loadProfileSafe(supabase, instructorId);
  }

  const cover = String(courseRow.cover_image ?? "");
  const isVideo = cover.toLowerCase().endsWith(".mp4") || cover.toLowerCase().includes(".mp4");
  const playHref = `/formations/${slug}/play`;

  const displayName =
    (typeof instructorProfile?.full_name === "string" ? instructorProfile.full_name : "").trim() || "Expert";
  const titleLine =
    (typeof instructorProfile?.professional_title === "string" ? instructorProfile.professional_title : "").trim() ||
    (typeof instructorProfile?.headline === "string" ? instructorProfile.headline : "").trim();

  return (
    <LearningSessionTracker contentType="course" contentId={String(courseRow.id)} showIndicator={false}>
      <div className="min-h-screen bg-black pb-20 text-white">
        <section className="relative flex h-[60vh] items-end overflow-hidden px-8 pb-12">
          <div className="absolute inset-0 z-0">
            {isVideo ? (
              <LazyBandwidthVideo
                src={cover}
                eager
                poster={DEFAULT_INSTRUCTOR_AVATAR}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover opacity-50"
              />
            ) : cover ? (
              <img src={cover} className="h-full w-full object-cover opacity-50" alt="Hero" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          <div className="relative z-10">
            <h1 className="mb-8 text-5xl font-black uppercase tracking-tighter md:text-7xl">{info.title}</h1>
            <Button
              asChild
              className="rounded-md bg-[#E50914] px-10 py-7 text-xl font-bold text-white hover:bg-[#b20710]"
            >
              <Link href={playHref}>▶ Lancer la formation</Link>
            </Button>
          </div>
        </section>

        {instructorProfile ? (
          <div className="border-b border-white/10 px-8 py-6">
            <div className="flex max-w-5xl items-center gap-2">
              <img
                src={avatarSrc(instructorProfile)}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-bold text-white">Formation par : {displayName}</p>
                {titleLine ? <p className="text-xs text-gray-500">{titleLine}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-12 grid grid-cols-1 gap-6 px-8 md:grid-cols-2 lg:grid-cols-4">
          {info.modules?.map((module: { id: string; title: string }, idx: number) => (
            <Link
              key={module.id}
              href={playHref}
              className="group relative aspect-video overflow-hidden rounded-lg border border-white/5 bg-[#141414] transition-all hover:border-white/20"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-4 left-4 z-20">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-400 opacity-70">
                  Séquence {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-white">{module.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </LearningSessionTracker>
  );
}
