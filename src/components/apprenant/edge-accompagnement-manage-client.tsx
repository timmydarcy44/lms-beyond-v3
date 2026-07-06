"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { formatSlotLabel, PAYMENT_STATUS_LABELS } from "@/lib/particulier/accompagnement-booking";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

type Props = {
  manageToken: string;
};

type Reservation = {
  offer_name: string;
  selected_slot: string;
  coach_name: string;
  payment_status: keyof typeof PAYMENT_STATUS_LABELS;
  status: string;
};

export function EdgeAccompagnementManageClient({ manageToken }: Props) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void fetch("/api/edge/accompagnement/reservations")
      .then((r) => r.json())
      .then((data: { reservations?: Array<Reservation & { manage_token: string }> }) => {
        const match = data.reservations?.find((r) => r.manage_token === manageToken);
        if (match) setReservation(match);
      })
      .finally(() => setLoading(false));
  }, [manageToken]);

  async function cancel() {
    if (!confirm("Confirmer l'annulation de ce rendez-vous ?")) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/edge/accompagnement/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manageToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Annulation impossible");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-white/60">Réservation introuvable.</p>
        <Link href="/dashboard/apprenant/coaching" className={CONNECT_BTN_PRIMARY}>
          Mon accompagnement
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-lg font-semibold text-white">Rendez-vous annulé</p>
        <Link href="/dashboard/apprenant/coaching" className={CONNECT_BTN_PRIMARY}>
          Réserver un nouveau créneau
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <h1 className="text-2xl font-semibold text-white">Gérer mon rendez-vous</h1>
      <div className="rounded-2xl border border-white/[0.06] bg-[#17171F] p-6 space-y-3 text-sm">
        <p className="font-medium text-white">{reservation.offer_name}</p>
        <p className="capitalize text-white/55">{formatSlotLabel(reservation.selected_slot)}</p>
        <p className="text-white/45">Coach : {reservation.coach_name}</p>
        <p className="text-white/35">
          {PAYMENT_STATUS_LABELS[reservation.payment_status] ?? reservation.payment_status}
        </p>
      </div>
      {reservation.status === "confirmed" && reservation.payment_status === "paid" ? (
        <button type="button" onClick={cancel} disabled={cancelling} className={CONNECT_BTN_SECONDARY}>
          {cancelling ? "Annulation…" : "Annuler le rendez-vous"}
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-300/90">{error}</p> : null}
      <Link href="/dashboard/apprenant/coaching" className={`${CONNECT_BTN_PRIMARY} inline-flex`}>
        Retour
      </Link>
    </div>
  );
}
