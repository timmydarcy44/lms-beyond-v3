"use client";

import { useEffect, useMemo, useState } from "react";
import { CareLink } from "@/components/care/care-host";
import { formatCarePrice } from "@/lib/care/care.config";
import { formatCareDuration } from "@/lib/care/profile-format";
import { formatCareDayChip, formatParisTime, nextOpenDays, parisDateKey, uniqueSlotsForParisDay } from "@/lib/care/working-days";
import type { CareService } from "@/lib/care/types";

type Slot = { starts_at: string; ends_at: string; format: string };

export function CareProfileBook({
  slug,
  expertId,
  firstName,
  fullName,
  services,
  cancellationHours,
  city,
  initialStart,
}: {
  slug: string;
  expertId: string;
  firstName: string;
  fullName: string;
  services: CareService[];
  cancellationHours: number;
  city: string | null;
  initialStart?: string;
}) {
  const active = services.filter((item) => item.active && item.name.trim() && !item.name.startsWith("["));
  const [serviceId, setServiceId] = useState(active[0]?.id ?? "");
  const service = active.find((item) => item.id === serviceId) ?? active[0];
  const modes = service?.formats ?? [];
  const [mode, setMode] = useState<"cabinet" | "visio">(modes.includes("cabinet") ? "cabinet" : "visio");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(initialStart ?? null);

  useEffect(() => {
    if (!service) return;
    const from = new Date();
    const to = new Date(from.getTime() + 21 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      expert: expertId,
      service: service.id,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    let cancelled = false;
    const preset = initialStart || new URLSearchParams(window.location.search).get("start") || "";
    void fetch(`/api/care/slots?${params}`)
      .then((res) => res.json())
      .then((json: { slots?: Slot[] }) => {
        if (cancelled) return;
        const next = json.slots ?? [];
        setSlots(next);
        const days = nextOpenDays(next.map((slot) => slot.starts_at), 5);
        const wanted = preset && !Number.isNaN(Date.parse(preset)) ? parisDateKey(preset) : null;
        setDay(wanted && days.includes(wanted) ? wanted : days[0] ?? null);
        if (preset && next.some((slot) => slot.starts_at === preset)) setStart(preset);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [expertId, initialStart, service]);

  const visible = useMemo(
    () => slots.filter((slot) => !mode || slot.format === mode || modes.length < 2),
    [mode, modes.length, slots],
  );
  const days = useMemo(() => nextOpenDays(visible.map((slot) => slot.starts_at), 5), [visible]);
  const times = useMemo(() => (day ? uniqueSlotsForParisDay(visible, day) : []), [day, visible]);
  const chosen = times.find((slot) => slot.starts_at === start) ?? null;
  if (!service) return null;
  const reserveHref = chosen ? `/care/reserver/${slug}?service=${service.id}&start=${encodeURIComponent(chosen.starts_at)}` : `${`/care/praticiens/${slug}`}#reserver`;
  const when = chosen
    ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(chosen.starts_at))
    : null;

  return (
    <aside className="cf-book" id="reserver">
      <p className="cf-kicker">Réserver avec {firstName}</p>
      <h2>
        {service.name} · {formatCareDuration(service.duration_min)}
      </h2>
      {active.length > 1 ? (
        <label className="cf-book-service">
          Prestation
          <select value={service.id} onChange={(event) => setServiceId(event.target.value)}>
            {active.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {modes.length > 1 ? (
        <div className="cf-modes" role="group" aria-label="Mode">
          {modes.includes("cabinet") ? (
            <button type="button" className={mode === "cabinet" ? "is-on" : ""} onClick={() => setMode("cabinet")}>
              Au cabinet
            </button>
          ) : null}
          {modes.includes("visio") ? (
            <button type="button" className={mode === "visio" ? "is-on" : ""} onClick={() => setMode("visio")}>
              En visio
            </button>
          ) : null}
        </div>
      ) : (
        <p className="cf-mode-only">{modes[0] === "cabinet" ? "Au cabinet" : "En visio"}</p>
      )}
      {days.length ? (
        <div className="cf-days" role="tablist" aria-label="Jour">
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
        <p className="cf-mode-only">Pas de créneau en ligne pour cette prestation.</p>
      )}
      <div className="cf-times">
        {times.map((slot) => (
          <button
            key={slot.starts_at}
            type="button"
            className={start === slot.starts_at ? "is-on" : ""}
            aria-label={`Réserver ${formatCareDayChip(parisDateKey(slot.starts_at))} à ${formatParisTime(slot.starts_at).replace(":", " h ")} avec ${fullName}`}
            onClick={() => setStart(slot.starts_at)}
          >
            {formatParisTime(slot.starts_at)}
          </button>
        ))}
      </div>
      {when ? (
        <p className="cf-recap">
          <span>{when}</span>
          <strong>{formatCarePrice(service.price_cents)}</strong>
        </p>
      ) : null}
      <p className="cf-rule">Modification ou annulation gratuite jusqu&apos;à {cancellationHours} h avant.</p>
      <CareLink href={reserveHref} className={`cf-btn cf-btn--pink${chosen ? "" : " is-disabled"}`} aria-disabled={!chosen}>
        Réserver ce créneau
      </CareLink>
      <a className="cf-btn cf-btn--quiet" href="mailto:contact@byound.fr">
        Poser une question
      </a>
      <p className="cf-place-note">
        {mode === "cabinet" && city
          ? `Cabinet à ${city} · l'adresse exacte vous est envoyée à la réservation.`
          : "En visio · le lien vous est envoyé à la réservation."}
      </p>
    </aside>
  );
}
