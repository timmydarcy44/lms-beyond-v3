import Link from "next/link";
import { BehaviorQuadrant, IdmcPreview, PhoneFrame, SoftSkillsPreview } from "@/components/site/test-illustrations";
import { Band, focusRing, H2, Pill } from "@/components/site/ui";
import { testsPage as content } from "@/lib/content/tests";
import { cn } from "@/lib/utils";

const fanMotion = `
.ob-fan-left { transform: rotate(-8deg); animation: tests-spread-left 600ms ease both; }
.ob-fan-right { transform: rotate(8deg); animation: tests-spread-right 600ms ease both; }
.ob-fan-center { transform: translateX(-50%); animation: tests-spread-center 600ms ease both; }
@keyframes tests-spread-left { from { transform: translateX(80px) rotate(0deg); } to { transform: rotate(-8deg); } }
@keyframes tests-spread-right { from { transform: translateX(-80px) rotate(0deg); } to { transform: rotate(8deg); } }
@keyframes tests-spread-center { from { transform: translateX(-50%) scale(0.94); } to { transform: translateX(-50%) scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .ob-fan-left, .ob-fan-right, .ob-fan-center { animation: none; }
}
`;

const heading = "md:text-[60px] md:tracking-[-2.4px]";

function RatioBar({ filled, total }: { filled: number; total: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cn("h-1.5 flex-1 rounded-full", index < filled ? "bg-[#C9C2FF]" : "bg-[#26304F]")} />
      ))}
    </span>
  );
}

