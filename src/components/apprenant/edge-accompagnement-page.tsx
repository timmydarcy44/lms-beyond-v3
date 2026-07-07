"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Check, ChevronDown, Crown, Layers, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EDGE_ACCOMPAGNEMENT_FAQ,
  EDGE_ACCOMPAGNEMENT_OFFERS,
  EDGE_OFFER_COMPARISON,
  getCoachingBookingHref,
  type EdgeAccompagnementOffer,
  type OfferIcon,
} from "@/lib/particulier/coaching-config";
import { formatSlotLabel, formatEurosFromCents, PAYMENT_STATUS_LABELS } from "@/lib/particulier/accompagnement-booking";
import { useAccompagnementSituation } from "@/hooks/use-accompagnement-progression";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const PAGE =
  "relative -mx-2 rounded-[24px] bg-[#F7F8FA] px-5 py-8 text-[#191C1F] sm:-mx-4 sm:px-8 md:py-10 lg:-mx-6 lg:px-12";

const LABEL = "text-[10px] font-medium uppercase tracking-[0.14em] text-[#8B919A]";

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-lg bg-[#191C1F] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-black";

const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-lg border border-[#E2E5E9] bg-white px-5 py-2.5 text-[13px] font-medium text-[#191C1F] transition hover:border-[#C5CAD1] hover:bg-[#FAFBFC]";

const ICON_MAP: Record<OfferIcon, typeof Crown> = {
  crown: Crown,
  target: Target,
  zap: Zap,
  layers: Layers,
};

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-3.5 w-3.5 text-[#191C1F]/60" strokeWidth={2} />;
  if (value === false || value === "—") return <span className="text-[#D0D4D9]">—</span>;
  return <span className="text-xs text-[#5C6370]">{value}</span>;
}

function MembershipCard({ offer }: { offer: EdgeAccompagnementOffer }) {
  const href = getCoachingBookingHref(offer.id);

  return (
    <motion.article
      variants={fadeUp}
      className="rounded-2xl border border-[#191C1F]/10 bg-white p-8 md:p-10"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-5">
          <div className="space-y-2">
            <span className={LABEL}>{offer.tierLabel}</span>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#191C1F]">{offer.title}</h3>
            <p className="text-[15px] leading-relaxed text-[#5C6370]">{offer.valueProposition}</p>
          </div>

          <ul className="space-y-3">
            {offer.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-[#191C1F]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#191C1F]/40" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 lg:items-end lg:text-right">
          <div>
            <p className="text-3xl font-semibold tracking-[-0.03em] text-[#191C1F]">
              {offer.price}
              {offer.priceSuffix ? (
                <span className="text-base font-normal text-[#8B919A]"> {offer.priceSuffix}</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-[#8B919A]">{offer.description}</p>
          </div>
          <Link href={href} className={cn(BTN_PRIMARY, "min-w-[200px]")}>
            {offer.ctaLabel}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function SecondaryOfferCard({ offer }: { offer: EdgeAccompagnementOffer }) {
  const href = getCoachingBookingHref(offer.id);
  const Icon = ICON_MAP[offer.icon];

  return (
    <motion.article
      variants={fadeUp}
      className="flex h-full flex-col rounded-xl border border-[#E8EAED] bg-white p-6 transition hover:border-[#D0D4D9]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F5F7] text-[#5C6370]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className={cn(LABEL, "text-right")}>{offer.tierLabel}</span>
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-base font-semibold tracking-[-0.01em] text-[#191C1F]">{offer.title}</h3>
        <p className="text-sm leading-relaxed text-[#5C6370]">{offer.valueProposition}</p>
      </div>

      <p className="mt-5 text-lg font-semibold tracking-tight text-[#191C1F]">
        {offer.price}
        {offer.priceSuffix ? <span className="text-sm font-normal text-[#8B919A]"> {offer.priceSuffix}</span> : null}
        {offer.duration ? <span className="text-sm font-normal text-[#8B919A]"> · {offer.duration}</span> : null}
      </p>

      <Link href={href} className={cn(BTN_SECONDARY, "mt-auto pt-8 w-full")}>
        {offer.ctaLabel}
      </Link>
    </motion.article>
  );
}

function SituationActuelle() {
  const s = useAccompagnementSituation();

  if (s.loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 rounded-xl border border-[#E8EAED] bg-white" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-[#F4F5F7]" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Compétences alignées", value: String(s.alignedCount) },
    { label: "À consolider", value: String(s.consolidateCount) },
    { label: "À développer", value: String(s.skillsToDevelop) },
    { label: "À explorer", value: String(s.unevaluatedCount) },
    { label: "Parcours recommandés", value: String(s.recommendedPathsCount) },
  ];

  return (
    <motion.section initial="hidden" animate="show" variants={fadeUp} className="space-y-5">
      <p className={LABEL}>Votre situation actuelle</p>

      {/* KPI pédagogique principal : complétude du profil */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#191C1F]/10 bg-white p-5 sm:col-span-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B919A]">Complétude du profil</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#191C1F]">
            {s.completionPercent}
            <span className="text-lg text-[#8B919A]"> %</span>
          </p>
          <p className="mt-1 text-xs text-[#5C6370]">
            {s.evaluatedCount} compétence{s.evaluatedCount > 1 ? "s" : ""} évaluée
            {s.evaluatedCount > 1 ? "s" : ""} sur {s.totalExpectedSkills || "—"}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF0F2]">
            <div
              className="h-full rounded-full bg-[#191C1F] transition-all"
              style={{ width: `${Math.max(4, s.completionPercent)}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[#191C1F]/10 bg-white p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B919A]">Progression vers l&apos;objectif</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#191C1F]">
            {s.compatibilityPercent}
            <span className="text-lg text-[#8B919A]"> %</span>
          </p>
          <p className="mt-1 text-xs text-[#5C6370]">{s.objectiveLabel}</p>
        </div>
        <div className="rounded-xl border border-[#191C1F]/10 bg-white p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B919A]">Priorité actuelle</p>
          <p className="mt-2 text-lg font-semibold tracking-[-0.01em] text-[#191C1F]">
            {s.nextAction?.skill ?? "Compléter votre profil"}
          </p>
          <p className="mt-1 text-xs text-[#5C6370]">La compétence à travailler en premier.</p>
        </div>
      </div>

      {/* Répartition des compétences */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E8EAED] bg-[#E8EAED] sm:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B919A]">{m.label}</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#191C1F]">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Votre prochaine action recommandée */}
      {s.nextAction ? (
        <div className="rounded-xl border border-[#191C1F]/10 bg-[#191C1F] p-6 text-white">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
            Votre prochaine action recommandée
          </p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.01em]">Priorité : {s.nextAction.skill}</p>
          <p className="mt-1 text-sm text-white/70">{s.nextAction.why}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/70">
            <span>Action recommandée : {s.nextAction.action}</span>
            <span>Durée estimée : {s.nextAction.estimatedMinutes} min</span>
            <span>Impact estimé : {s.nextAction.impact}</span>
          </div>
          <Link
            href="/dashboard/apprenant?premiers-pas=1"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-[13px] font-medium text-[#191C1F] transition hover:bg-white/90"
          >
            Commencer maintenant
          </Link>
        </div>
      ) : null}

      {/* Timeline */}
      <ProgressionTimeline nextSkill={s.nextAction?.skill ?? null} />
    </motion.section>
  );
}

function ProgressionTimeline({ nextSkill }: { nextSkill: string | null }) {
  const groups = [
    {
      when: "Aujourd'hui",
      items: [nextSkill ? `Faire l'exercice recommandé (${nextSkill})` : "Définir votre objectif professionnel"],
    },
    { when: "Cette semaine", items: ["Réaliser une simulation IA", "Déposer une preuve"] },
    { when: "Ce mois-ci", items: ["Suivre une formation courte", "Demander une validation", "Obtenir un badge"] },
  ];

  return (
    <div className="rounded-xl border border-[#E8EAED] bg-white p-6">
      <p className={LABEL}>Votre plan des prochaines semaines</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.when}>
            <p className="text-sm font-semibold text-[#191C1F]">{group.when}</p>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[#5C6370]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#191C1F]/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#EEF0F2] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm text-[#191C1F]">{question}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#8B919A] transition-transform", open && "rotate-180")} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-4 pr-8 text-sm leading-relaxed text-[#5C6370]">{answer}</p>
      </motion.div>
    </div>
  );
}

export function EdgeAccompagnementPage() {
  const [reservations, setReservations] = useState<
    Array<{
      id: string;
      offer_name: string;
      selected_slot: string;
      amount_cents: number;
      status: string;
      payment_status: string;
      manage_token?: string;
    }>
  >([]);

  const membershipOffer = EDGE_ACCOMPAGNEMENT_OFFERS.find((o) => o.id === "membership")!;
  const secondaryOffers = EDGE_ACCOMPAGNEMENT_OFFERS.filter((o) => o.id !== "membership");

  useEffect(() => {
    void fetch("/api/edge/accompagnement/reservations")
      .then((r) => r.json())
      .then((data: { reservations?: typeof reservations }) => {
        if (data.reservations) setReservations(data.reservations);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className={cn(PAGE, "mx-auto max-w-5xl space-y-14 pb-6 md:space-y-16")}>
      {/* Hero sobre */}
      <motion.header initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl space-y-4">
        <p className={LABEL}>Mon plan de progression</p>
        <h1 className="text-[1.625rem] font-semibold leading-[1.2] tracking-[-0.025em] text-[#191C1F] md:text-[1.75rem]">
          Mon plan de progression
        </h1>
        <p className="text-[15px] leading-relaxed text-[#5C6370]">
          EDGE vous propose les prochaines actions les plus utiles pour développer vos compétences et
          atteindre votre objectif professionnel.
        </p>
      </motion.header>

      <SituationActuelle />

      {/* Offres */}
      <section id="formules" className="scroll-mt-8 space-y-8">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <p className={LABEL}>Formules</p>
          <h2 className="mt-2 text-base font-semibold tracking-[-0.01em] text-[#191C1F]">
            Accompagnements disponibles
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          <MembershipCard offer={membershipOffer} />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid gap-4 md:grid-cols-3"
        >
          {secondaryOffers.map((offer) => (
            <SecondaryOfferCard key={offer.id} offer={offer} />
          ))}
        </motion.div>

        {/* Comparaison factuelle */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="overflow-hidden rounded-xl border border-[#E8EAED] bg-white"
        >
          <div className="border-b border-[#EEF0F2] px-5 py-3.5">
            <h3 className="text-sm font-medium text-[#191C1F]">Comparaison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-[#EEF0F2] text-[10px] font-medium uppercase tracking-wider text-[#8B919A]">
                  <th className="px-5 py-2.5 text-left font-medium">Inclus</th>
                  <th className="px-3 py-2.5 text-center font-medium">Membership</th>
                  <th className="px-3 py-2.5 text-center font-medium">Coaching</th>
                  <th className="px-3 py-2.5 text-center font-medium">Simulation</th>
                  <th className="px-3 py-2.5 text-center font-medium">Programme</th>
                </tr>
              </thead>
              <tbody>
                {EDGE_OFFER_COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-[#EEF0F2] last:border-b-0">
                    <td className="px-5 py-2.5 text-[#5C6370]">{row.label}</td>
                    <td className="px-3 py-2.5 text-center"><ComparisonCell value={row.membership} /></td>
                    <td className="px-3 py-2.5 text-center"><ComparisonCell value={row.progression} /></td>
                    <td className="px-3 py-2.5 text-center"><ComparisonCell value={row.simulation} /></td>
                    <td className="px-3 py-2.5 text-center"><ComparisonCell value={row.programme} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {reservations.length > 0 ? (
        <section className="space-y-4">
          <p className={LABEL}>Vos réservations</p>
          <div className="space-y-2">
            {reservations.map((r) => (
              <article
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-[#E8EAED] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[#191C1F]">{r.offer_name}</p>
                  <p className="mt-0.5 text-sm text-[#5C6370]">{formatSlotLabel(r.selected_slot)}</p>
                  {r.manage_token ? (
                    <Link
                      href={`/dashboard/accompagnement/gerer/${r.manage_token}`}
                      className="mt-1 inline-block text-xs text-[#8B919A] hover:text-[#191C1F]"
                    >
                      Modifier ou annuler
                    </Link>
                  ) : null}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-[#191C1F]">{formatEurosFromCents(r.amount_cents)}</p>
                  <p className="text-xs text-[#5C6370]">
                    {PAYMENT_STATUS_LABELS[r.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ?? r.status}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <p className={LABEL}>Questions</p>
        <div className="rounded-xl border border-[#E8EAED] bg-white px-5">
          {EDGE_ACCOMPAGNEMENT_FAQ.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
