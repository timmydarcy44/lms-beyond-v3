import Image from "next/image";
import { CareLink } from "@/components/care/care-host";
import { CareFavoriteButton } from "@/components/care/care-favorite-button";
import { CareSlotWatch } from "@/components/care/care-slot-watch";
import { formatParisTime } from "@/lib/care/working-days";
import type { CareDirectoryRow } from "@/lib/care/types";

function slotParts(iso: string) {
  const day = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
  })
    .format(new Date(iso))
    .replace(".", "");
  return { day, time: formatParisTime(iso) };
}

function slotLabel(iso: string, name: string) {
  const when = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
  return `Réserver ${when} avec ${name}`;
}

export function CareFindCard({ row }: { row: CareDirectoryRow }) {
  const href = `/care/praticiens/${row.slug}`;
  const slots = row.next_slots ?? [];
  const bookHref = slots[0] ? `${href}?start=${encodeURIComponent(slots[0])}#reserver` : `${href}#reserver`;
  return (
    <article className="cf-card">
      <div className="cf-photo">
        {row.avatar_url ? (
          <Image src={row.avatar_url} alt={`Photo de ${row.display_name}`} fill sizes="(max-width: 720px) 100vw, 33vw" className="cf-photo-img" />
        ) : (
          <span className="cf-photo-fallback" aria-hidden>
            {row.display_name.slice(0, 1)}
          </span>
        )}
        {row.badge_count > 0 ? <span className="cf-cert">✓ Certifié Byound</span> : null}
        <CareFavoriteButton expertId={row.expert_id} name={row.display_name} />
        <div className="cf-photo-copy">
          <h2>{row.display_name}</h2>
          {row.title ? <p>{row.title}</p> : null}
        </div>
        <CareLink href={href} className="cf-stretch" aria-label={`Voir le profil de ${row.display_name}`}>
          <span className="cf-sr">Voir le profil</span>
        </CareLink>
      </div>
      <div className="cf-body">
        {row.tagline ? <p className="cf-tagline">{row.tagline}</p> : null}
        <div className="cf-stats">
          <p>
            <strong>{row.price_main ?? "Sur devis"}</strong>
            <span>{row.price_hint ?? "la séance"}</span>
          </p>
          <p>
            <strong>{row.place_main ?? "Visio"}</strong>
            <span>{row.place_hint ?? ""}</span>
          </p>
          <p>
            <strong>{row.badge_count}</strong>
            <span>{row.badge_count > 1 ? "Open Badges" : "Open Badge"}</span>
          </p>
        </div>
        {slots.length ? (
          <div className="cf-slots">
            <p>Prochains créneaux</p>
            <div>
              {slots.map((iso) => {
                const parts = slotParts(iso);
                return (
                  <CareLink key={iso} href={`${href}?start=${encodeURIComponent(iso)}#reserver`} className="cf-slot" aria-label={slotLabel(iso, row.display_name)}>
                    <span>{parts.day}</span>
                    <strong>{parts.time}</strong>
                  </CareLink>
                );
              })}
              <CareLink href={`${href}#reserver`} className="cf-more" aria-label={`Voir l'agenda de ${row.display_name}`}>
                ›
              </CareLink>
            </div>
          </div>
        ) : (
          <CareSlotWatch expertId={row.expert_id} />
        )}
        <div className="cf-actions">
          <CareLink href={href} className="cf-btn cf-btn--quiet">
            Voir le profil
          </CareLink>
          <CareLink href={bookHref} className="cf-btn cf-btn--dark">
            {slots.length ? "Réserver" : "Contacter"}
          </CareLink>
        </div>
      </div>
    </article>
  );
}
