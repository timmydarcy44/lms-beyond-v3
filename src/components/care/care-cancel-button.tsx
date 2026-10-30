"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelCareBooking } from "@/lib/care/booking-actions";

export function CareCancelButton({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCancel() {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    setPending(true);
    const result = await cancelCareBooking(id, token);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button type="button" className="care-pill care-pill--ink" disabled={pending} onClick={() => void onCancel()}>
        {pending ? "Annulation…" : "Annuler le rendez-vous"}
      </button>
      {error ? (
        <p role="alert" className="care-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
