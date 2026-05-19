import { EDGE_MY_BADGES_HREF } from "@/lib/beyond-connect/edge-catalog";
import Link from "next/link";
import { Award } from "lucide-react";
import { APPRENANT_CARD_CLASS } from "@/lib/apprenant/connect-nav";

export default function DashboardApprenantBadgesPage() {
  return (
    <div className="space-y-6 text-[#e6e9ef] md:space-y-8 md:rounded-[34px] md:border md:border-[#283247] md:bg-[#0b0e14]/90 md:p-8 md:px-10 md:py-10 lg:px-12 md:backdrop-blur">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#cbb6ff]/80">
          Badges
        </p>
        <h1 className="text-[clamp(1.45rem,2.5vw,1.85rem)] font-semibold text-white md:text-[clamp(1.95rem,3vw,2.4rem)]">
          Certifications EDGE
        </h1>
        <p className="max-w-2xl text-sm text-[#9aa8c9]">
          Retrouve l’ensemble de tes validations officielles sur Beyond Connect — elles peuvent être
          reprises sur ta fiche côté école lorsque la source fait foi.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div
          className={`${APPRENANT_CARD_CLASS} flex min-h-[220px] flex-col justify-between gap-6 bg-gradient-to-br from-[#1a1430] via-[#10151c] to-[#0f172a] p-6`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-400/35 bg-purple-600/25 text-purple-100">
              <Award className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#cbb6ff]/90">
                Aperçu
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#cdd6ea]">
                Tes attestations officielles vivent dans l’app Beyond Connect, avec téléchargement
                des pièces quand ton organisation les autorise.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <article className={APPRENANT_CARD_CLASS}>
            <header className="space-y-1 px-6 py-6">
              <h2 className="text-xl font-semibold text-white">
                Consulter tes certifications
              </h2>
              <p className="text-[0.85rem] text-[#cdd6ea] md:text-[0.95rem]">
                Ouvert depuis ton hub Beyond Connect : historique et documents associés au même compte que
                sur la plateforme de recrutement.
              </p>
            </header>
          </article>
          <div className="flex flex-wrap gap-4">
            <Link
              href={EDGE_MY_BADGES_HREF}
              className="inline-flex rounded-full bg-gradient-to-br from-purple-700 via-purple-900 to-purple-950 px-6 py-3 text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-white shadow-xl shadow-purple-900/40 hover:brightness-105"
              target="_blank"
              rel="noreferrer noopener"
            >
              Ouvrir mes badges EDGE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
