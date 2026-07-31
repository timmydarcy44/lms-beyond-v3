import { Inter } from "next/font/google";
import Link from "next/link";
import { ArrowLeft, Clock3, Users } from "lucide-react";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import type { EdgeDiagnostic } from "@/lib/edge-site/diagnostics-catalog";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

type Props = {
  diagnostic: EdgeDiagnostic;
  catalogueHref: string;
  demoHref: string;
};

export function EdgeDiagnosticsDetailPage({ diagnostic, catalogueHref, demoHref }: Props) {
  const Icon = diagnostic.icon;

  return (
    <EdgePremiumShell overlayNav={false}>
      <div className={cn(inter.className, "bg-white text-neutral-950 antialiased")}>
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
            <Link
              href={catalogueHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Tous les diagnostics
            </Link>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                  <Icon className="h-5 w-5 text-neutral-800" strokeWidth={1.5} />
                </div>
                <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                  Diagnostic
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
                  {diagnostic.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg">
                  {diagnostic.longDescription}
                </p>
                <div className="mt-8">
                  <EdgePremiumButton href={demoHref} showArrow shape="revolut">
                    Demander une démonstration
                  </EdgePremiumButton>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Clock3 className="h-4 w-4" strokeWidth={1.5} />
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em]">Durée</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
                      {diagnostic.durationMinutes} min
                    </p>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Users className="h-4 w-4" strokeWidth={1.5} />
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em]">Public</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {diagnostic.audiences.map((audience) => (
                        <span
                          key={audience}
                          className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700"
                        >
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-white px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              Compétences évaluées
            </h2>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {diagnostic.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-800 transition duration-300 hover:border-neutral-300 hover:bg-white"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-neutral-50 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              Le rapport comprend
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {diagnostic.reportItems.map((item, index) => (
                <article
                  key={item}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-neutral-950">
                    {item}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-neutral-200 bg-neutral-50 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
                Prêt à déployer ce diagnostic ?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">
                Intégrez-le dans votre écosystème EDGE : Open Badges, Skills Wallet, parcours IA et
                suivi de progression.
              </p>
            </div>
            <EdgePremiumButton href={demoHref} showArrow shape="revolut">
              Demander une démonstration
            </EdgePremiumButton>
          </div>
        </section>
      </div>
    </EdgePremiumShell>
  );
}
