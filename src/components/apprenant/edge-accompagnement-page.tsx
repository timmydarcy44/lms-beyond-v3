"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EDGE_ACCOMPAGNEMENT_FAQ,
  EDGE_ACCOMPAGNEMENT_OFFERS,
  EDGE_ACCOMPAGNEMENT_WHY,
  getCoachingBookingHref,
  type EdgeAccompagnementOffer,
} from "@/lib/particulier/coaching-config";
import { formatSlotLabel, formatEurosFromCents, PAYMENT_STATUS_LABELS } from "@/lib/particulier/accompagnement-booking";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Style Revolut — îlot clair dans le cockpit EDGE */
const PAGE =
  "relative -mx-2 rounded-[28px] bg-[#F6F7F9] px-5 py-10 text-[#191C1F] sm:-mx-4 sm:px-8 md:py-14 lg:-mx-6 lg:px-12";

const KICKER = "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B919A]";

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-[#191C1F] px-7 py-3.5 text-[13px] font-semibold text-white shadow-sm transition duration-300 hover:bg-black";

const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-full border border-[#DDE1E6] bg-white px-7 py-3.5 text-[13px] font-medium text-[#191C1F] transition duration-300 hover:border-[#C5CAD1] hover:bg-[#FAFBFC]";

const CARD =
  "rounded-2xl border border-[#E8EAED] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)] transition duration-300";

const CARD_FEATURED =
  "rounded-2xl border border-[#191C1F]/10 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_20px_48px_rgba(0,0,0,0.08)]";

function OfferCard({ offer }: { offer: EdgeAccompagnementOffer }) {
  const bookingHref = getCoachingBookingHref(offer.id);
  const isExternal = bookingHref.startsWith("http");

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className={cn(
        "flex h-full flex-col p-8 md:p-9",
        offer.featured ? CARD_FEATURED : CARD,
      )}
    >
      <div className="space-y-3">
        <h3 className="text-lg font-semibold tracking-tight text-[#191C1F]">{offer.title}</h3>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-2xl font-semibold tracking-tight text-[#191C1F]">{offer.price}</p>
          {offer.duration ? (
            <p className="text-sm text-[#8B919A]">{offer.duration}</p>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-[#5C6370]">{offer.description}</p>
      </div>

      <div className="mt-8 flex-1 space-y-5 text-sm text-[#5C6370]">
        {offer.examples?.length ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#8B919A]">Exemples</p>
            <ul className="mt-3 space-y-1.5">
              {offer.examples.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#C5CAD1]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {offer.includes.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#8B919A]">
              {offer.includesLabel ?? "Inclus"}
            </p>
            <ul className="mt-3 space-y-2.5">
              {offer.includes.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#191C1F]/40" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {offer.afterSimulation?.length ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#8B919A]">
              Après la simulation
            </p>
            <ul className="mt-3 space-y-2.5">
              {offer.afterSimulation.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#191C1F]/40" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {isExternal ? (
        <a
          href={bookingHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(offer.featured ? BTN_PRIMARY : BTN_SECONDARY, "mt-8 w-full sm:w-auto")}
        >
          {offer.ctaLabel}
        </a>
      ) : (
        <Link
          href={bookingHref}
          className={cn(offer.featured ? BTN_PRIMARY : BTN_SECONDARY, "mt-8 w-full sm:w-auto")}
        >
          {offer.ctaLabel}
        </Link>
      )}
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
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium text-[#191C1F]">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#8B919A] transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 pr-8 text-sm leading-relaxed text-[#5C6370]">{answer}</p>
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

  useEffect(() => {
    void fetch("/api/edge/accompagnement/reservations")
      .then((r) => r.json())
      .then((data: { reservations?: typeof reservations }) => {
        if (data.reservations) setReservations(data.reservations);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className={cn(PAGE, "space-y-16 pb-4 md:space-y-24 md:pb-8")}>
      {/* Hero */}
      <motion.header
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="max-w-3xl space-y-6 md:space-y-8"
      >
        <p className={KICKER}>Accompagnement</p>
        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#191C1F]">
          Accélérez votre progression avec un expert EDGE
        </h1>
        <div className="space-y-4 text-[15px] leading-relaxed text-[#5C6370] md:text-base">
          <p>Votre profil EDGE révèle votre potentiel.</p>
          <p>
            Nos experts vous accompagnent pour transformer cette analyse en compétences concrètes,
            réussir vos objectifs professionnels et progresser plus rapidement.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={getCoachingBookingHref("progression")} className={BTN_PRIMARY}>
            Réserver un accompagnement
          </Link>
          <a href="#formules" className={BTN_SECONDARY}>
            Découvrir les formules
          </a>
        </div>
      </motion.header>

      {/* Formules */}
      <section id="formules" className="scroll-mt-8 space-y-10 md:space-y-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">
            Formules
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#191C1F] md:text-2xl">
            Choisissez votre accompagnement
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-6 lg:grid-cols-3 lg:gap-5"
        >
          {EDGE_ACCOMPAGNEMENT_OFFERS.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </motion.div>
      </section>

      {/* Pourquoi */}
      <section className="space-y-10 md:space-y-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className={cn(CARD, "p-8 md:p-10 lg:p-12")}
        >
          <h2 className="text-xl font-semibold tracking-tight text-[#191C1F] md:text-2xl">
            {EDGE_ACCOMPAGNEMENT_WHY.title}
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#5C6370] md:text-[15px]">
            {EDGE_ACCOMPAGNEMENT_WHY.text}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:gap-5"
        >
          {EDGE_ACCOMPAGNEMENT_WHY.cards.map((card) => (
            <motion.article
              key={card.title}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.25 } }}
              className={cn(CARD, "p-7 md:p-8")}
            >
              <span className="text-2xl" role="img" aria-hidden>
                {card.emoji}
              </span>
              <h3 className="mt-5 text-base font-semibold text-[#191C1F]">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5C6370]">{card.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {reservations.length > 0 ? (
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">
              Vos réservations
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#191C1F]">Mon accompagnement</h2>
          </div>
          <div className="space-y-3">
            {reservations.map((r) => (
              <article key={r.id} className={cn(CARD, "flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between")}>
                <div>
                  <p className="font-medium text-[#191C1F]">{r.offer_name}</p>
                  <p className="mt-1 text-sm capitalize text-[#5C6370]">{formatSlotLabel(r.selected_slot)}</p>
                  {r.manage_token ? (
                    <Link
                      href={`/dashboard/accompagnement/gerer/${r.manage_token}`}
                      className="mt-2 inline-block text-xs text-[#8B919A] underline underline-offset-2 hover:text-[#191C1F]"
                    >
                      Modifier ou annuler
                    </Link>
                  ) : null}
                </div>
                <div className="text-sm text-[#5C6370]">
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
      <section className="space-y-8 md:space-y-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B919A]">
            Questions fréquentes
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#191C1F] md:text-2xl">FAQ</h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          className={cn(CARD, "px-6 md:px-8")}
        >
          {EDGE_ACCOMPAGNEMENT_FAQ.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
