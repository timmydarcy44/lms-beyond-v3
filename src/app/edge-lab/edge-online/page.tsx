import type { Metadata } from "next";

import { EdgeButton } from "@/components/edge-site/edge-button";
import { FaqAccordion } from "@/components/edge-site/faq-accordion";
import { EDGE_HREFS } from "@/lib/edge-site/constants";
import { EDGE_ONLINE_THEMATIQUES, FAQ_EDGE_ONLINE } from "@/lib/parcours";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

export const metadata: Metadata = {
  title: "EDGE Online — Le Netflix de la compétence pro",
  description: "12 thématiques, 19€/mois ou 149€/an. Micro-formations et parcours certifiants.",
};

const COMPARISON = [
  {
    title: "EDGE Online",
    items: [
      { ok: true, text: "Badges thématiques" },
      { ok: true, text: "Accès libre aux modules" },
      { ok: false, text: "Livrables évalués par expert" },
      { ok: false, text: "Open Badge IMS Global" },
    ],
  },
  {
    title: "Parcours certifiant",
    items: [
      { ok: true, text: "Open Badge IMS Global" },
      { ok: true, text: "Livrables évalués" },
      { ok: true, text: "Accompagnement expert" },
      { ok: true, text: "Speed meeting (selon parcours)" },
    ],
  },
] as const;

export default function EdgeOnlinePage() {
  return (
    <>
      <section className="bg-edge-black px-5 py-20 text-center sm:px-10 sm:py-[80px]">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
            Le Netflix de la compétence pro.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-[1.7] text-white/45">
            12 thématiques, 80+ micro-modules. Apprenez à votre rythme ou passez au parcours certifiant.
          </p>
          <div className="mt-10 flex flex-wrap items-baseline justify-center gap-6">
            <p className="text-white">
              <span className="text-[32px] font-medium">19€</span>
              <span className="text-white/45"> / mois</span>
            </p>
            <p className="text-white/45">
              ou <span className="font-medium text-white">149€/an</span>
              <span className="text-white/30"> (2 mois offerts)</span>
            </p>
          </div>
          <div className="mt-10">
            <EdgeButton href={EDGE_ONLINE_APP_SURFACE_PATH} ariaLabel="Commencer gratuitement">
              Commencer gratuitement
            </EdgeButton>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="themes-grid">
        <div className="mx-auto max-w-6xl">
          <h2 id="themes-grid" className="sr-only">
            Thématiques
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {EDGE_ONLINE_THEMATIQUES.map((t) => (
              <article key={t.slug} className="rounded-[4px] bg-edge-grey p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-edge-red">Thématique</p>
                <h3 className="mt-2 text-[15px] font-medium text-edge-black">{t.label}</h3>
                <p className="mt-2 text-[13px] text-black/40">{t.modules} modules</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-edge-grey px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="compare-online">
        <div className="mx-auto max-w-4xl">
          <h2 id="compare-online" className="text-center text-[clamp(1.75rem,3vw,2rem)] font-medium text-edge-black">
            Netflix vs Programme
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {COMPARISON.map((col) => (
              <div key={col.title} className="bg-white p-8">
                <h3 className="text-lg font-medium text-edge-black">{col.title}</h3>
                <ul className="mt-6 space-y-3">
                  {col.items.map((item) => (
                    <li key={item.text} className="flex items-center gap-3 text-[14px] text-black/40">
                      <span className={item.ok ? "text-edge-red" : "text-black/20"} aria-hidden>
                        {item.ok ? "✓" : "×"}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <EdgeButton href={EDGE_HREFS.parcours} variant="outline-red" ariaLabel="Passer au parcours certifiant">
              Passer au parcours certifiant
            </EdgeButton>
          </div>
        </div>
      </section>

      <section id="orientation" className="bg-white px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="faq-online">
        <div className="mx-auto max-w-2xl">
          <h2 id="faq-online" className="text-[clamp(1.75rem,3vw,2rem)] font-medium text-edge-black">
            FAQ
          </h2>
          <div className="mt-10">
            <FaqAccordion items={FAQ_EDGE_ONLINE} />
          </div>
        </div>
      </section>
    </>
  );
}
