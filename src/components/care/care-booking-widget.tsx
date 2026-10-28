"use client";

import { useEffect, useMemo, useState } from "react";
import { CareLink } from "@/components/care/care-host";
import { formatCareBookButton, formatCareDayChip, formatParisTime, nextOpenDays, uniqueSlotsForParisDay } from "@/lib/care/working-days";
import type { CareService } from "@/lib/care/types";

type Slot = { starts_at: string; ends_at: string; format: string };

export function CareBookingWidget({
  slug,
  expertId,
  services,
  cancellationHours,
}: {
  slug: string;
  expertId: string;
  services: CareService[];
  cancellationHours: number;
}) {
  const firstVisit = [...services]
    .filter((item) => item.active && item.name.trim())
    .sort((a, b) => a.position - b.position)[0];
  const [slots, setSlots] = useState<Slot[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);

  useEffect(() => {
    if (!firstVisit) return;
    const from = new Date();
    const to = new Date(from.getTime() + 21 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      expert: expertId,
      service: firstVisit.id,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    let cancelled = false;
    void fetch(`/api/care/slots?${params}`)
      .then((res) => res.json())
      .then((json: { slots?: Slot[] }) => {
        if (cancelled) return;
        const next = [...(json.slots ?? [])].sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        );
        setSlots(next);
        const days = nextOpenDays(next.map((slot) => slot.starts_at));
        setDay(days[0] ?? null);
        setStart(null);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [expertId, firstVisit?.id]);

  const days = useMemo(() => nextOpenDays(slots.map((slot) => slot.starts_at)), [slots]);
  const times = useMemo(() => (day ? uniqueSlotsForParisDay(slots, day) : []), [slots, day]);

  if (!firstVisit) return null;

  return (
    <aside className="care-book">
      <h2>Premier rendez-vous</h2>
      <p className="care-muted">Choisissez un jour, puis un horaire. Les prestations se précisent ensemble lors de cette première séance.</p>
      {days.length ? (
        <div className="care-book-days" role="tablist" aria-label="Jour">
          {days.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={day === key}
              className={day === key ? "is-on" : ""}
              onClick={() => {
                setDay(key);
                setStart(null);
              }}
            >
              {formatCareDayChip(key)}
            </button>
          ))}
        </div>
      ) : (
        <p className="care-muted">Aucun créneau disponible pour le moment.</p>
      )}
      {day ? (
        <div className="care-book-times" role="listbox" aria-label={`Horaires du ${formatCareDayChip(day)}`}>
          {times.map((slot) => (
            <button
              key={slot.starts_at}
              type="button"
              className={start === slot.starts_at ? "is-on" : ""}
              onClick={() => setStart(slot.starts_at)}
            >
              {formatParisTime(slot.starts_at)}
            </button>
          ))}
        </div>
      ) : null}
      {start ? (
        <CareLink
          href={`/care/reserver/${slug}?service=${firstVisit.id}&start=${encodeURIComponent(start)}`}
          className="care-pill care-pill--accent"
          style={{ width: "100%", marginTop: 16 }}
        >
          {formatCareBookButton(start)}
        </CareLink>
      ) : (
        <button type="button" className="care-pill care-pill--ink" style={{ width: "100%", marginTop: 16, opacity: 0.55 }} disabled>
          Choisissez un horaire
        </button>
      )}
      <p className="care-muted" style={{ marginTop: 12 }}>
        Annulation gratuite jusqu&apos;à {cancellationHours} h avant.
      </p>
    </aside>
  );
}
