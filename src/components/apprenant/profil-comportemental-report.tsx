"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { EdgeTestsRevolutSnapshot } from "@/components/apprenant/edge-tests-revolut-snapshot";
import { useProfilEdgeHubData } from "@/hooks/use-profil-edge-hub-data";
import {
  APPRENANT_CARD_KICKER,
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
} from "@/lib/apprenant/connect-nav";
import { EDGE_APP_BY_ID } from "@/lib/apprenant/edge-apps";
import {
  buildCockpitNextAction,
  buildOnlineRecommendations,
  countInDevelopment,
  countProvedSkills,
} from "@/lib/apprenant/profil-cockpit";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CAP_IMAGE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/objectifs%20pro.png";

function CompletionRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);

  return (
    <div className="relative mx-auto h-[148px] w-[148px]">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#3D7BFF"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[2rem] font-bold tracking-[-0.04em] text-white tabular-nums">
          {clamped}
          <span className="text-[1.1rem] font-semibold text-white/55">%</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Cockpit Profil EDGE — première page après connexion.
 */
export function ProfilComportementalReport() {
  const data = useProfilEdgeHubData();
  const [nextEvent, setNextEvent] = useState<{
    title: string;
    when: string;
    trainer: string | null;
  } | null>(null);
  const [timeline, setTimeline] = useState<Array<{ date: string; label: string }>>([]);

  const pct = Math.round(data.maturity.totalPercent);
  const firstName = data.firstName;
  const proved = countProvedSkills(data.hardSkills, data.skillsMetadata);
  const inDev = countInDevelopment(data.hardSkills, data.skillsMetadata);

  const nextAction = useMemo(
    () =>
      buildCockpitNextAction({
        matching: data.matching,
        hardSkills: data.hardSkills,
        meta: data.skillsMetadata,
        hasProject: data.hasProject,
        testsDone: data.testsDone,
      }),
    [data],
  );

  const onlineRecos = useMemo(
    () =>
      buildOnlineRecommendations({
        objectiveLabel: data.objectiveLabel,
        matching: data.matching,
        softSkillsRadar: data.softSkillsRadar,
      }),
    [data],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/apprenant/planning", { credentials: "include" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          slots?: Array<{
            starts_at?: string;
            module?: { name?: string } | null;
            instructor?: { first_name?: string; last_name?: string } | null;
            notes?: string | null;
          }>;
        };
        const upcoming = (json.slots ?? [])
          .filter((e) => e.starts_at && new Date(e.starts_at).getTime() >= Date.now())
          .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())[0];
        if (!cancelled && upcoming?.starts_at) {
          const d = new Date(upcoming.starts_at);
          const trainer = [upcoming.instructor?.first_name, upcoming.instructor?.last_name]
            .filter(Boolean)
            .join(" ");
          setNextEvent({
            title: upcoming.module?.name || upcoming.notes || "Cours",
            when: d.toLocaleString("fr-FR", {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
            }),
            trainer: trainer || null,
          });
        }
      } catch {
        /* ignore */
      }

      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || cancelled) return;
      const { data: xpRows } = await supabase
        .from("edge_xp_events")
        .select("amount, created_at, reason")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(6);
      if (cancelled) return;
      setTimeline(
        (xpRows ?? []).map((row) => ({
          date: row.created_at
            ? new Date(String(row.created_at)).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })
            : "",
          label: String(row.reason || "Progression EDGE"),
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (data.loading) {
    return <p className="text-sm text-white/50">Chargement de votre cockpit EDGE…</p>;
  }

  const skillsApp = EDGE_APP_BY_ID.skills;
  const learnApp = EDGE_APP_BY_ID.learning;
  const planningApp = EDGE_APP_BY_ID.planning;
  const recrutApp = EDGE_APP_BY_ID.recrutement;

  return (
    <EdgePageAmbiance ambiance="profile">
      <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-5xl space-y-14 pb-24`}>
        {/* 1. Header */}
        <header className="space-y-3 pt-1">
          <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-white sm:text-[2.4rem]">
            Bonjour {firstName}.
          </h1>
          <p className="text-[17px] font-medium text-white/80">Voici où vous en êtes.</p>
          <p className="max-w-xl text-[14px] leading-relaxed text-white/45">
            Votre profil évolue avec vos apprentissages, vos compétences et vos expériences.
          </p>
        </header>

        {/* 2 + 3. Mon Cap + Complétion */}
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="relative min-h-[320px] overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CAP_IMAGE}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/75 to-[#05060a]/25" />
            <div className="relative flex h-full flex-col justify-end space-y-4 p-6 sm:p-8">
              <p className={APPRENANT_CARD_KICKER}>Mon cap</p>
              {data.hasProject ? (
                <>
                  <h2 className="max-w-md text-[1.65rem] font-bold tracking-[-0.03em] text-white sm:text-[1.9rem]">
                    {data.objectiveLabel}
                  </h2>
                  <p className="text-[13px] text-white/55">{pct}&nbsp;% du chemin parcouru</p>
                  <div className="h-1.5 max-w-sm overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#3D7BFF]"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  {data.matching?.develop?.length || data.matching?.consolidate?.length ? (
                    <div className="space-y-1 pt-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                        3 priorités pour progresser
                      </p>
                      <ul className="space-y-1 text-[13px] text-white/75">
                        {[
                          ...(data.matching?.develop ?? []),
                          ...(data.matching?.consolidate ?? []),
                        ]
                          .slice(0, 3)
                          .map((s) => (
                            <li key={s}>· {s}</li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                  <Link
                    href="/dashboard/apprenant"
                    className={`${CONNECT_BTN_PRIMARY} mt-2 w-fit`}
                  >
                    Voir mon plan d&apos;action
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="max-w-md text-[1.55rem] font-bold tracking-[-0.03em] text-white">
                    Définissez votre objectif professionnel
                  </h2>
                  <p className="max-w-sm text-[14px] text-white/55">
                    Votre cap oriente Skills, Learn et vos recommandations.
                  </p>
                  <Link
                    href={PROFIL_EDGE_SECTION_HREFS.projet}
                    className={`${CONNECT_BTN_PRIMARY} mt-2 w-fit`}
                  >
                    Définir mon cap
                  </Link>
                </>
              )}
            </div>
          </article>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] px-5 py-6 sm:px-6">
            <p className={APPRENANT_CARD_KICKER}>Mon profil</p>
            <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.02em] text-white">
              Taux de complétion
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">
              Identité, projet, tests, expériences et diplômes.
            </p>
            <div className="mt-5">
              <CompletionRing percent={pct} />
            </div>
            <ul className="mt-5 space-y-2">
              {data.maturity.blocks.map((block) => (
                <li key={block.id}>
                  <Link
                    href={block.href}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]"
                  >
                    <span className="flex items-center gap-2 text-[13px] text-white/70">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          block.complete
                            ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/20 text-[#9EC0FF]"
                            : "border-white/15 text-transparent",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      {block.label}
                    </span>
                    <span
                      className={cn(
                        "text-[12px] font-semibold tabular-nums",
                        block.complete ? "text-white" : "text-white/30",
                      )}
                    >
                      {block.percent}/{block.weight}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Résultats des 3 tests */}
        <section className="space-y-4">
          <div>
            <p className={APPRENANT_CARD_KICKER}>Vos explorations</p>
            <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
              Résultats des 3 tests
            </h2>
            <p className="mt-1.5 max-w-xl text-[14px] text-white/40">
              DISC, IDMC et Soft skills — la base de votre profil EDGE.
            </p>
          </div>
          <EdgeTestsRevolutSnapshot
            firstName={firstName}
            objectiveLabel={data.hasProject ? data.objectiveLabel : null}
            matching={data.matching}
            discScores={data.discScores}
            idmcAxes={data.idmcAxes}
            softSkillsRadar={data.softSkillsRadar}
          />
        </section>

        {/* 4. À faire maintenant */}
        <section className="space-y-4">
          <div>
            <p className={APPRENANT_CARD_KICKER}>À faire maintenant</p>
            <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
              Votre prochaine étape
            </h2>
          </div>
          <div className="max-w-2xl space-y-3 rounded-3xl border border-[#3D7BFF]/25 bg-[#3D7BFF]/[0.08] px-6 py-6">
            <p className="text-[1.25rem] font-semibold tracking-[-0.02em] text-white">
              {nextAction.title}
            </p>
            <p className="text-[14px] leading-relaxed text-white/55">{nextAction.body}</p>
            <Link href={nextAction.href} className={`${CONNECT_BTN_PRIMARY} mt-2 inline-flex gap-1.5`}>
              {nextAction.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 5. Pour aller plus loin */}
        <section className="space-y-5">
          <div>
            <p className={APPRENANT_CARD_KICKER}>Pour aller plus loin</p>
            <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
              Micro-formations recommandées
            </h2>
            <p className="mt-1.5 max-w-xl text-[14px] text-white/40">
              {data.hasProject
                ? `Sélectionné pour votre objectif : ${data.objectiveLabel}`
                : "Des contenus sélectionnés selon votre profil."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {onlineRecos.map((reco) => (
              <article
                key={reco.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] transition hover:border-[#3D7BFF]/30"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#12141c]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reco.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                      EDGE Online · {reco.duree}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="text-[15px] font-semibold leading-snug text-white">{reco.title}</h3>
                  {reco.skills.length > 0 ? (
                    <p className="text-[12px] text-white/40">
                      Compétences : {reco.skills.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                  <p className="text-[12px] leading-relaxed text-white/45">{reco.reason}</p>
                  <Link
                    href={reco.href}
                    className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-semibold text-[#7BA7FF] transition group-hover:text-white"
                  >
                    Commencer <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <Link
            href={EDGE_ONLINE_APP_SURFACE_PATH}
            className="inline-flex text-[13px] font-medium text-white/40 transition hover:text-[#7BA7FF]"
          >
            Explorer EDGE Online →
          </Link>
        </section>

        {/* 6. Écosystème */}
        <section className="space-y-5">
          <div>
            <p className={APPRENANT_CARD_KICKER}>Votre écosystème</p>
            <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
              Applications EDGE
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <EcoCard
              image={skillsApp.image}
              title="Skills"
              lines={[
                `${inDev} en développement`,
                `${proved} prouvée${proved !== 1 ? "s" : ""}`,
              ]}
              cta="Continuer"
              href="/dashboard/apprenant/skills"
            />
            <EcoCard
              image={learnApp.image}
              title="Learn"
              lines={["Parcours & formations", `Tests ${data.testsDone}/3`]}
              cta="Reprendre"
              href="/dashboard/apprenant/formations"
            />
            <EcoCard
              image={planningApp.image}
              title="Planning"
              lines={
                nextEvent
                  ? [nextEvent.when, nextEvent.title]
                  : ["Aucun cours à venir", "Voir le planning"]
              }
              meta={nextEvent?.trainer ? `Formateur : ${nextEvent.trainer}` : undefined}
              cta="Voir"
              href="/dashboard/apprenant/planning"
            />
            <EcoCard
              image={recrutApp.image}
              title="Recrutement"
              lines={["Candidatures", "Opportunités"]}
              cta="Ouvrir"
              href="/dashboard/apprenant/recrutement/profil"
            />
          </div>
        </section>

        {/* 7. Timeline */}
        <section className="space-y-4">
          <div>
            <p className={APPRENANT_CARD_KICKER}>Votre parcours</p>
            <h2 className="mt-1 text-[1.25rem] font-semibold text-white">Activité récente</h2>
          </div>
          {timeline.length === 0 ? (
            <p className="text-[14px] text-white/40">
              Votre timeline s&apos;enrichira au fil de vos tests, formations et preuves.
            </p>
          ) : (
            <ul className="space-y-3 border-l border-white/[0.08] pl-4">
              {timeline.map((item, i) => (
                <li key={`${item.date}-${i}`} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#3D7BFF]" />
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">{item.date}</p>
                  <p className="mt-0.5 text-[14px] text-white/75">{item.label}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-[12px] text-white/25">
          Profil synthétise Skills · Learn · Planning · Recrutement · Care — sans les remplacer.
        </p>
      </div>
    </EdgePageAmbiance>
  );
}

function EcoCard({
  image,
  title,
  lines,
  meta,
  cta,
  href,
}: {
  image: string;
  title: string;
  lines: string[];
  meta?: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative aspect-[3/4] overflow-hidden rounded-[22px] border border-white/[0.06] transition hover:border-[#3D7BFF]/35 hover:shadow-[0_20px_40px_-24px_rgba(61,123,255,0.55)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
      <div className="relative flex h-full flex-col justify-end p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">{title}</p>
        {lines.map((line) => (
          <p key={line} className="mt-1 text-[13px] font-medium leading-snug text-white/90 sm:text-[14px]">
            {line}
          </p>
        ))}
        {meta ? <p className="mt-1 text-[11px] text-white/45">{meta}</p> : null}
        <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#7BA7FF] group-hover:text-white sm:text-[13px]">
          {cta} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
