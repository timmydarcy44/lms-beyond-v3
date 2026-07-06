"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowDown,
  Check,
  ChevronDown,
  Crown,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
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
import { useAccompagnementProgression } from "@/hooks/use-accompagnement-progression";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const PAGE =
  "relative -mx-2 rounded-[28px] bg-[#F6F7F9] px-5 py-8 text-[#191C1F] sm:-mx-4 sm:px-8 md:py-10 lg:-mx-6 lg:px-12";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#191C1F] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition duration-300 hover:bg-black";

const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-full border border-[#DDE1E6] bg-white px-6 py-3 text-[13px] font-medium text-[#191C1F] transition duration-300 hover:border-[#C5CAD1] hover:bg-[#FAFBFC]";

const ICON_MAP: Record<OfferIcon, typeof Crown> = {
  crown: Crown,
  target: Target,
  zap: Zap,
  layers: Layers,
};

function OfferIconBadge({ icon }: { icon: OfferIcon }) {
  const Icon = ICON_MAP[icon];
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#191C1F]/[0.04] text-[#191C1F]">
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={2.5} />;
  if (value === false || value === "—") return <span className="text-[#C5CAD1]">—</span>;
  return <span className="text-xs font-medium text-[#191C1F]">{value}</span>;
}

function OfferCard({ offer, large }: { offer: EdgeAccompagnementOffer; large?: boolean }) {
  const bookingHref = getCoachingBookingHref(offer.id);
  const isExternal = bookingHref.startsWith("http");

  const cardClass = cn(
    "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition duration-300",
    offer.featured
      ? "border-[#191C1F]/15 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      : "border-[#E8EAED] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]",
    large ? "p-8 md:p-10" : "p-6 md:p-7",
  );

  const Cta = isExternal ? "a" : Link;
  const ctaProps = isExternal
    ? { href: bookingHref, target: "_blank", rel: "noopener noreferrer" }
    : { href: bookingHref };

  return (
    <motion.article variants={fadeUp} className={cardClass}>
      {offer.badge ? (
        <span
          className={cn(
            "absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
            offer.featured ? "bg-[#191C1F] text-white" : "bg-[#F0F2F5] text-[#5C6370]",
          )}
        >
          {offer.badge}
        </span>
      ) : null}

      <div className="flex items-start gap-4">
        <OfferIconBadge icon={offer.icon} />
        <div className="min-w-0 flex-1 pr-16">
          <h3 className={cn("font-semibold tracking-tight text-[#191C1F]", large ? "text-xl" : "text-base")}>
            {offer.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className={cn("font-semibold tracking-tight text-[#191C1F]", large ? "text-3xl" : "text-2xl")}>
              {offer.price}
            </span>
            {offer.priceSuffix ? (
              <span className="text-sm text-[#8B919A]">{offer.priceSuffix}</span>
            ) : null}
            {offer.duration ? (
              <span className="text-sm text-[#8B919A]">· {offer.duration}</span>
            ) : null}
          </div>
        </div>
      </div>

      <p className={cn("mt-5 leading-relaxed text-[#5C6370]", large ? "text-[15px]" : "text-sm")}>
        {offer.description}
      </p>

      {/* Bénéfices visibles */}
      <ul className="mt-6 space-y-2.5">
        {offer.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5 text-sm text-[#191C1F]">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#191C1F]/30" strokeWidth={2} />
            <span className="font-medium">{h}</span>
          </li>
        ))}
      </ul>

      {offer.includes.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-[#EEF0F2] pt-5 text-sm text-[#5C6370]">
          {offer.includes.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C5CAD1]" strokeWidth={2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {offer.examples?.length ? (
        <p className="mt-4 text-xs text-[#8B919A]">
          Ex. : {offer.examples.join(" · ")}
        </p>
      ) : null}

      <Cta
        {...ctaProps}
        className={cn(
          offer.featured ? BTN_PRIMARY : BTN_SECONDARY,
          "mt-8 w-full",
          large && "py-3.5 text-sm",
        )}
      >
        {offer.ctaLabel}
      </Cta>
    </motion.article>
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
        <span className="text-sm font-medium text-[#191C1F]">{question}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#8B919A] transition-transform", open && "rotate-180")} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-4 pr-6 text-sm leading-relaxed text-[#5C6370]">{answer}</p>
      </motion.div>
    </div>
  );
}

function ProgressionSection() {
  const p = useAccompagnementProgression();

  if (p.loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-[#E8EAED] bg-white p-8">
        <div className="h-4 w-40 rounded bg-[#E8EAED]" />
        <div className="mt-6 h-20 rounded-xl bg-[#F0F2F5]" />
      </div>
    );
  }

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-5"
    >
      <motion.div variants={fadeUp}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">
          Votre progression actuelle
        </p>
      </motion.div>

      {/* Stats rapides */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Indice EDGE" value={`${p.edgeIndex} %`} />
        <StatCard
          label="Compétences validées"
          value={p.totalSkills > 0 ? `${p.validatedCount}/${p.totalSkills}` : "—"}
        />
        <StatCard
          label="Compétences prioritaires"
          value={p.prioritySkills.length > 0 ? p.prioritySkills[0] : "À définir"}
          small
        />
        <StatCard label="Profil aujourd'hui" value={`${p.todayScore} %`} accent />
      </motion.div>

      {/* Projection accompagnement */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-[#E8EAED] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)] md:p-8"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">
          <TrendingUp className="h-3.5 w-3.5" />
          Progression estimée avec accompagnement
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-10">
          <div className="text-center">
            <p className="text-xs text-[#8B919A]">Aujourd&apos;hui</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-[#191C1F]">{p.todayScore} %</p>
          </div>

          <div className="flex flex-col items-center gap-1 text-[#C5CAD1]">
            <ArrowDown className="h-5 w-5" />
          </div>

          <div className="text-center">
            <p className="text-xs text-[#8B919A]">Après accompagnement EDGE</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-emerald-600">{p.projectedScore} %</p>
            <p className="mt-1 text-sm font-medium text-emerald-600">(+{p.projectedGain} points)</p>
          </div>
        </div>

        {p.prioritySkills.length > 0 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[#EEF0F2] pt-5">
            <span className="text-xs text-[#8B919A]">Priorités :</span>
            {p.prioritySkills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[#F0F2F5] px-3 py-1 text-xs font-medium text-[#191C1F]"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </motion.div>
    </motion.section>
  );
}

function StatCard({
  label,
  value,
  small,
  accent,
}: {
  label: string;
  value: string;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E8EAED] bg-white px-4 py-3.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8B919A]">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold tracking-tight text-[#191C1F]",
          small ? "truncate text-sm" : "text-xl",
          accent && "text-[#191C1F]",
        )}
        title={small ? value : undefined}
      >
        {value}
      </p>
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
  const sessionOffers = EDGE_ACCOMPAGNEMENT_OFFERS.filter((o) => o.id !== "membership");

  useEffect(() => {
    void fetch("/api/edge/accompagnement/reservations")
      .then((r) => r.json())
      .then((data: { reservations?: typeof reservations }) => {
        if (data.reservations) setReservations(data.reservations);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className={cn(PAGE, "space-y-12 pb-4 md:space-y-16 md:pb-8")}>
      {/* Hero compact */}
      <motion.header initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B919A]">Mon accompagnement</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#191C1F] md:text-[1.75rem]">
          Accélérez votre progression
        </h1>
        <p className="text-sm leading-relaxed text-[#5C6370]">
          Transformez votre profil EDGE en compétences validées avec un expert.
        </p>
        <Link href={getCoachingBookingHref("membership")} className={BTN_PRIMARY}>
          <Crown className="h-4 w-4" />
          Rejoindre EDGE Membership — 49 €/mois
        </Link>
      </motion.header>

      {/* Progression */}
      <ProgressionSection />

      {/* Offres */}
      <section id="formules" className="scroll-mt-8 space-y-8">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">Formules</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#191C1F] md:text-xl">
            Choisissez votre accompagnement
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <OfferCard offer={membershipOffer} large />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid gap-5 lg:grid-cols-3"
        >
          {sessionOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </motion.div>

        {/* Comparaison */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-sm"
        >
          <div className="border-b border-[#EEF0F2] px-6 py-4">
            <h3 className="text-sm font-semibold text-[#191C1F]">Comparer les offres</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#EEF0F2] bg-[#FAFBFC] text-[10px] font-semibold uppercase tracking-wider text-[#8B919A]">
                  <th className="px-6 py-3 text-left">Inclus</th>
                  <th className="px-4 py-3 text-center">Membership</th>
                  <th className="px-4 py-3 text-center">Coaching</th>
                  <th className="px-4 py-3 text-center">Simulation</th>
                  <th className="px-4 py-3 text-center">Programme</th>
                </tr>
              </thead>
              <tbody>
                {EDGE_OFFER_COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-[#EEF0F2] last:border-b-0">
                    <td className="px-6 py-3 text-[#5C6370]">{row.label}</td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.membership} /></td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.progression} /></td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.simulation} /></td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.programme} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {reservations.length > 0 ? (
        <section className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">Vos réservations</p>
          <div className="space-y-3">
            {reservations.map((r) => (
              <article
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-[#E8EAED] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[#191C1F]">{r.offer_name}</p>
                  <p className="mt-0.5 text-sm text-[#5C6370]">{formatSlotLabel(r.selected_slot)}</p>
                  {r.manage_token ? (
                    <Link
                      href={`/dashboard/accompagnement/gerer/${r.manage_token}`}
                      className="mt-1 inline-block text-xs text-[#8B919A] underline underline-offset-2"
                    >
                      Modifier ou annuler
                    </Link>
                  ) : null}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-[#191C1F]">{formatEurosFromCents(r.amount_cents)}</p>
                  <p className="text-xs text-emerald-600">
                    {PAYMENT_STATUS_LABELS[r.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ?? r.status}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">FAQ</p>
        <div className="rounded-2xl border border-[#E8EAED] bg-white px-6">
          {EDGE_ACCOMPAGNEMENT_FAQ.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