export function TestsPage({ demoHref, takeHref }: { demoHref: string; takeHref: string }) {
  const levels = content.idmc.levels;
  const idmcRows = content.idmc.rows.map((row) => ({
    name: row.name,
    hint: row.hint,
    filled: row.filled,
    level: levels[row.level].label,
    levelColor: levels[row.level].color,
  }));

  return (
    <div className="overflow-x-clip bg-[#F4F4F1] text-[#0B0D14]">
      <style>{fanMotion}</style>
      <section className="relative overflow-hidden bg-[#050608] text-white">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-220px] h-[760px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#6E5BFF66,transparent_68%)]" />
        <div className="relative mx-auto w-full max-w-[1240px] px-6 py-20 text-center md:py-28">
          <Pill tone="glass">{content.hero.pill}</Pill>
          <h1 className="mx-auto mt-6 max-w-[14ch] text-[44px] font-extrabold leading-[1.02] tracking-[-2px] md:text-[72px]">
            {content.hero.title}
            <span className="mt-1 block bg-[linear-gradient(100deg,#C9C2FF,#8B7BFF_48%,#5EDCC3)] bg-clip-text text-transparent">
              {content.hero.accent}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[18px] leading-relaxed text-white/75">{content.hero.text}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={demoHref} className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
              {content.hero.primary}
            </Link>
            <a href="#tests" className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
              {content.hero.secondary}
            </a>
          </div>
          <p className="sr-only">{content.hero.fanSummary}</p>
          <div className="relative mx-auto mt-14 h-[390px] max-w-[820px] md:h-[500px]" aria-hidden>
            <div className="ob-fan-left absolute left-[2%] top-8 hidden h-[420px] w-[210px] origin-bottom md:block">
              <PhoneFrame className="h-full" screen="#0B1A33">
                <p className="text-[14px] font-extrabold leading-tight">{content.idmc.title}</p>
                <div className="mt-3">
                  <IdmcPreview compact rows={idmcRows.map((row) => ({ name: row.name, filled: row.filled, level: row.level, levelColor: row.levelColor }))} />
                </div>
                <p className="mt-3 text-[12px] font-bold text-[#8DB8FF]">{content.idmc.format}</p>
              </PhoneFrame>
            </div>
            <div className="ob-fan-center absolute left-1/2 top-0 z-20 h-[390px] w-[230px] md:h-[470px]">
              <PhoneFrame className="h-full" screen="#2A2452">
                <SoftSkillsPreview compact title={content.skills.title} rows={content.skills.rows} next={content.skills.next} />
              </PhoneFrame>
            </div>
            <div className="ob-fan-right absolute right-[2%] top-8 hidden h-[420px] w-[210px] origin-bottom md:block">
              <PhoneFrame className="h-full" screen="#0C2B28">
                <p className="text-[14px] font-extrabold leading-tight">{content.behavior.title}</p>
                <div className="mt-4">
                  <BehaviorQuadrant cells={content.behavior.cells} />
                </div>
                <p className="mt-3 text-[12px] font-bold leading-snug text-[#5EDCC3]">{content.behavior.reading}</p>
              </PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#050608] text-white">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-6 py-14 md:grid-cols-3 md:gap-0 md:py-16">
          {content.questions.map((item, index) => (
            <div key={item.name} className={cn("md:px-8", index > 0 && "md:border-l md:border-white/15")}>
              <p className="text-[13px] font-extrabold text-white/50">{item.name}</p>
              <p className="mt-3 text-[22px] font-extrabold leading-snug tracking-[-0.5px]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Band id="tests" innerClassName="md:py-[112px]">
        <H2 className={heading}>
          {content.catalog.title}
          <span className="mt-1 block text-[#6B7280]">{content.catalog.accent}</span>
        </H2>
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <article className="rounded-[36px] bg-white p-6 lg:row-span-2 lg:p-8">
            <h3 className="text-[28px] font-extrabold tracking-[-0.6px]">{content.catalog.soft.title}</h3>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-[#4A4F5C]">{content.catalog.soft.text}</p>
            <div className="mt-6 rounded-[28px] bg-[#2A2452] p-5" aria-hidden>
              <SoftSkillsPreview title={content.skills.title} rows={content.skills.rows} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-[#F2CF6B] p-4 text-[#0B0D14]">
                  <p className="text-[12px] font-bold">{content.catalog.soft.develop.kicker}</p>
                  <p className="mt-1 text-[16px] font-extrabold">{content.catalog.soft.develop.title}</p>
                </div>
                <div className="rounded-[20px] bg-[#6E5BFF] p-4 text-white">
                  <p className="text-[12px] font-bold text-white/80">{content.catalog.soft.module.kicker}</p>
                  <p className="mt-1 text-[16px] font-extrabold">{content.catalog.soft.module.title}</p>
                  <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#2A2452]">
                    {content.catalog.soft.module.action}
                  </span>
                </div>
              </div>
            </div>
          </article>
          <article className="rounded-[36px] bg-[#0B1A33] p-6 text-white lg:p-8">
            <h3 className="text-[24px] font-extrabold tracking-[-0.5px]">{content.catalog.idmc.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">{content.catalog.idmc.text}</p>
            <div className="mt-6" aria-hidden>
              <IdmcPreview rows={idmcRows} />
            </div>
          </article>
          <article className="rounded-[36px] bg-[#0C2B28] p-6 text-white lg:p-8">
            <h3 className="text-[24px] font-extrabold tracking-[-0.5px]">{content.catalog.behavior.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">{content.catalog.behavior.text}</p>
            <div className="mt-6" aria-hidden>
              <BehaviorQuadrant cells={content.behavior.cells} large />
            </div>
          </article>
        </div>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {content.catalog.notes.map((note) => (
            <li key={note.title} className="rounded-[28px] bg-white p-6">
              <h3 className="text-[18px] font-extrabold">{note.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{note.text}</p>
            </li>
          ))}
        </ul>
      </Band>

      {content.showTeamView ? (
        <Band dark innerClassName="md:py-[112px]">
          <H2 light className={heading}>
            {content.team.title}
            <span className="mt-1 block text-[#A99BFF]">{content.team.accent}</span>
          </H2>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75">{content.team.note}</p>
          <p className="sr-only">{content.team.summary}</p>
          <div className="mt-10 rounded-[36px] border border-[#26304F] bg-[#111831] p-5 md:p-7" aria-hidden>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[16px] font-extrabold">{content.team.board.team}</p>
              <span className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-extrabold">{content.team.board.export}</span>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] bg-[#0B1020] p-4">
                <p className="text-[14px] font-extrabold">{content.team.board.stylesTitle}</p>
                <div className="mt-4">
                  <BehaviorQuadrant
                    cells={content.team.board.counts.map((item) => ({ label: item.label, tone: item.tone, count: item.count }))}
                  />
                </div>
                <p className="mt-3 text-[13px] leading-snug text-white/70">{content.team.board.stylesNote}</p>
              </div>
              <div className="rounded-[24px] bg-[#0B1020] p-4">
                <p className="text-[14px] font-extrabold">{content.team.board.forcesTitle}</p>
                <ul className="mt-4 grid gap-3">
                  {content.team.board.forces.map((force) => (
                    <li key={force.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                        <span>{force.label}</span>
                        <span className="font-extrabold tabular-nums">{force.filled} / {force.total}</span>
                      </div>
                      <RatioBar filled={force.filled} total={force.total} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[24px] bg-[#0B1020] p-4">
                <p className="text-[14px] font-extrabold">{content.team.board.planTitle}</p>
                <ul className="mt-4 grid gap-2">
                  {content.team.board.plan.map((item) => (
                    <li key={item} className="rounded-2xl bg-white/10 px-3 py-3 text-[14px] font-bold">{item}</li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex rounded-full bg-[#6E5BFF] px-4 py-2 text-[13px] font-extrabold">
                  {content.team.board.planAction}
                </span>
              </div>
            </div>
          </div>
        </Band>
      ) : null}

      <Band innerClassName="md:py-[112px]">
        <H2 className={heading}>{content.path.title}</H2>
        <ol className="relative mt-10 grid gap-4 md:grid-cols-4">
          <div aria-hidden className="pointer-events-none absolute left-[10%] right-[10%] top-10 hidden border-t-2 border-dashed border-[#C9C2FF] md:block" />
          {content.path.steps.map((step, index) => {
            const last = index === content.path.steps.length - 1;
            return (
              <li key={step.n} className={cn("relative rounded-[28px] p-6", last ? "bg-[#050608] text-white" : "bg-white")}>
                <span className={cn("relative grid h-10 w-10 place-items-center rounded-full text-[15px] font-extrabold", last ? "bg-[#6E5BFF] text-white" : "bg-[#EEEBFF] text-[#6E5BFF]")}>
                  {step.n}
                </span>
                <h3 className="mt-6 text-[20px] font-extrabold tracking-[-0.4px]">{step.title}</h3>
                <p className={cn("mt-2 text-[15px] leading-relaxed", last ? "text-white/75" : "text-[#4A4F5C]")}>{step.text}</p>
              </li>
            );
          })}
        </ol>
      </Band>

      <section className="bg-[#F4F4F1] px-6 pb-6">
        <div className="mx-auto box-border w-full max-w-[1240px] rounded-[36px] bg-white px-6 py-10 md:px-10 md:py-12">
          <div className="flex items-start gap-4">
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EEEBFF] text-[#6E5BFF]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <h2 className="text-[32px] font-extrabold leading-[1.05] tracking-[-1.5px] md:text-[44px] md:tracking-[-2px]">{content.privacy.title}</h2>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {content.privacy.points.map((point) => (
              <li key={point.title}>
                <h3 className="text-[16px] font-extrabold">{point.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{point.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#F4F4F1] px-6 py-10 md:py-[72px]">
        <div className="mx-auto box-border flex w-full max-w-[1240px] flex-col items-start justify-between gap-8 rounded-[36px] bg-[linear-gradient(115deg,#2A2452,#0C2B28_72%)] px-8 py-12 text-white md:flex-row md:items-center md:px-14">
          <h2 className="max-w-xl text-[36px] font-extrabold leading-[1.05] tracking-[-2px] md:text-[60px] md:tracking-[-2.4px]">{content.cta.title}</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href={demoHref} className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
              {content.cta.primary}
            </Link>
            <Link href={takeHref} className={`inline-flex h-14 items-center justify-center rounded-full border border-white/40 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
              {content.cta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
