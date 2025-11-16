'use client';

export type TimelineStep = {
  id?: string;
  title?: string;
  description?: string;
  takeaway?: string;
  duration?: string;
  icon?: string;
  color?: string;
};

export type TimelineSchema = {
  title?: string;
  subtitle?: string;
  steps?: TimelineStep[];
  cta?: string;
};

const COLORS = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#facc15", "#ec4899"];
const TITLE_CASE_WORD = /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’\-]*$/;

const toSentenceCase = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/);
  const shouldConvert =
    words.length > 1 &&
    words.every((word) => TITLE_CASE_WORD.test(word)) &&
    words.some((word) => word.length > 2);

  if (!shouldConvert) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

function getColor(step: TimelineStep, index: number): string {
  if (step?.color && /^#([0-9A-F]{3}){1,2}$/i.test(step.color.trim())) {
    return step.color.trim();
  }

  return COLORS[index % COLORS.length];
}

function formatIcon(icon?: string): string | null {
  if (!icon) return null;
  const normalized = toSentenceCase(icon);
  if (!normalized) return null;

  // Autoriser un emoji direct
  if (/[^\p{L}\p{N}\s]/u.test(normalized)) {
    return normalized;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function TimelineTube({ data }: { data?: TimelineSchema | null }) {
  const rawSteps = Array.isArray(data?.steps) ? data?.steps.filter((step) => step && (step.title || step.description)) : [];
  const steps = rawSteps.map((step) => ({
    ...step,
    title: toSentenceCase(step.title) || step.title,
    description: toSentenceCase(step.description) || step.description,
    takeaway: toSentenceCase(step.takeaway) || step.takeaway,
    duration: step.duration?.trim() || step.duration,
    icon: toSentenceCase(step.icon) || step.icon,
  }));

  if (!steps?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 dark:bg-white/5">
        Impossible de générer un schéma visuel pour l'instant. Essayez avec un autre passage ou reformulez votre demande.
      </div>
    );
  }

  const title = toSentenceCase(data?.title) || data?.title || "Plan d'action en 4 étapes";
  const subtitle = toSentenceCase(data?.subtitle) || data?.subtitle || null;
  const cta = toSentenceCase(data?.cta) || data?.cta || null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 p-8 text-white shadow-2xl">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Parcours visuel</p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-sm text-white/70">{subtitle}</p>
          ) : null}
        </div>

        <div className="relative">
          <div className="absolute left-[36px] top-0 h-full w-2 rounded-full bg-gradient-to-b from-white/30 via-white/20 to-transparent" aria-hidden="true" />

          <div className="space-y-10">
            {steps.map((step, index) => {
              const color = getColor(step, index);
              const icon = formatIcon(step.icon);
              const stepNumber = index + 1;

              return (
                <div key={step.id ?? `timeline-step-${index}`} className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div
                      className="relative flex h-16 w-16 items-center justify-center rounded-full border-[6px] bg-slate-950 text-xl font-bold text-slate-900 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]"
                      style={{ borderColor: `${color}55`, boxShadow: `0 16px 36px -18px ${color}aa` }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}C0)` }}
                      >
                        {stepNumber}
                      </div>
                    </div>
                    {index < steps.length - 1 ? (
                      <div className="mt-4 h-full w-[6px] rounded-full bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-white/90">
                      <div className="mb-1 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-white/60">
                        <span>Étape {stepNumber}</span>
                        {step.duration ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-widest text-white/70">
                            {step.duration}
                          </span>
                        ) : null}
                        {icon ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-widest text-white/70">
                            {icon}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-lg font-semibold text-white">{step.title ?? `Phase ${stepNumber}`}</h4>
                      {step.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-white/80">{step.description}</p>
                      ) : null}

                      {step.takeaway ? (
                        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-white">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">À retenir</p>
                          <p className="leading-relaxed">{step.takeaway}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {cta ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm font-medium text-white/80">
            {cta}
          </div>
        ) : null}
      </div>
    </div>
  );
}
