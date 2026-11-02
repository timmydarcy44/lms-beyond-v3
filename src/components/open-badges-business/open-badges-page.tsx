import Image from "next/image";
import Link from "next/link";
import { MetalBadgeCard } from "@/components/openbadges/metal-badge-card";
import { NumberedSteps } from "@/components/site/steps";
import { Band, focusRing, H2, Pill } from "@/components/site/ui";
import { openBadgesBusiness as content } from "@/lib/content/open-badges-business";
import { cn } from "@/lib/utils";

export type OpenBadgeExpert = {
  id: string;
  name: string;
  jobTitle: string;
  photoUrl: string | null;
};

const fanMotion = `
.ob-fan-left { transform: rotate(-14deg); animation: ob-spread-left 600ms ease both; }
.ob-fan-right { transform: rotate(14deg); animation: ob-spread-right 600ms ease both; }
.ob-fan-center { transform: translateX(-50%); animation: ob-spread-center 600ms ease both; }
@keyframes ob-spread-left { from { transform: translateX(90px) rotate(0deg); } to { transform: rotate(-14deg); } }
@keyframes ob-spread-right { from { transform: translateX(-90px) rotate(0deg); } to { transform: rotate(14deg); } }
@keyframes ob-spread-center { from { transform: translateX(-50%) scale(0.94); } to { transform: translateX(-50%) scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .ob-fan-left, .ob-fan-right, .ob-fan-center { animation: none; }
}
`;

function Segments({ filled, total }: { filled: number; total: number }) {
  return (
    <span className="flex flex-1 gap-1" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cn("h-2 flex-1 rounded-full", index < filled ? "bg-[#6E5BFF]" : "bg-[#26304F]")} />
      ))}
    </span>
  );
}

function LevelBars({ count, featured }: { count: number; featured: boolean }) {
  return (
    <span className="flex gap-1" aria-hidden>
      {Array.from({ length: 3 }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-7 rounded-full",
            index < count ? (featured ? "bg-white" : "bg-[#6E5BFF]") : featured ? "bg-white/30" : "bg-[#E6E4DE]",
          )}
        />
      ))}
    </span>
  );
}

