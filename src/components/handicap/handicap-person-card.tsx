import { handicapCasePath } from "@/lib/handicap/paths";
import { HANDICAP_THEME as T, STATUS_PILL } from "@/lib/handicap/theme";

const NEXT_TONE: Record<string, string> = {
  green: T.green,
  amber: T.amber,
  red: T.red,
  blue: T.blue,
  muted: T.muted,
};

export type HandicapPersonCardData = {
  id: string;
  personName: string;
  roleLine: string;
  status: string;
  statusLabel: string;
  accommodations: string[];
  nextStep: { text: string; tone: "green" | "amber" | "red" | "blue" | "muted" };
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function HandicapPersonCard({ person }: { person: HandicapPersonCardData }) {
  const pill = STATUS_PILL[person.status] ?? STATUS_PILL.closed;
  const shown = person.accommodations.slice(0, 3);
  const extra = person.accommodations.length - shown.length;
  const href = handicapCasePath(person.id);

  return (
    <a
      href={href}
      className="group flex h-full flex-col rounded-[24px] border p-5 transition hover:border-[rgba(206,0,88,0.45)]"
      style={{ background: T.card, borderColor: T.border, color: T.text }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[14px] font-extrabold"
          style={{ background: T.accentSoft, color: T.accent }}
        >
          {initials(person.personName) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[16px] font-extrabold">{person.personName}</p>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: pill.bg, color: pill.color }}
            >
              {person.statusLabel}
            </span>
          </div>
          <p className="mt-1 text-[12px]" style={{ color: T.muted }}>
            {person.roleLine}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {shown.length === 0 ? (
          <span className="text-[12px]" style={{ color: T.tertiary }}>
            Aucun aménagement saisi
          </span>
        ) : (
          shown.map((a) => (
            <span
              key={a}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: T.inner, color: T.muted }}
            >
              {a}
            </span>
          ))
        )}
        {extra > 0 ? (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: T.inner, color: T.muted }}
          >
            +{extra}
          </span>
        ) : null}
      </div>

      <div
        className="mt-auto flex items-end justify-between gap-3 border-t pt-4"
        style={{ borderColor: T.border }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: T.tertiary }}>
            Prochaine étape
          </p>
          <p className="mt-1 text-[13px] font-semibold" style={{ color: NEXT_TONE[person.nextStep.tone] }}>
            {person.nextStep.text}
          </p>
        </div>
        <span
          className="shrink-0 text-[18px] font-bold transition group-hover:translate-x-0.5"
          style={{ color: T.accent }}
        >
          ›
        </span>
      </div>
    </a>
  );
}
