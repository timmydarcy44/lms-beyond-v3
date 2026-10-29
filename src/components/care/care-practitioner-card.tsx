import { CareLink } from "@/components/care/care-host";
import { Check } from "lucide-react";
import { formatCarePrice } from "@/lib/care/care.config";
import { CARE_DIRECTORY_COPY as C } from "@/lib/care/directory-copy";
import { CARE_DOMAINS } from "@/lib/care/domains";
import { careAvatarTone, careWhereLabel, formatCareSlotLabel } from "@/lib/care/directory-search";
import type { CareDirectoryRow } from "@/lib/care/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CarePractitionerCard({
  row,
  nextSlot,
}: {
  row: CareDirectoryRow;
  nextSlot: string | null;
}) {
  const certified = (row.badge_count ?? 0) > 0;
  const href = `/care/praticiens/${row.slug}`;
  return (
    <article className="care-prac">
      <div className="care-prac-top">
        {row.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.avatar_url} alt="" className="care-avatar" />
        ) : (
          <span className="care-avatar" style={{ background: careAvatarTone(row.expert_id) }}>
            {initials(row.display_name)}
          </span>
        )}
        <div>
          <h2>
            {row.display_name}
            {certified ? (
              <span className="care-certified">
                <Check size={14} strokeWidth={3} />
                {C.certified}
              </span>
            ) : null}
          </h2>
          <p className="care-prac-title">{row.title}</p>
          {row.tagline ? <p className="care-prac-tag">{row.tagline}</p> : null}
        </div>
      </div>
      <div className="care-prac-chips">
        {(row.domains ?? []).flatMap((id) => {
          const label = CARE_DOMAINS.find((item) => item.id === id)?.label;
          if (!label) return [];
          return [
            <span key={id} className="care-chip">
              {label}
            </span>,
          ];
        })}
      </div>
      <p className="care-prac-badges">
        {certified ? `${row.badge_count} Open Badge${row.badge_count > 1 ? "s" : ""}` : C.certInProgress}
      </p>
      <div className="care-tiles">
        <div>
          <span>{C.from}</span>
          <strong>{formatCarePrice(row.min_price_cents)}</strong>
        </div>
        <div>
          <span>{C.where}</span>
          <strong>{careWhereLabel(row)}</strong>
        </div>
        <div>
          <span>{C.next}</span>
          <strong>{formatCareSlotLabel(nextSlot)}</strong>
        </div>
      </div>
      <div className="care-prac-actions">
        <CareLink href={href} className="care-pill care-pill--ink">
          {C.profile}
        </CareLink>
        <CareLink href={href} className="care-pill care-pill--accent">
          {C.book}
        </CareLink>
      </div>
    </article>
  );
}
