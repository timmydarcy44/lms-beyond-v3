"use client";

import { useEffect, useMemo, useState } from "react";
import { CareLink } from "@/components/care/care-host";
import { formatCarePrice } from "@/lib/care/care.config";
import { formatCareDuration } from "@/lib/care/profile-format";
import { formatCareBookButton, formatCareDayChip, nextOpenDays, parisDateKey } from "@/lib/care/working-days";
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
  const active = services.filter((item) => item.active && item.name.trim());
  const [serviceId, setServiceId] = useState(active[0]?.id ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    const from = new Date();
    const to = new Date(from.getTime() + 21 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      expert: expertId,
      service: serviceId,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    let cancelled = false;
    void fetch(`/api/care/slots?${params}`)
      .then((res) => res.json())
      .then((json: { slots?: Slot[] }) => {
        if (cancelled) return;
        const next = json.slots ?? [];
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
  }, [expertId, serviceId]);

  const days = useMemo(() => nextOpenDays(slots.map((slot) => slot.starts_at)), [slots]);
  const times = slots.filter((slot) => day && parisDateKey(slot.starts_at) === day);

  if (!active.length) return null;

  return (
    <aside className="care-book">
      <h2>Réserver</h2>
      <ul className="care-book-services">
        {active.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              className={serviceId === service.id ? "is-on" : ""}
              onClick={() => setServiceId(service.id)}
            >
              <strong>{service.name}</strong>
              <span>
                {formatCareDuration(service.duration_min)} · {formatCarePrice(service.price_cents)}
              </span>
            </button>
          </li>
        ))}
      </ul>
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
      <div className="care-book-times">
        {times.map((slot) => (
          <button
            key={slot.starts_at}
            type="button"
            className={start === slot.starts_at ? "is-on" : ""}
            onClick={() => setStart(slot.starts_at)}
          >
            {new Intl.DateTimeFormat("fr-FR", {
              timeZone: "Europe/Paris",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(slot.starts_at))}
          </button>
        ))}
      </div>
      {start ? (
        <CareLink
          href={`/care/reserver/${slug}?service=${serviceId}&start=${encodeURIComponent(start)}`}
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
        Annulation gratuite jusqu'à {cancellationHours} h avant.
      </p>
    </aside>
  );
}
