import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { formatSlotLabel, formatEurosFromCents } from "@/lib/particulier/accompagnement-booking";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function AccompagnementConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  const { user } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  let reservation: {
    offer_name: string;
    selected_slot: string;
    amount_cents: number;
    payment_status: string;
  } | null = null;

  if (sessionId) {
    const service = getServiceRoleClient();
    if (service) {
      const { data } = await service
        .from("edge_accompagnement_reservations")
        .select("offer_name, selected_slot, amount_cents, status, payment_status")
        .eq("stripe_checkout_session_id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data && data.payment_status === "paid") {
        reservation = data;
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400/85" />
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Réservation confirmée
        </h1>
        <p className="text-sm leading-relaxed text-white/50">
          Merci. Votre paiement a été enregistré et un email de confirmation vous a été envoyé.
        </p>
      </div>

      {reservation ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#17171F] p-6 text-left text-sm text-white/60">
          <p className="font-medium text-white">{reservation.offer_name}</p>
          <p className="mt-2 capitalize">{formatSlotLabel(reservation.selected_slot)}</p>
          <p className="mt-1 text-white/40">{formatEurosFromCents(reservation.amount_cents)}</p>
        </div>
      ) : (
        <p className="text-xs text-white/35">
          Votre confirmation apparaîtra dans Mon accompagnement dès validation du paiement.
        </p>
      )}

      <Link
        href="/dashboard/apprenant/coaching"
        className="inline-flex rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#0c0c10] transition hover:bg-white/90"
      >
        Retour à Mon accompagnement
      </Link>
    </div>
  );
}
