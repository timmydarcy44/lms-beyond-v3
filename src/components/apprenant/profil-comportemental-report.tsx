"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  MapPin,
  Share2,
  Sparkles,
} from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { useApprenantShell } from "@/components/apprenant/apprenant-shell-context";
import { useProfilEdgeHubData } from "@/hooks/use-profil-edge-hub-data";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
} from "@/lib/apprenant/connect-nav";
import { edgeLevelFromXp } from "@/lib/apprenant/edge-gamification";
import {
  buildPublicProfileUrl,
  slugifyPublicProfile,
} from "@/lib/apprenant/public-profile-url";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Hub Profil EDGE — identité professionnelle.
 * Synthétise Skills / Learn / Planning / Recrutement / Care sans dupliquer leurs écrans.
 */
export function ProfilComportementalReport() {
  const data = useProfilEdgeHubData();
  const shell = useApprenantShell();
  const [totalXp, setTotalXp] = useState(0);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: xpRows }, { data: settings }] = await Promise.all([
        supabase.from("edge_xp_events").select("amount").eq("user_id", user.id),
        supabase.from("user_profile_settings").select("public_slug").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      setTotalXp((xpRows ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0));

      const first = String(data.firstName ?? "").trim();
      const last = String(data.lastName ?? "").trim();
      const email = String(data.profileRow.email ?? user.email ?? "").trim();
      const slugBase =
        String(settings?.public_slug ?? "").trim() ||
        `${first} ${last}`.trim() ||
        email.split("@")[0] ||
        user.id;
      const slug = slugifyPublicProfile(slugBase);
      setPublicUrl(buildPublicProfileUrl(slug, user.id));
    })();
    return () => {
      cancelled = true;
    };
  }, [data.firstName, data.lastName, data.profileRow.email]);

  const level = edgeLevelFromXp(totalXp);
  const displayName =
    [data.firstName, data.lastName].filter(Boolean).join(" ") || "Votre profil";
  const city = data.profileRow.city ? String(data.profileRow.city) : null;
  const topSkills = useMemo(() => data.hardSkills.slice(0, 4), [data.hardSkills]);
  const pct = Math.round(data.maturity.totalPercent);

  const qrSrc = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&bgcolor=17171f&color=ffffff&data=${encodeURIComponent(publicUrl)}`
    : null;

  const copyLink = async () => {
    await shell?.sharePublicProfile?.();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (data.loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!data.discScores) {
    return (
      <EdgePageAmbiance ambiance="profile">
        <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-lg pb-16`}>
          <p className={APPRENANT_CARD_KICKER}>Profil</p>
          <h1 className="mt-2 text-[1.75rem] font-bold tracking-[-0.03em] text-white">
            Commencez par votre diagnostic
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Le test DISC active votre empreinte EDGE et votre vitrine professionnelle.
          </p>
          <Link
            href="/dashboard/apprenant/test-comportemental-intro"
            className={`${CONNECT_BTN_PRIMARY} mt-6 w-fit`}
          >
            Passer le test
          </Link>
        </div>
      </EdgePageAmbiance>
    );
  }

  return (
    <EdgePageAmbiance ambiance="profile">
      <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-3xl space-y-10 pb-20`}>
        {/* 1. Identité */}
        <section className="space-y-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/[0.08]">
              {data.avatarUrl ? (
                <Image src={data.avatarUrl} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/70">
                  {(data.firstName?.[0] || data.lastName?.[0] || "E").toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className={APPRENANT_CARD_KICKER}>Identité</p>
              <h1 className="text-[1.85rem] font-bold tracking-[-0.04em] text-white sm:text-[2.1rem]">
                {displayName}
              </h1>
              <p className="text-[15px] text-white/70">
                {data.hasProject ? data.objectiveLabel : "Métier cible à définir"}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/40">
                {city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {city}
                  </span>
                ) : null}
                <span>Profil EDGE — {pct} % complété</span>
              </div>
              <div className="pt-1">
                <Link
                  href={PROFIL_EDGE_SECTION_HREFS.identite}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3D7BFF] hover:text-[#5B93FF]"
                >
                  Compléter mon profil <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#3D7BFF] transition-all"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </section>

        {/* 2. Empreinte EDGE */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className={APPRENANT_CARD_KICKER}>Empreinte EDGE</p>
              <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-white">
                Synthèse de vos preuves
              </h2>
            </div>
            <Link
              href="/dashboard/apprenant/skills"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#3D7BFF] hover:text-[#5B93FF]"
            >
              Explorer mes compétences <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className={cn(APPRENANT_CARD_BODY, "space-y-4")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Niveau EDGE" value={`Niv. ${level.level}`} />
              <Metric label="Compétences" value={String(data.hardSkills.length)} />
              <Metric label="Badges" value={data.badgeAwarded ? "1+" : "0"} />
              <Metric label="Tests" value={`${data.testsDone}/3`} />
            </div>

            {topSkills.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Top compétences
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[12px] text-white/70"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 text-[12px]">
              <StatusChip ok={Boolean(data.discScores)} label="DISC" />
              <StatusChip ok={data.hasIdmc} label="IDMC" />
              <StatusChip ok={data.hasSoftSkills} label="Soft skills" />
              {data.badgeAwarded ? (
                <StatusChip ok label={data.badgeName || "Badge"} />
              ) : null}
            </div>
          </div>
        </section>

        {/* 3. Mon activité */}
        <section className="space-y-3">
          <div>
            <p className={APPRENANT_CARD_KICKER}>Mon activité</p>
            <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-white">
              Accès directs aux applications
            </h2>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <ActivityLink
              href="/dashboard/apprenant/skills"
              icon={Sparkles}
              title={`${data.hardSkills.length} compétences`}
              subtitle="Ouvrir Skills"
            />
            <ActivityLink
              href="/dashboard/apprenant/formations"
              icon={GraduationCap}
              title={data.hasProject ? data.objectiveLabel : "Parcours & formations"}
              subtitle="Ouvrir Learn"
            />
            <ActivityLink
              href="/dashboard/apprenant/planning"
              icon={CalendarDays}
              title="Prochain cours"
              subtitle="Ouvrir Planning"
            />
            <ActivityLink
              href="/dashboard/apprenant/recrutement/en-attente"
              icon={Briefcase}
              title="Candidatures"
              subtitle="Ouvrir Recrutement"
            />
          </div>
        </section>

        {/* 4. Profil public */}
        <section className="space-y-3">
          <div>
            <p className={APPRENANT_CARD_KICKER}>Profil public</p>
            <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-white">
              Votre vitrine partageable
            </h2>
          </div>

          <div className={cn(APPRENANT_CARD_BODY, "sm:flex-row sm:items-center sm:justify-between")}>
            <div className="flex min-w-0 items-start gap-4">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt="QR code profil public"
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] shrink-0 rounded-xl border border-white/[0.06] bg-[#0d0d12]"
                />
              ) : (
                <div className="h-[88px] w-[88px] shrink-0 rounded-xl bg-white/[0.04]" />
              )}
              <div className="min-w-0 space-y-2">
                <p className="text-[14px] font-semibold text-white">Aperçu public</p>
                <p className="truncate text-[12px] text-white/40" title={publicUrl ?? undefined}>
                  {publicUrl ?? "Génération du lien…"}
                </p>
                <p className={APPRENANT_CARD_MUTED}>
                  Visibilité : lien public — partageable avec un recruteur ou un partenaire.
                </p>
              </div>
            </div>

            <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0">
              <button
                type="button"
                onClick={() => void copyLink()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-black"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Lien copié" : "Partager mon profil"}
              </button>
              {publicUrl ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] px-4 py-2.5 text-[13px] font-semibold text-white/75 hover:bg-white/[0.04]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir mon profil public
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] px-4 py-2.5 text-[13px] font-semibold text-white/75"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Préparer le lien
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </EdgePageAmbiance>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className="mt-1 text-[18px] font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-medium",
        ok ? "bg-[#3D7BFF]/15 text-[#93B4FF]" : "bg-white/[0.04] text-white/35",
      )}
    >
      {ok ? "✓ " : ""}
      {label}
    </span>
  );
}

function ActivityLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        APPRENANT_CARD_BODY,
        "flex-row items-center gap-3 transition hover:border-[#3D7BFF]/25",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D7BFF]/12 text-[#3D7BFF]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-[12px] text-white/40">{subtitle}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
    </Link>
  );
}
