import { notFound } from "next/navigation";

import { FormationDetailView, type Episode } from "@/app/catalog/formations/[slug]/view";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";
import { getEdgeOnlineCourseDetailBySlug } from "@/lib/queries/edge-online-course-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EdgeOnlineFormationDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(String(rawSlug ?? "")).trim();
  const edgeOnlineHrefPrefix = await getEdgeOnlineHrefPrefixServer();

  console.log("[edgeonline] page detail", slug);

  if (!slug) notFound();

  const loaded = await getEdgeOnlineCourseDetailBySlug(slug);
  if (!loaded) notFound();

  const { card: rawCard, detail: info } = loaded;
  const formationBaseHref = edgeOnlinePublicHref(
    `/formations/${encodeURIComponent(slug)}`,
    edgeOnlineHrefPrefix,
  );
  const card = { ...rawCard, href: formationBaseHref };
  const lessons = (info.modules ?? []).flatMap(
    (module: { lessons?: Array<{ id: string }> }) => module.lessons ?? [],
  );
  const firstLesson = lessons[0];
  const playHref = firstLesson?.id
    ? `${formationBaseHref}/play/${firstLesson.id}`
    : formationBaseHref;

  const breadcrumbs = [
    { label: "Formations", href: edgeOnlinePublicHref("/", edgeOnlineHrefPrefix) },
    { label: "Formation" },
    { label: info.title },
  ];

  const episodes: Episode[] = [];
  let episodeIndex = 1;
  for (const module of info.modules ?? []) {
    for (const lesson of (module.lessons ?? []) as Array<{
      id: string;
      title: string;
      summary?: string;
      description?: string;
      imageUrl?: string;
      thumbnailUrl?: string;
      videoUrl?: string;
      mediaUrl?: string;
      progress?: number | null;
      durationLabel?: string;
      locked?: boolean;
      isLocked?: boolean;
    }>) {
      episodes.push({
        id: lesson.id,
        index: episodeIndex,
        title: lesson.title,
        description: lesson.summary ?? lesson.description ?? undefined,
        imageUrl: lesson.imageUrl ?? lesson.thumbnailUrl ?? info.backgroundImage ?? undefined,
        videoUrl: lesson.videoUrl ?? lesson.mediaUrl ?? undefined,
        href: `${formationBaseHref}/play/${lesson.id}`,
        progress: lesson.progress ?? null,
        durationLabel: typeof lesson.durationLabel === "string" ? lesson.durationLabel : null,
        locked: Boolean(lesson.locked ?? lesson.isLocked),
      });
      episodeIndex += 1;
    }
  }

  return (
    <LearningSessionTracker contentType="course" contentId={card.id}>
      <div className="m-0 ml-0 min-h-screen w-full max-w-none bg-black p-0 pl-0 text-white">
        <DashboardShell
          title={info.title}
          breadcrumbs={breadcrumbs}
          forcedTheme="dark"
          className="bg-black text-white"
          hideSidebar
          mainClassName="!m-0 !ml-0 !mt-0 !p-0 !px-0 !pl-0 !pt-0 w-full max-w-none"
        >
          <FormationDetailView
            card={card}
            info={info}
            related={[]}
            playHref={playHref}
            episodes={episodes}
            breadcrumbs={breadcrumbs}
            orgSlug="edgelab"
          />
        </DashboardShell>
      </div>
    </LearningSessionTracker>
  );
}
