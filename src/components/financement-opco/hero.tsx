import Link from "next/link";
import { HERO_DOSSIER, OPCO_FLAGS } from "@/lib/financement-opco";
import { focusRing, Pill } from "@/components/site/ui";

function QualiopiBadge() {
  if (!OPCO_FLAGS.qualiopi) return null;
  return (
    <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full bg-[#EEEBFF] px-4 py-2 text-[13px] font-extrabold text-[#0B0D14]">
      Organisme certifié Qualiopi
      {OPCO_FLAGS.qualiopiCertificat ? <span>Certificat {OPCO_FLAGS.qualiopiCertificat}</span> : null}
    </p>
  );
}

export function OpcoHero({
  entreprisesHref,
  contactHref,
}: {
  entreprisesHref: string;
  contactHref: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#070C1C] text-white">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(110,91,255,0.45), transparent 68%)" }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-6 pb-16 pt-32 md:py-[104px] md:pt-40 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[15px] text-white/70">
            <Link href={entreprisesHref} className={`text-white no-underline hover:underline ${focusRing}`}>
              Entreprises
            </Link>
            <span aria-hidden> › </span>
            <span>Financement OPCO</span>
          </p>
          <h1 className="mt-6 max-w-[680px] text-[44px] font-extrabold leading-[1.02] tracking-[-2px] sm:text-[64px]">
            Formez vos équipes.
            <span className="block text-[#A99BFF]">Votre OPCO finance.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[18px] leading-relaxed text-white/75">
            Plan de développement des compétences, alternance, reconversion : on identifie ce que votre OPCO peut prendre en charge et on prépare le dossier avec vous.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#verifier" className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
              Vérifier ma prise en charge
            </a>
            <Link href={contactHref} className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
              Parler à un conseiller
            </Link>
          </div>
          <QualiopiBadge />
        </div>
        <article className="rounded-[32px] border border-white/10 bg-[#12151F] p-6 sm:p-8">
          <p className="text-[13px] font-extrabold text-[#C9C2FF]">{HERO_DOSSIER.title}</p>
          <p className="mt-6 text-[14px] text-white/60">Statut</p>
          <p className="mt-2 inline-flex rounded-full bg-[#EEEBFF] px-3 py-1.5 text-[13px] font-extrabold text-[#0B0D14]">
            {HERO_DOSSIER.status}
          </p>
          <div className="mt-5 flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((segment) => (
              <span key={segment} className={`h-2 flex-1 rounded-full ${segment < 3 ? "bg-[#6E5BFF]" : "bg-white/15"}`} />
            ))}
          </div>
          <p className="mt-3 text-[14px] text-white/70">{HERO_DOSSIER.step}</p>
          <ul className="mt-8 divide-y divide-white/10">
            {HERO_DOSSIER.rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 py-3 text-[15px]">
                <span className="text-white/70">{row.label}</span>
                <Pill tone={row.tone === "done" ? "green" : row.tone === "progress" ? "violet" : "glass"}>{row.value}</Pill>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
