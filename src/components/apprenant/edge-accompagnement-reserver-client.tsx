"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEurosFromCents,
  generateAccompagnementSlots,
  type BookableEdgeOffer,
} from "@/lib/particulier/accompagnement-booking";
import { APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#0c0c10] transition duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50";

const CARD = "rounded-2xl border border-white/[0.06] bg-[#17171F]";

type Props = {
  offer: BookableEdgeOffer;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  cancelled?: boolean;
};

export function EdgeAccompagnementReserverClient({
  offer,
  defaultName,
  defaultEmail,
  defaultPhone,
  cancelled,
}: Props) {
  const slots = useMemo(() => generateAccompagnementSlots(), []);
  const [selectedSlot, setSelectedSlot] = useState(slots[0]?.id ?? "");
  const [userName, setUserName] = useState(defaultName);
  const [userPhone, setUserPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!selectedSlot) {
      setError("Aucun créneau disponible pour le moment. Réessayez plus tard.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/edge/accompagnement/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerSlug: offer.slug,
          selectedSlot,
          userName,
          userPhone,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Impossible de démarrer le paiement.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl space-y-8 pb-12 pt-2">
      <Link
        href="/dashboard/apprenant/coaching"
        className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white/70"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {cancelled ? (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
          Paiement annulé. Vous pouvez choisir un autre créneau et réessayer.
        </p>
      ) : null}

      <header className="space-y-3">
        <p className={APPRENANT_CARD_KICKER}>Réservation</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{offer.title}</h1>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-2xl font-semibold text-white">{offer.priceLabel}</p>
          <p className="text-sm text-white/40">{offer.duration}</p>
        </div>
        <p className="text-sm leading-relaxed text-white/50">{offer.description}</p>
      </header>

      <section className={cn(CARD, "space-y-5 p-6 md:p-8")}>
        <div className="flex items-center gap-2 text-white/70">
          <Calendar className="h-4 w-4 text-white/35" />
          <h2 className="text-sm font-semibold">Choisir un créneau</h2>
        </div>
        <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedSlot(slot.id)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition",
                selectedSlot === slot.id
                  ? "border-white/25 bg-white/[0.08] text-white"
                  : "border-white/[0.06] bg-white/[0.02] text-white/55 hover:border-white/12 hover:bg-white/[0.04]",
              )}
            >
              <span className="capitalize">{slot.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={cn(CARD, "space-y-4 p-6 md:p-8")}>
        <h2 className="text-sm font-semibold text-white/70">Vos informations</h2>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs text-white/40">Nom complet</span>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-white/40">Email</span>
            <input
              value={defaultEmail}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-white/40">Téléphone (optionnel)</span>
            <input
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
            />
          </label>
        </div>
      </section>

      <div className={cn(CARD, "flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8")}>
        <div>
          <p className="text-xs uppercase tracking-wider text-white/35">Total</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatEurosFromCents(offer.priceCents)}</p>
          <p className="mt-1 text-xs text-white/40">Paiement sécurisé par Stripe</p>
        </div>
        <button type="button" onClick={handlePay} disabled={loading} className={BTN_PRIMARY}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Payer et réserver
        </button>
      </div>

      {error ? <p className="text-center text-sm text-red-300/90">{error}</p> : null}

      <p className="text-center text-xs text-white/30">
        En confirmant, vous serez redirigé vers Stripe pour finaliser votre paiement.
      </p>
    </div>
  );
}
