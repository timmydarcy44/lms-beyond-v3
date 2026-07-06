"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#0c0c10] transition hover:bg-white/90";

const CARD = "rounded-2xl border border-white/[0.06] bg-[#17171F]";

type ReservationView = {
  offer_name: string;
  coach_name: string;
  dateLabel: string;
  timeLabel: string;
  visio_url?: string | null;
};

type Props = {
  sessionId?: string;
};

export function EdgeAccompagnementConfirmationClient({ sessionId }: Props) {
  const [state, setState] = useState<"loading" | "paid" | "pending" | "cancelled" | "error">("loading");
  const [reservation, setReservation] = useState<ReservationView | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      setErrorMsg("Session de paiement introuvable.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 12;

    async function poll() {
      try {
        const res = await fetch(`/api/edge/accompagnement/session-status?session_id=${encodeURIComponent(sessionId!)}`);
        const data = await res.json();

        if (data.state === "paid" && data.reservation) {
          setReservation(data.reservation);
          setState("paid");
          return;
        }
        if (data.state === "cancelled") {
          setState("cancelled");
          return;
        }
        if (data.state === "stripe_unconfigured") {
          setState("error");
          setErrorMsg(data.error ?? "Stripe non configuré");
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          setState("pending");
          window.setTimeout(poll, 2000);
        } else {
          setState("pending");
        }
      } catch {
        setState("error");
        setErrorMsg("Impossible de vérifier le paiement.");
      }
    }

    void poll();
  }, [sessionId]);

  if (state === "loading" || state === "pending") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-20 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-white/40" />
        <h1 className="text-xl font-semibold text-white">Validation du paiement…</h1>
        <p className="text-sm text-white/45">
          {state === "pending"
            ? "Votre paiement est en cours de confirmation. Cette page se mettra à jour automatiquement."
            : "Vérification en cours avec Stripe."}
        </p>
      </div>
    );
  }

  if (state === "error" || state === "cancelled") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-white">
          {state === "cancelled" ? "Paiement annulé" : "Confirmation en attente"}
        </h1>
        <p className="text-sm text-white/50">{errorMsg ?? "Le paiement n'a pas été finalisé."}</p>
        <Link href="/dashboard/apprenant/coaching" className={BTN_PRIMARY}>
          Retourner dans EDGE
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-10 py-12 md:py-16">
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400/90" strokeWidth={1.5} />
        <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-white">
          Paiement confirmé
        </h1>
        <p className="text-base text-white/55">Votre réservation est enregistrée.</p>
      </div>

      {reservation ? (
        <div className={cn(CARD, "space-y-5 p-8")}>
          <DetailRow label="Date" value={reservation.dateLabel} />
          <DetailRow label="Heure" value={reservation.timeLabel} />
          <DetailRow label="Accompagnement" value={reservation.offer_name} />
          <DetailRow label="Coach" value={reservation.coach_name || "Expert EDGE"} />
          <div className="flex gap-3 border-t border-white/[0.06] pt-5">
            <Video className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
            <div>
              <p className="text-xs uppercase tracking-wider text-white/35">Visioconférence</p>
              <p className="mt-1 text-sm text-white/65">
                {reservation.visio_url || "Vous recevrez le lien par email avant la séance."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="text-center">
        <Link href="/dashboard/apprenant/coaching" className={BTN_PRIMARY}>
          Retourner dans EDGE
        </Link>
        <p className="mt-4 text-xs text-white/30">Un email de confirmation et un fichier calendrier vous ont été envoyés.</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-white/35">{label}</span>
      <span className="text-sm font-medium capitalize text-white">{value}</span>
    </div>
  );
}
