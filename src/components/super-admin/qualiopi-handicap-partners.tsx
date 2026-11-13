"use client";

import { Download, ExternalLink } from "lucide-react";
import {
  HANDICAP_PARTNERS,
  HANDICAP_PARTNERS_META,
} from "@/lib/handicap/partners-directory";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_KICKER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

export function QualiopiHandicapPartners() {
  const meta = HANDICAP_PARTNERS_META;

  return (
    <div className="space-y-5">
      <div className={cn(QUALIOPI_CARD, "p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={QUALIOPI_KICKER}>
              {meta.reference} · v{meta.version}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">{meta.title}</h2>
            <p className={cn(QUALIOPI_MUTED, "mt-2 max-w-2xl text-sm")}>
              Les structures que la référente handicap mobilise pour accueillir, accompagner ou
              orienter une personne en situation de handicap.
            </p>
          </div>
          <a
            href={meta.pdfPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/[0.1]"
          >
            <Download className="h-4 w-4" />
            PDF AN-HAN-01
          </a>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cn(QUALIOPI_CARD_INNER, "px-3 py-2")}>
            <dt className={cn(QUALIOPI_MUTED, "text-[11px] uppercase tracking-wide")}>
              Dernière MAJ
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#6BE3C0]">{meta.lastUpdatedLabel}</dd>
          </div>
          <div className={cn(QUALIOPI_CARD_INNER, "px-3 py-2")}>
            <dt className={cn(QUALIOPI_MUTED, "text-[11px] uppercase tracking-wide")}>
              Prochaine revue
            </dt>
            <dd className="mt-1 text-sm font-medium text-white/90">{meta.nextReviewLabel}</dd>
          </div>
          <div className={cn(QUALIOPI_CARD_INNER, "px-3 py-2")}>
            <dt className={cn(QUALIOPI_MUTED, "text-[11px] uppercase tracking-wide")}>
              Référente
            </dt>
            <dd className="mt-1 text-sm font-medium text-white/90">
              {meta.referentName}
              <br />
              <a
                className="text-[#6BE3C0] hover:underline"
                href={`mailto:${meta.referentEmail}`}
              >
                {meta.referentEmail}
              </a>
            </dd>
          </div>
          <div className={cn(QUALIOPI_CARD_INNER, "px-3 py-2")}>
            <dt className={cn(QUALIOPI_MUTED, "text-[11px] uppercase tracking-wide")}>
              Qualiopi
            </dt>
            <dd className="mt-1 text-sm font-medium text-white/90">{meta.qualiopiIndicators}</dd>
          </div>
        </dl>

        <p className={cn(QUALIOPI_MUTED, "mt-4 text-xs leading-relaxed")}>{meta.usageRule}</p>
      </div>

      <ul className="grid gap-3">
        {HANDICAP_PARTNERS.map((partner) => (
          <li key={partner.id} className={cn(QUALIOPI_CARD, "p-4")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-white">{partner.name}</h3>
                <p className="mt-1 text-sm text-white/75">{partner.role}</p>
              </div>
              <div className="text-right text-xs text-white/50">
                Contact établi le
                <br />
                <span className="font-semibold text-white/80">
                  {partner.contactEstablishedOn
                    ? new Date(partner.contactEstablishedOn).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
              {partner.phone ? <span>{partner.phone}</span> : null}
              {partner.email ? (
                <a className="text-[#6BE3C0] hover:underline" href={`mailto:${partner.email}`}>
                  {partner.email}
                </a>
              ) : null}
              {partner.website ? (
                <a
                  className="inline-flex items-center gap-1 text-[#6BE3C0] hover:underline"
                  href={partner.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Site <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
            {partner.address ? (
              <p className={cn(QUALIOPI_MUTED, "mt-2 text-xs")}>{partner.address}</p>
            ) : null}
            {partner.notes ? (
              <p className="mt-2 text-xs font-medium text-amber-200/90">{partner.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className={cn(QUALIOPI_MUTED, "text-xs")}>{meta.coordsNote}</p>
    </div>
  );
}
