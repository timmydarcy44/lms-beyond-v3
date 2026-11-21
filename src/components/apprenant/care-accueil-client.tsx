"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Brain,
  Compass,
  HelpCircle,
  Loader2,
  MessageCircle,
  Scale,
  Sparkles,
} from "lucide-react";

import type { CareLmsPractitioner } from "@/app/api/dashboard/apprenant/care/experts/route";
import {
  CARE_LMS_DEFAULT_SUBJECT,
  CARE_LMS_SUBJECTS,
  careLmsSpecialtyTags,
  getCareLmsSubject,
  isCareLmsSubjectId,
  matchesCareLmsSubject,
  type CareLmsSubjectId,
} from "@/lib/apprenant/care-subjects";
import { CARE_THEME, CARE_THEME_CSS_VARS } from "@/lib/apprenant/care-theme";
import { personInitials } from "@/lib/care/person-name";

const SUBJECT_ICONS = {
  stress: Brain,
  decision: Compass,
  confiance: MessageCircle,
  equilibre: Scale,
  apprendre: Sparkles,
  orienter: HelpCircle,
} as const;

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  return personInitials(parts[0] ?? "", parts.slice(1).join(" "));
}

function AvatarBubble({
  name,
  url,
  size,
}: {
  name: string;
  url: string | null;
  size: number;
}) {
  const initials = initialsFromName(name) || "?";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[12px] font-bold text-white"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #FF5C8A 0%, #6A2140 100%)",
      }}
    >
      {initials}
    </span>
  );
}

