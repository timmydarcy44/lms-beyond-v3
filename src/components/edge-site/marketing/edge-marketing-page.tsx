"use client";

import { cn } from "@/lib/utils";
import type { MarketingPageContent } from "@/lib/edge-site/marketing-content";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { resolveMarketingContentHref } from "@/lib/edge-site/edge-marketing-path";

type Props = {
  content: MarketingPageContent;
};

export function EdgeMarketingPage({ content }: Props) {
  const { routes } = useEdgePremiumConfig();
  const href = (path: string) => resolveMarketingContentHref(path, routes);
  const isDark = content.hero.tone !== "light";

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:px-10 lg:pb-24 lg:pt-36",
          isDark ? "bg-edge-black-deep text-white" : "bg-edge-cream text-edge-black-deep",
        )}
      >
        {isDark ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(99,91,255,0.12),transparent_55%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.2),transparent_40%)]"
              aria-hidden
            />
          </>
        ) : null}

        <div className="relative mx-auto max-w-3xl">
          {content.label ? (
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.25em]",
                isDark ? "text-edge-accent" : "text-edge-accent",
              )}
            >
              {content.label}
            </p>
          ) : null}
          <h1
            className={cn(
              "mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]",
              isDark ? "text-white" : "text-edge-black-deep",
            )}
          >
            {content.hero.title}
          </h1>
          <p
            className={cn(
              "mt-6 text-base leading-relaxed sm:text-lg",
              isDark ? "text-white/55" : "text-black/50",
            )}
          >
            {content.hero.subtitle}
          </p>
          {content.ctas?.length ? (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {content.ctas.map((cta, i) => (
                <EdgePremiumButton
                  key={cta.label}
                  href={href(cta.href)}
                  variant={
                    cta.variant === "white"
                      ? "white"
                      : cta.variant === "secondary"
                        ? "secondary-dark"
                        : "primary"
                  }
                  shape="revolut"
                  showArrow={i === 0}
                  className={cn(isDark && cta.variant === "secondary" ? "" : "")}
                >
                  {cta.label}
                </EdgePremiumButton>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className={cn("py-16 sm:py-24", isDark ? "bg-edge-cream" : "bg-white")}>
        <div className="mx-auto max-w-4xl space-y-12 px-5 sm:px-8 lg:px-10">
          {content.sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight text-edge-black-deep sm:text-2xl">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-black/50">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      {content.ctas?.length && content.sections.length > 2 ? (
        <section className="border-t border-black/[0.06] bg-edge-cream py-14">
          <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-5 sm:flex-row sm:items-center sm:px-8 lg:px-10">
            {content.ctas.map((cta) => (
              <EdgePremiumButton
                key={`footer-${cta.label}`}
                href={href(cta.href)}
                variant={cta.variant === "white" ? "white" : "primary"}
                shape="revolut"
              >
                {cta.label}
              </EdgePremiumButton>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
