"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Loader2, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEurosFromCents,
  type BookableEdgeOffer,
} from "@/lib/particulier/accompagnement-booking";
import { APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#0c0c10] transition duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 px-6 py-3 text-[13px] font-medium text-white/65 transition hover:border-white/20 hover:bg-white/[0.04]";

const CARD = "rounded-2xl border border-white/[0.06] bg-[#17171F]";

const STEPS = [
  { id: 1, label: "Créneau", icon: Calendar },
  { id: 2, label: "Informations", icon: User },
  { id: 3, label: "Paiement", icon: Lock },
] as const;

type SlotOption = { id: string; label: string; available: boolean };

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
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [userName, setUserName] = useState(defaultName);
  const [userPhone, setUserPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const res = await fetch("/api/edge/accompagnement/slots");
      const data = (await res.json()) as { slots?: SlotOption[] };
      const list = (data.slots ?? []).filter((s) => s.available);
      setSlots(list);
      setSelectedSlot((prev) => prev || list[0]?.id || "");
    } catch {
      setError("Impossible de charger les créneaux.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const selectedSlotLabel = slots.find((s) => s.id === selectedSlot)?.label ?? "";

  async function handlePay() {
    if (!selectedSlot) {
      setError("Choisissez un créneau disponible.");
      return;
    }
    if (!userName.trim()) {
      setError("Indiquez votre nom.");
      setStep(2);
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
        if (res.status === 409) void loadSlots();
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
        <p className="text-sm text-white/45">{offer.priceLabel} · {offer.duration}</p>
      </header>

      <ProgressSteps current={step} />

      {step === 1 ? (
        <section className={cn(CARD, "space-y-5 p-6 md:p-8")}>
          <h2 className="text-sm font-semibold text-white/70">Étape 1 — Choisir un créneau</h2>
          {slotsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-white/30" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-white/45">Aucun créneau disponible pour le moment.</p>
          ) : (
            <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition",
                    selectedSlot === slot.id
                      ? "border-white/25 bg-white/[0.08] text-white"
                      : "border-white/[0.06] bg-white/[0.02] text-white/55 hover:border-white/12",
                  )}
                >
                  <span className="capitalize">{slot.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(2)}
              className={BTN_PRIMARY}
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className={cn(CARD, "space-y-5 p-6 md:p-8")}>
          <h2 className="text-sm font-semibold text-white/70">Étape 2 — Vos informations</h2>
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-white/40">Nom complet</span>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-white/40">Email</span>
              <input value={defaultEmail} readOnly className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-white/40">Téléphone (optionnel)</span>
              <input
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(1)} className={BTN_SECONDARY}>
              Retour
            </button>
            <button type="button" onClick={() => setStep(3)} className={BTN_PRIMARY}>
              Continuer
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className={cn(CARD, "space-y-6 p-6 md:p-8")}>
          <h2 className="text-sm font-semibold text-white/70">Étape 3 — Paiement sécurisé</h2>
          <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm">
            <p className="capitalize text-white/70">{selectedSlotLabel}</p>
            <p className="text-white/45">{offer.title}</p>
            <p className="text-lg font-semibold text-white">{formatEurosFromCents(offer.priceCents)}</p>
            <p className="text-xs text-white/35">Redirection vers Stripe · Paiement chiffré</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(2)} className={BTN_SECONDARY}>
              Retour
            </button>
            <button type="button" onClick={handlePay} disabled={loading} className={BTN_PRIMARY}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Payer et réserver
            </button>
          </div>
        </section>
      ) : null}

      {error ? <p className="text-center text-sm text-red-300/90">{error}</p> : null}
    </div>
  );
}

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = current === s.id;
        const done = current > s.id;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                done && "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
                active && !done && "border-white/25 bg-white/10 text-white",
                !active && !done && "border-white/[0.08] text-white/30",
              )}
            >
              {done ? "✓" : <Icon className="h-4 w-4" />}
            </div>
            <span className={cn("hidden text-xs sm:block", active ? "text-white/80" : "text-white/35")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 ? <div className="mx-1 h-px flex-1 bg-white/[0.06]" /> : null}
          </div>
        );
      })}
    </div>
  );
}