export function CareAccueilClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sujetParam = searchParams.get("sujet");
  const subjectId: CareLmsSubjectId = isCareLmsSubjectId(sujetParam)
    ? sujetParam
    : CARE_LMS_DEFAULT_SUBJECT;
  const subject = getCareLmsSubject(subjectId);

  const [practitioners, setPractitioners] = useState<CareLmsPractitioner[]>([]);
  const [isMinor, setIsMinor] = useState<boolean | null>(null);
  const [directoryUrl, setDirectoryUrl] = useState("https://byoundcare.fr/praticiens?utm_source=byound-lms");
  const [careHomeUrl, setCareHomeUrl] = useState("https://byoundcare.fr/?utm_source=byound-lms");
  const [loading, setLoading] = useState(true);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/apprenant/care/experts", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as {
          practitioners?: CareLmsPractitioner[];
          isMinor?: boolean | null;
          heroPhotos?: string[];
          directoryUrl?: string;
          careHomeUrl?: string;
        };
        if (cancelled) return;
        setPractitioners(json.practitioners ?? []);
        setIsMinor(typeof json.isMinor === "boolean" ? json.isMinor : null);
        const photos = json.heroPhotos ?? [];
        if (json.directoryUrl) setDirectoryUrl(json.directoryUrl);
        if (json.careHomeUrl) setCareHomeUrl(json.careHomeUrl);
        if (photos.length) {
          setHeroPhoto(photos[Math.floor(Math.random() * photos.length)] ?? null);
        }
      } catch {
        if (!cancelled) setPractitioners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sujetParam && isCareLmsSubjectId(sujetParam)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sujet", CARE_LMS_DEFAULT_SUBJECT);
    router.replace(`/dashboard/apprenant/care?${params.toString()}`, { scroll: false });
  }, [router, searchParams, sujetParam]);

  const filtered = useMemo(
    () =>
      practitioners.filter((row) =>
        matchesCareLmsSubject(
          {
            domains: row.domains,
            title: row.title,
            tagline: row.title,
            headline: row.title,
            serviceNames: row.serviceNames,
            city: row.city,
          },
          subjectId,
        ),
      ),
    [practitioners, subjectId],
  );

  const floatingPractitioner = useMemo(() => {
    const stressPool = practitioners.filter((row) =>
      matchesCareLmsSubject(
        {
          domains: row.domains,
          title: row.title,
          serviceNames: row.serviceNames,
          city: row.city,
        },
        "stress",
      ),
    );
    return stressPool[0] ?? practitioners[0] ?? null;
  }, [practitioners]);

  const selectSubject = (id: CareLmsSubjectId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sujet", id);
    router.replace(`/dashboard/apprenant/care?${params.toString()}`, { scroll: false });
  };

  const themeStyle = CARE_THEME_CSS_VARS as CSSProperties;

  return (
    <div className="care-theme min-h-full" style={themeStyle}>
      <div
        className="mx-auto grid max-w-[1280px] gap-[26px] px-5 py-6 max-[899px]:grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_340px] min-[900px]:px-10 min-[900px]:py-[34px]"
      >
        {/* Colonne gauche */}
        <div className="min-w-0 space-y-[26px] max-[899px]:contents">
          {/* 3.1 Bandeau */}
          <section
            className="relative order-1 overflow-hidden rounded-[30px] border max-[899px]:h-[460px] min-[900px]:h-[340px]"
            style={{ borderColor: "var(--care-hero-border)" }}
          >
            {heroPhoto ? (
              <Image
                src={heroPhoto}
                alt="Une personne en séance d'accompagnement en visio"
                fill
                priority
                className="object-cover max-[899px]:object-[70%_top] min-[900px]:object-[right_center]"
                sizes="(max-width: 899px) 100vw, 900px"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(70% 90% at 72% 40%, #C9686F 0%, #6A2140 50%, #2A1026 100%)",
                }}
                aria-hidden
              />
            )}
            {/* Dégradés desktop */}
            <div
              className="pointer-events-none absolute inset-0 max-[899px]:hidden"
              style={{
                background:
                  "linear-gradient(90deg, #1A0814 0%, #2A0C20F2 34%, #3A0F2899 58%, transparent 82%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 max-[899px]:hidden"
              style={{
                background: "linear-gradient(180deg, transparent 60%, #0F142899 100%)",
              }}
            />
            {/* Dégradé mobile */}
            <div
              className="pointer-events-none absolute inset-0 min-[900px]:hidden"
              style={{
                background: "linear-gradient(180deg, transparent 0%, #1A0814F2 100%)",
              }}
            />

            <div className="relative z-[1] flex h-full flex-col justify-end px-6 pb-7 pt-10 min-[900px]:absolute min-[900px]:inset-y-0 min-[900px]:left-9 min-[900px]:w-[470px] min-[900px]:justify-center min-[900px]:px-0 min-[900px]:pb-0 min-[900px]:pt-0">
              <p className="text-[14px] font-bold" style={{ color: "var(--care-accent)" }}>
                Byound Care
              </p>
              <h1
                className="mt-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.03em] min-[900px]:text-[38px]"
                style={{ color: "var(--care-text)" }}
              >
                Besoin de souffler ou d’y voir plus clair ?
              </h1>
              <p className="mt-3 max-w-[470px] text-[14px] leading-relaxed" style={{ color: "var(--care-text-muted)" }}>
                Des professionnels t’accompagnent sur les sujets qui pèsent ou qui bloquent. Ni ton
                école ni ton entreprise ne savent que tu as pris rendez-vous.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["🔒 Confidentiel", "◉ En visio ou en cabinet", "€ Tarifs sur chaque profil"].map(
                  (pill) => (
                    <span
                      key={pill}
                      className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/90"
                      style={{
                        background: "#FFFFFF1A",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                      }}
                    >
                      {pill}
                    </span>
                  ),
                )}
              </div>
            </div>

            {floatingPractitioner ? (
              <div
                className="absolute bottom-[22px] right-[22px] z-[1] hidden w-[270px] items-center gap-3 rounded-[18px] border px-[14px] py-3 min-[900px]:flex"
                style={{
                  background: "#0F1428CC",
                  borderColor: "#FFFFFF1F",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                }}
              >
                <AvatarBubble
                  name={floatingPractitioner.displayName}
                  url={floatingPractitioner.avatarUrl}
                  size={38}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-extrabold leading-tight" style={{ color: "var(--care-text)" }}>
                    Séance en visio
                  </p>
                  <p className="truncate text-[12px]" style={{ color: "var(--care-text-secondary)" }}>
                    {floatingPractitioner.displayName}
                    {floatingPractitioner.durationMin
                      ? ` · ${
                          floatingPractitioner.durationMin >= 60 &&
                          floatingPractitioner.durationMin % 60 === 0
                            ? `${floatingPractitioner.durationMin / 60} h`
                            : `${floatingPractitioner.durationMin} min`
                        }`
                      : ""}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold text-white/85"
                  style={{ background: "#FFFFFF14" }}
                >
                  🔒 Privé
                </span>
              </div>
            ) : null}

            {!heroPhoto ? (
              <span className="absolute right-5 top-4 z-[1] text-[11px] font-medium text-white/35 max-[899px]:hidden">
                Photo à intégrer
              </span>
            ) : null}
          </section>

          {isMinor === true ? (
            <p
              className="order-2 text-[13px] leading-relaxed max-[899px]:order-2"
              style={{ color: "var(--care-text-secondary)" }}
            >
              Tu as moins de 18 ans ? Parles-en à tes parents : ils pourront t’aider à réserver et
              régler la séance.
            </p>
          ) : null}

          {/* Urgence mobile (ordre 2/3 selon brief : après bandeau) */}
          <EmergencyCard className="order-3 min-[900px]:hidden" />

          {/* 3.2 Sujets */}
          <section className="order-4 space-y-4">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--care-text)" }}>
              De quoi as-tu besoin ?
            </h2>
            <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-3">
              {CARE_LMS_SUBJECTS.map((item) => {
                const Icon = SUBJECT_ICONS[item.id];
                const selected = item.id === subjectId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSubject(item.id)}
                    className="rounded-[20px] border p-4 text-left transition"
                    style={{
                      background: selected ? `${item.color}1A` : "var(--care-card)",
                      borderColor: selected ? item.color : "var(--care-border)",
                    }}
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[12px]"
                      style={{ background: `${item.color}22`, color: item.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-[15px] font-extrabold leading-snug" style={{ color: "var(--care-text)" }}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--care-text-secondary)" }}>
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3.3 Praticiens */}
          <section className="order-5 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[20px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--care-text)" }}>
                Pour « {subject.label} »
              </h2>
              <a
                href={directoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold"
                style={{ color: "var(--care-accent)" }}
              >
                Voir tous les professionnels →
              </a>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--care-text-secondary)" }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des professionnels…
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[14px]" style={{ color: "var(--care-text-secondary)" }}>
                Aucun professionnel pour ce sujet pour le moment. Tu peux en découvrir d’autres sur{" "}
                <a
                  href={directoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold"
                  style={{ color: "var(--care-accent)" }}
                >
                  byoundcare.fr
                </a>
                .
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
                {filtered.map((row) => {
                  const tags = careLmsSpecialtyTags(
                    {
                      domains: row.domains,
                      title: row.title,
                      serviceNames: row.serviceNames,
                      city: row.city,
                    },
                    subjectId,
                  );
                  return (
                    <a
                      key={row.slug}
                      href={row.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-[24px] border p-[22px] transition hover:border-[#FF5C8A66]"
                      style={{
                        background: "var(--care-card)",
                        borderColor: "var(--care-border)",
                      }}
                    >
                      <div className="flex gap-3">
                        <AvatarBubble name={row.displayName} url={row.avatarUrl} size={56} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] font-extrabold leading-tight" style={{ color: "var(--care-text)" }}>
                            {row.displayName}
                          </p>
                          {row.title ? (
                            <p className="mt-0.5 text-[13px]" style={{ color: "var(--care-text-secondary)" }}>
                              {row.title}
                            </p>
                          ) : null}
                          {tags.length ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                  style={{
                                    background: "#FFFFFF0F",
                                    color: "var(--care-text-secondary)",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div
                        className="mt-4 flex items-end justify-between gap-3 border-t pt-4"
                        style={{ borderColor: "var(--care-border)" }}
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold" style={{ color: "var(--care-text)" }}>
                            {row.formatLine}
                          </p>
                          {row.availabilityHint ? (
                            <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: "var(--care-accent)" }}>
                              {row.availabilityHint}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[12px] font-bold text-[#0F1428]">
                          Voir le profil ↗
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mobile: RDV + comment ça marche après praticiens */}
          <RdvCard careHomeUrl={careHomeUrl} className="order-6 min-[900px]:hidden" />
          <HowItWorksCard className="order-7 min-[900px]:hidden" />
        </div>

        {/* Colonne droite desktop */}
        <aside className="hidden space-y-4 min-[900px]:block">
          <RdvCard careHomeUrl={careHomeUrl} />
          <HowItWorksCard />
          <EmergencyCard />
        </aside>
      </div>
    </div>
  );
}

function RdvCard({ careHomeUrl, className = "" }: { careHomeUrl: string; className?: string }) {
  return (
    <section
      className={`rounded-[24px] border p-5 ${className}`}
      style={{ background: "var(--care-card)", borderColor: "var(--care-border)" }}
    >
      <h3 className="text-[16px] font-extrabold" style={{ color: "var(--care-text)" }}>
        Mes rendez-vous
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--care-text-secondary)" }}>
        Tes réservations, paiements et messages se trouvent dans ton espace sur byoundcare.fr.
      </p>
      <a
        href={careHomeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-[13.5px] font-semibold"
        style={{ color: "var(--care-accent)" }}
      >
        Ouvrir byoundcare.fr ↗
      </a>
    </section>
  );
}

function HowItWorksCard({ className = "" }: { className?: string }) {
  const steps = [
    { title: "Choisis un sujet", text: "Et un professionnel qui te correspond." },
    {
      title: "Découvre son profil",
      text: "Sur byoundcare.fr : parcours, tarifs, créneaux.",
    },
    {
      title: "Réserve et règle en ligne",
      text: "Toi ou tes parents. Ce que tu dis reste entre toi et le professionnel.",
    },
  ];
  return (
    <section
      className={`rounded-[24px] border p-5 ${className}`}
      style={{ background: "var(--care-card)", borderColor: "var(--care-border)" }}
    >
      <h3 className="text-[16px] font-extrabold" style={{ color: "var(--care-text)" }}>
        Comment ça marche
      </h3>
      <ol className="mt-4 space-y-3.5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
              style={{ background: CARE_THEME.accent }}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-[13.5px] font-bold" style={{ color: "var(--care-text)" }}>
                {step.title}
              </p>
              <p className="text-[12.5px] leading-snug" style={{ color: "var(--care-text-secondary)" }}>
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EmergencyCard({ className = "" }: { className?: string }) {
  return (
    <section
      className={`rounded-[24px] border p-5 ${className}`}
      style={{ background: "#FFFFFF08", borderColor: "var(--care-emergency-border)" }}
    >
      <h3 className="text-[16px] font-extrabold" style={{ color: "var(--care-text)" }}>
        Si ça ne va vraiment pas
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--care-text-secondary)" }}>
        Tu peux appeler le{" "}
        <a href="tel:3114" className="font-bold min-[900px]:pointer-events-none" style={{ color: "var(--care-text)" }}>
          3114
        </a>
        , gratuitement, 24 h/24 et 7 j/7. En cas d’urgence, appelle le{" "}
        <a href="tel:15" className="font-bold min-[900px]:pointer-events-none" style={{ color: "var(--care-text)" }}>
          15
        </a>{" "}
        ou le{" "}
        <a href="tel:112" className="font-bold min-[900px]:pointer-events-none" style={{ color: "var(--care-text)" }}>
          112
        </a>
        .
      </p>
    </section>
  );
}
