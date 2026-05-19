"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { OpenCourseButton } from "@/app/dashboard/formateur/formations/open-course-button";

type Kpis = {
  totalCourses: number;
  publishedCourses: number;
  totalLearners: number;
};

type PublishedCourseCard = {
  id: string;
  title: string;
  image: string;
  updatedAt: string;
  kind: "course" | "path";
};

function isVideoUrl(url: string): boolean {
  const u = String(url ?? "").trim().toLowerCase();
  if (!u) return false;
  try {
    const p = new URL(u).pathname.toLowerCase();
    return p.endsWith(".mp4") || p.endsWith(".webm");
  } catch {
    return u.endsWith(".mp4") || u.endsWith(".webm");
  }
}

export default function FormateurDashboardPage() {
  const [kpis, setKpis] = useState<Kpis>({
    totalCourses: 0,
    publishedCourses: 0,
    totalLearners: 0,
  });
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState<PublishedCourseCard[]>([]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          if (!ignore) {
            setKpis({ totalCourses: 0, publishedCourses: 0, totalLearners: 0 });
            setPublished([]);
          }
          return;
        }

        const [coursesRes, pathsRes] = await Promise.all([
          fetch("/api/formateur/courses", { credentials: "include" }),
          fetch("/api/formateur/paths", { credentials: "include" }),
        ]);
        const coursesPayload = coursesRes.ok ? await coursesRes.json().catch(() => null) : null;
        const pathsPayload = pathsRes.ok ? await pathsRes.json().catch(() => null) : null;
        const courses = Array.isArray(coursesPayload?.courses) ? coursesPayload.courses : [];
        const paths = Array.isArray(pathsPayload?.paths) ? pathsPayload.paths : [];

        if (!coursesRes.ok) {
          console.warn("[formateur/dashboard] courses API failed", coursesRes.status);
        }
        if (!pathsRes.ok) {
          console.warn("[formateur/dashboard] paths API failed", pathsRes.status);
        }

        const moduleCourseIds = courses.map((c: any) => String(c?.id ?? "")).filter((x: string) => x.length > 0);
        const pathIds = paths.map((p: any) => String(p?.id ?? "")).filter((x: string) => x.length > 0);
        const allFormationIds = new Set([...moduleCourseIds, ...pathIds]);

        const publishedCoursesCount = courses.filter(
          (c: any) => String(c?.status ?? "").toLowerCase() === "published",
        ).length;
        const publishedPathsCount = paths.filter(
          (p: any) => String(p?.status ?? "").toLowerCase() === "published",
        ).length;

        const publishedCourses = courses
          .filter((c: any) => String(c?.status ?? "").toLowerCase() === "published")
          .sort((a: any, b: any) => {
            const ta = String(a?.updated_at ?? a?.created_at ?? "");
            const tb = String(b?.updated_at ?? b?.created_at ?? "");
            return tb.localeCompare(ta);
          });

        const publishedPaths = paths
          .filter((p: any) => String(p?.status ?? "").toLowerCase() === "published")
          .sort((a: any, b: any) => {
            const ta = String(a?.updatedAt ?? a?.updated_at ?? "");
            const tb = String(b?.updatedAt ?? b?.updated_at ?? "");
            return tb.localeCompare(ta);
          });

        const pickImage = (row: any): string => {
          const snap = row?.builder_snapshot;
          const fromSnapshot =
            (typeof snap?.general?.cover_image === "string" && snap.general.cover_image.trim()
              ? snap.general.cover_image.trim()
              : "") ||
            (typeof snap?.general?.heroImage === "string" && snap.general.heroImage.trim()
              ? snap.general.heroImage.trim()
              : "") ||
            "";
          return (
            fromSnapshot ||
            row?.cover_image ||
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
          );
        };

        const pickPathImage = (row: any): string => {
          const h = String(row?.heroUrl ?? row?.thumbnailUrl ?? "").trim();
          return h || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";
        };

        const learnerIds = new Set<string>();
        const validModuleIds = moduleCourseIds.filter((id) => !!id);
        if (validModuleIds.length > 0) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from("enrollments")
            .select("user_id")
            .in("course_id", validModuleIds);

          if (enrollmentsError) {
            console.warn("[formateur/dashboard] enrollments fetch failed", enrollmentsError);
          } else {
            (enrollments ?? []).forEach((e: any) => {
              const u = String(e.user_id ?? "").trim();
              if (u) learnerIds.add(u);
            });
          }
        }

        const validPathIds = pathIds.filter((id) => !!id);
        if (validPathIds.length > 0) {
          const { data: pe, error: peErr } = await supabase
            .from("path_enrollments")
            .select("user_id")
            .in("path_id", validPathIds);
          if (peErr) {
            console.warn("[formateur/dashboard] path_enrollments fetch failed", peErr);
          } else {
            (pe ?? []).forEach((e: any) => {
              const u = String(e.user_id ?? "").trim();
              if (u) learnerIds.add(u);
            });
          }
        }

        const totalLearners = learnerIds.size;

        const publishedMerged: PublishedCourseCard[] = [
          ...publishedPaths.map((p: any) => ({
            id: String(p.id),
            title: p.title || "Parcours",
            image: pickPathImage(p),
            updatedAt: p.updatedAt || p.updated_at || new Date().toISOString(),
            kind: "path" as const,
          })),
          ...publishedCourses.map((c: any) => ({
            id: String(c.id),
            title: c.title || "Formation",
            image: pickImage(c),
            updatedAt: c.updated_at || c.created_at || new Date().toISOString(),
            kind: "course" as const,
          })),
        ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        if (!ignore) {
          setKpis({
            totalCourses: allFormationIds.size,
            publishedCourses: publishedCoursesCount + publishedPathsCount,
            totalLearners,
          });
          setPublished(publishedMerged);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  const statTiles = useMemo(
    () => [
      { label: "Formations", value: kpis.totalCourses, sub: "créées" },
      { label: "Publiées", value: kpis.publishedCourses, sub: "en ligne" },
      { label: "Apprenants", value: kpis.totalLearners, sub: "uniques" },
    ],
    [kpis.publishedCourses, kpis.totalCourses, kpis.totalLearners],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FormateurSidebar activeItem="Accueil" />

      <main
        className="min-h-screen ml-[236px] px-8 py-10"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(0, 150, 255, 0.05) 0%, rgba(0, 0, 0, 1) 70%)",
        }}
      >
        <section className="relative min-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end gap-6 pb-12 pl-6 pr-8 md:pb-16 md:pl-8 md:pr-12">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/80">
              ESPACE FORMATEUR
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-[0.3em] text-red-200">
                PREMIUM
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
              Pilotez vos formations,
              <br />
              suivez vos cohortes et boostez
              <br />
              l&apos;engagement de vos apprenants.
            </h1>
            <p className="text-lg text-white/80">Une expérience immersive, pensée pour l&apos;action.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-semibold text-white">
                Inviter un apprenant
              </button>
              <button className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-semibold text-white">
                Exporter le reporting
              </button>
              <button className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white/80">
                Planifier une session
              </button>
            </div>
            <div className="absolute right-12 top-1/2 w-72 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Prochaines étapes
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="font-medium text-white">Finaliser votre prochaine cohorte</p>
                  <p className="text-xs text-white/60">3 sections à confirmer</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="font-medium text-white">Partager la masterclass engageante</p>
                  <p className="text-xs text-white/60">Embed recommandée pour vos mentors</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {statTiles.map((tile) => (
              <div
                key={tile.label}
                className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  {tile.label}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-white">
                    {loading ? "…" : tile.value}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    {tile.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">Vos formations en ligne</h2>
              <Link className="text-xs font-semibold text-slate-400 hover:text-white" href="/dashboard/formateur/formations">
                Voir tout
              </Link>
            </div>
            {published.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 text-sm text-white/70">
                {loading ? "Chargement…" : "Aucune formation publiée pour le moment."}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {published.map((course) => (
                  <div
                    key={`${course.kind}-${course.id}`}
                    className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d]"
                  >
                    <div className="aspect-video overflow-hidden bg-black/30">
                      {isVideoUrl(course.image) ? (
                        <video
                          src={course.image}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={course.image}
                          alt={course.title}
                          className="h-full w-full object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{course.title}</p>
                          <p className="text-xs text-white/50">Publié</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.kind === "path" ? (
                          <a
                            className="rounded-full bg-[#0A84FF] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                            href={`/dashboard/formateur/parcours/${course.id}/edit`}
                          >
                            Ouvrir
                          </a>
                        ) : (
                          <OpenCourseButton courseId={course.id} />
                        )}
                        <a
                          className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                          href={
                            course.kind === "path"
                              ? `/dashboard/formateur/parcours/${course.id}`
                              : `/dashboard/formateur/formations/${course.id}/preview`
                          }
                        >
                          Prévisualiser
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">Formations en cours</h2>
                <Link className="text-xs font-semibold text-slate-400 hover:text-white" href="/dashboard/formateur/formations">
                  Voir tout
                </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 text-sm text-white/70">
              Accès rapide au catalogue formateur :{" "}
              <Link className="text-white underline" href="/dashboard/formateur/formations">
                voir mes formations
              </Link>
              .
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


