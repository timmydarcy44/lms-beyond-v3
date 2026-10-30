"use client";

import { useMemo, useState } from "react";
import { CARE_FOR_WHOM_LABELS } from "@/lib/care/booking-schema";
import { updateCareExpertBookingStatus } from "@/lib/care/expert-actions";
import type { CareExpertBookingRow } from "@/lib/care/expert-workspace";
import { formatCareDateLong } from "@/lib/care/working-days";

export function CareBookingsBoard({ bookings }: { bookings: CareExpertBookingRow[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [rows, setRows] = useState(bookings);
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const now = Date.now();
  const list = useMemo(
    () =>
      rows.filter((item) => {
        const upcoming = new Date(item.starts_at).getTime() >= now && item.status === "confirmed";
        return tab === "upcoming" ? upcoming : !upcoming;
      }),
    [rows, tab, now],
  );

  async function act(id: string, status: "cancelled_expert" | "completed") {
    const result = await updateCareExpertBookingStatus(id, status);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setRows(rows.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "upcoming" ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#12141A]"}`} onClick={() => setTab("upcoming")}>
          À venir
        </button>
        <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "past" ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#12141A]"}`} onClick={() => setTab("past")}>
          Passés
        </button>
      </div>
      {message ? <p role="alert">{message}</p> : null}
      <ul className="grid gap-3">
        {list.map((item) => (
          <li key={item.id} className="rounded-2xl bg-[#12141A] p-4">
            <button type="button" className="w-full text-left" onClick={() => setOpen(open === item.id ? null : item.id)}>
              <strong>{item.client_first_name} {item.client_last_name}</strong>
              <span className="block text-sm text-[#9096A3]">
                {item.service_name} · {formatCareDateLong(item.starts_at)} · {item.format === "visio" ? "Visio" : "Cabinet"} · {item.status}
              </span>
            </button>
            {open === item.id ? (
              <div className="mt-3 grid gap-2 text-sm">
                <p>Pour : {CARE_FOR_WHOM_LABELS[item.for_whom].title}</p>
                {item.child_first_name ? <p>Enfant : {item.child_first_name}{item.child_age != null ? `, ${item.child_age} ans` : ""}</p> : null}
                <p>E-mail : {item.client_email}</p>
                <p>Message : {item.message || "—"}</p>
                {item.status === "confirmed" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="rounded-full bg-[#F4F5F7] px-3 py-1 font-semibold text-[#07080B]" onClick={() => void act(item.id, "completed")}>
                      Marquer réalisé
                    </button>
                    <button type="button" className="rounded-full bg-[#2A1014] px-3 py-1 font-semibold text-[#FFB4B8]" onClick={() => void act(item.id, "cancelled_expert")}>
                      Annuler (e-mail au client)
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {!list.length ? <p className="text-sm text-[#9096A3]">Aucun rendez-vous.</p> : null}
    </div>
  );
}