export function OpenBadgesBusinessPage({
  experts,
  demoHref,
  advisorHref,
  expertsHref,
}: {
  experts: OpenBadgeExpert[];
  demoHref: string;
  advisorHref: string;
  expertsHref: string;
}) {
  const points = content.pilot.points.filter((point) => !point.gated || content.exportEntretiens);
  const exampleHref = content.demoBadgeUrl.trim();

  return (
    <div className="overflow-x-clip bg-[#F4F4F1] text-[#0B0D14]">
      <style>{fanMotion}</style>
      <section className="relative overflow-hidden bg-[#050608] text-white">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-180px] h-[720px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#6E5BFF66,transparent_68%)]" />
        <div className="relative mx-auto w-full max-w-[1240px] px-6 py-20 md:py-[112px]">
          <Pill tone="glass">{content.hero.pill}</Pill>
          <h1 className="mt-6 max-w-[16ch] text-[44px] font-extrabold leading-[1.02] tracking-[-2px] md:text-[72px]">
            {content.hero.title} <span className="text-[#A99BFF]">{content.hero.accent}</span>
          </h1>
          <p className="mt-6 max-w-[640px] text-[18px] leading-relaxed text-white/75">{content.hero.text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={demoHref} className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
              {content.hero.primary}
            </Link>
            <a href="#verifier" className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
              {content.hero.secondary}
            </a>
          </div>
          <p className="sr-only">{content.hero.fanSummary}</p>
          <div className="relative mx-auto mt-14 h-[230px] max-w-[860px] md:h-[320px]" aria-hidden>
            {content.hero.cards.map((card) => (
              <div
                key={card.titre}
                className={cn(
                  "absolute",
                  card.place === "left" && "ob-fan-left left-[2%] top-10 hidden w-[44%] origin-bottom md:block",
                  card.place === "right" && "ob-fan-right right-[2%] top-10 hidden w-[44%] origin-bottom md:block",
                  card.place === "center" && "ob-fan-center left-1/2 top-0 z-20 w-[min(100%,400px)]",
                )}
              >
                <MetalBadgeCard titre={card.titre} titulaire={card.titulaire} date={card.date} teinte={card.teinte} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Band innerClassName="md:py-[112px]">
        <H2>{content.why.title}</H2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {content.why.cards.map((card) => (
            <li key={card.title} className={cn("rounded-[32px] p-7", card.dark ? "bg-[#050608] text-white" : "bg-white")}>
              <h3 className="text-[22px] font-extrabold tracking-[-0.5px]">{card.title}</h3>
              <p className={cn("mt-3 text-[16px] leading-relaxed", card.dark ? "text-white/75" : "text-[#4A4F5C]")}>{card.text}</p>
            </li>
          ))}
        </ul>
      </Band>

      <Band dark className="bg-[#050608]" innerClassName="md:py-[112px]">
        <H2 light>{content.anatomy.title}</H2>
        <p className="sr-only">{content.anatomy.summary}</p>
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_minmax(280px,420px)_1fr]">
          <ol className="order-2 grid gap-6 lg:order-1">
            {content.anatomy.points.slice(0, 3).map((point) => (
              <li key={point.n}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#6E5BFF] text-[14px] font-extrabold">{point.n}</span>
                <h3 className="mt-3 text-[18px] font-extrabold">{point.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-white/70">{point.text}</p>
              </li>
            ))}
          </ol>
          <div className="order-1 rounded-[32px] bg-[#111318] p-5 lg:order-2" aria-hidden>
            <MetalBadgeCard {...content.anatomy.badge} />
            <ul className="mt-5 grid gap-3">
              {content.anatomy.rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-[14px] last:border-0">
                  <span className="text-white/60">{row.label}</span>
                  <span className={cn("font-extrabold", row.value.startsWith("✓") && "text-[#2FD08A]")}>{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <ol className="order-3 grid gap-6">
            {content.anatomy.points.slice(3).map((point) => (
              <li key={point.n}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#6E5BFF] text-[14px] font-extrabold">{point.n}</span>
                <h3 className="mt-3 text-[18px] font-extrabold">{point.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-white/70">{point.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Band>

      <Band innerClassName="md:py-[112px]">
        <H2>{content.merit.title}</H2>
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.merit.proofs.map((proof) => (
            <li key={proof.title} className="rounded-[28px] bg-white p-6">
              <h3 className="text-[18px] font-extrabold">{proof.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{proof.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-[32px] bg-[#050608] p-6 text-white md:p-8">
          <h3 className="text-[22px] font-extrabold tracking-[-0.5px]">{content.merit.levelsTitle}</h3>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {content.merit.levels.map((level) => (
              <li key={level.title} className={cn("rounded-[28px] p-6", level.featured ? "bg-[#6E5BFF]" : "bg-white text-[#0B0D14]")}>
                <LevelBars count={level.bars} featured={level.featured} />
                <h4 className="mt-4 text-[18px] font-extrabold">{level.title}</h4>
                <p className={cn("mt-2 text-[15px] leading-relaxed", level.featured ? "text-white/85" : "text-[#4A4F5C]")}>{level.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Band>

      {content.showExperts ? (
        <Band innerClassName="md:py-[112px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <H2>{content.experts.title}</H2>
            <Link href={expertsHref} className={`text-[15px] font-extrabold text-[#6E5BFF] no-underline ${focusRing}`}>
              {content.experts.link}
            </Link>
          </div>
          {experts.length > 0 ? (
            <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {experts.map((person) => (
                <li key={person.id}>
                  <article>
                    <div className="relative h-[320px] overflow-hidden rounded-[28px] bg-[#1A1B22] md:h-[400px]">
                      {person.photoUrl ? (
                        <Image src={person.photoUrl} alt="" fill sizes="(min-width: 1280px) 280px, (min-width: 768px) 45vw, 100vw" className="object-cover" />
                      ) : (
                        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(160deg,#2C2D36,#6E5BFF)]">
                          <svg viewBox="0 0 80 80" className="absolute bottom-0 left-1/2 h-[78%] w-[70%] -translate-x-1/2 text-white/80">
                            <circle cx="40" cy="28" r="14" fill="currentColor" />
                            <path d="M12 78c4-18 14-26 28-26s24 8 28 26" fill="currentColor" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 text-[17px] font-extrabold">{person.name}</h3>
                    {person.jobTitle ? <p className="mt-1 text-[14px] text-[#4A4F5C]">{person.jobTitle}</p> : null}
                  </article>
                </li>
              ))}
            </ul>
          ) : null}
        </Band>
      ) : null}

      <Band dark innerClassName="md:py-[112px]">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <H2 light>{content.pilot.title}</H2>
            <ul className="mt-8 grid gap-4">
              {points.map((point) => (
                <li key={point.text} className="flex items-start gap-3 text-[17px]">
                  <span aria-hidden className="mt-0.5 font-extrabold text-[#2FD08A]">✓</span>
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] border border-[#26304F] bg-[#111831] p-6" aria-hidden>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[16px] font-extrabold">{content.pilot.board.team}</p>
              <span className="rounded-full bg-[#2FD08A]/15 px-3 py-1.5 text-[13px] font-extrabold text-[#8FF2C4]">{content.pilot.board.pill}</span>
            </div>
            <ul className="mt-6 grid gap-5">
              {content.pilot.board.skills.map((skill) => (
                <li key={skill.label}>
                  <div className="mb-2 flex items-center justify-between text-[14px]">
                    <span>{skill.label}</span>
                    <span className="font-extrabold tabular-nums">{skill.filled} / {skill.total}</span>
                  </div>
                  <Segments filled={skill.filled} total={skill.total} />
                </li>
              ))}
            </ul>
          </div>
          <p className="sr-only">{content.pilot.summary}</p>
        </div>
      </Band>

      <Band id="verifier" innerClassName="md:py-[112px]">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <H2>{content.verify.title}</H2>
            <p className="mt-5 text-[17px] leading-relaxed text-[#4A4F5C]">{content.verify.text}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#4A4F5C]">{content.verify.note}</p>
            {exampleHref ? (
              <a href={exampleHref} className={`mt-8 inline-flex h-14 items-center justify-center rounded-full bg-[#0B0D14] px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
                {content.verify.example}
              </a>
            ) : null}
          </div>
          <div className="rounded-[32px] bg-[#050608] p-7 text-white">
            <span className="inline-flex rounded-full bg-[#2FD08A] px-3 py-1.5 text-[13px] font-extrabold text-[#0B0D14]">{content.verify.pill}</span>
            <ul className="mt-6 grid gap-4">
              {content.verify.rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-[15px] last:border-0">
                  <span className="text-white/65">{row.label}</span>
                  <span className="font-extrabold">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <Band innerClassName="md:py-[112px]">
        <H2>{content.steps.title}</H2>
        <NumberedSteps
          steps={content.steps.items}
          marker="index"
          className="mt-10 grid gap-4 md:grid-cols-3"
        />
      </Band>

      <section className="bg-[#F4F4F1] px-6 pb-16 md:pb-[112px]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 rounded-[40px] bg-[#050608] px-8 py-12 text-white md:flex-row md:items-center md:px-14">
          <h2 className="max-w-xl text-[36px] font-extrabold leading-[1.05] tracking-[-2px] md:text-[52px]">{content.cta.title}</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href={demoHref} className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
              {content.cta.primary}
            </Link>
            <Link href={advisorHref} className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
              {content.cta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
