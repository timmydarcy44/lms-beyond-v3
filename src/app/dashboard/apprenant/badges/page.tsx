import { EDGE_MY_BADGES_HREF } from "@/lib/beyond-connect/edge-catalog";
import Link from "next/link";
import { Award } from "lucide-react";
import {
  APPRENANT_CARD_CLASS,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
  CONNECT_BTN_PRIMARY,
  CONNECT_SECTION_SUBTITLE,
} from "@/lib/apprenant/connect-nav";

export default function DashboardApprenantBadgesPage() {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Badges</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Certifications EDGE</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Retrouve l’ensemble de tes validations officielles sur Beyond Connect — elles peuvent être
          reprises sur ta fiche côté école lorsque la source fait foi.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className={`${APPRENANT_CARD_CLASS} flex min-h-[220px] flex-col justify-between`}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[rgba(255,59,48,0.2)] bg-[rgba(255,59,48,0.06)] text-edge-red">
              <Award className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className={APPRENANT_PAGE_KICKER}>Aperçu</p>
              <p className={`mt-2 text-sm leading-relaxed ${CONNECT_SECTION_SUBTITLE}`}>
                Tes attestations officielles vivent dans l’app Beyond Connect, avec téléchargement
                des pièces quand ton organisation les autorise.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <article className={APPRENANT_CARD_CLASS}>
            <header className="space-y-1">
              <h2 className="text-xl font-medium text-[#0a0a0a]">Consulter tes certifications</h2>
              <p className={`text-[0.85rem] md:text-[0.95rem] ${CONNECT_SECTION_SUBTITLE}`}>
                Ouvert depuis ton hub Beyond Connect : historique et documents associés au même compte que
                sur la plateforme de recrutement.
              </p>
            </header>
          </article>
          <Link
            href={EDGE_MY_BADGES_HREF}
            className={`${CONNECT_BTN_PRIMARY} w-fit uppercase tracking-[0.14em]`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Ouvrir mes badges EDGE
          </Link>
        </div>
      </div>
    </div>
  );
}
