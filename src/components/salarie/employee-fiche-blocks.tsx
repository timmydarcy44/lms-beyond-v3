"use client";

export function KpiCard({
  label,
  value,
  detail,
  onClick,
  tone = "white",
}: {
  label: string;
  value: string;
  detail: string;
  onClick: () => void;
  tone?: "white" | "violet";
}) {
  const featured = tone === "violet";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        featured
          ? "relative overflow-hidden rounded-[26px] bg-[#6E5BFF] px-5 py-5 text-left text-white"
          : "rounded-[26px] bg-white px-5 py-5 text-left text-[#07080B]"
      }
    >
      {featured ? <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" aria-hidden /> : null}
      <p className={`text-sm font-semibold ${featured ? "text-white/80" : "text-[#6B6F7A]"}`}>{label}</p>
      <p className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.04em]">{value}</p>
      <p className={`mt-2 text-sm ${featured ? "text-white/80" : "text-[#6B6F7A]"}`}>{detail}</p>
    </button>
  );
}

export function DatePill({ date, tone = "sand" }: { date: string; tone?: "white" | "sand" }) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = parsed.toLocaleDateString("fr-FR", { day: "numeric" });
  const month = parsed.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  const light = tone === "white";
  return (
    <span
      className={`inline-flex min-w-14 flex-col items-center rounded-2xl px-3 py-2 ${light ? "bg-white text-[#07080B]" : "bg-[#F4F4F1] text-[#07080B]"}`}
    >
      <span className="text-lg font-extrabold leading-none">{day}</span>
      <span className={`text-xs ${light ? "text-[#3A3D45]" : "text-[#6B6F7A]"}`}>{month}</span>
    </span>
  );
}

export function SegmentBar({
  segments,
}: {
  segments: Array<{ value: number; color: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-[#ECE9E1]" aria-hidden>
      {total === 0
        ? null
        : segments.map((segment, index) =>
            segment.value > 0 ? (
              <span
                key={`${segment.color}-${index}`}
                style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
              />
            ) : null,
          )}
    </div>
  );
}

export function TxRow({
  tone,
  title,
  detail,
  action,
  meta,
  onOpen,
}: {
  tone: string;
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void };
  meta?: string;
  onOpen?: () => void;
}) {
  const body = (
    <>
      <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: tone }} aria-hidden />
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold text-[#07080B]">{title}</p>
        <p className="text-sm text-[#6B6F7A]">{detail}</p>
      </div>
      {meta ? <span className="text-sm font-semibold text-[#07080B]">{meta}</span> : null}
      {onOpen ? <span aria-hidden className="text-[#6B6F7A]">›</span> : null}
    </>
  );
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[#F1EFE9] py-4 first:border-t-0">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {body}
        </button>
      ) : (
        body
      )}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="h-10 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export function Timeline({
  items,
}: {
  items: Array<{ id: string; label: string; at: string }>;
}) {
  return (
    <ol className="mt-4 space-y-1">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-2">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6E5BFF]" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-[#07080B]">{item.label}</p>
            <p className="text-sm text-[#6B6F7A]">{formatActivityDate(item.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-[26px] bg-white px-6 py-8">
      <p className="text-lg font-extrabold text-[#07080B]">{title}</p>
      <p className="mt-2 text-sm text-[#6B6F7A]">{detail}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="mt-6 space-y-4" aria-hidden>
      <div className="grid gap-3 min-[1100px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-[26px] bg-white" />
        ))}
      </div>
      <div className="grid gap-4 min-[1100px]:grid-cols-[1.4fr_1fr]">
        <div className="h-64 rounded-[26px] bg-[#ECE9E1]" />
        <div className="h-64 rounded-[26px] bg-white" />
      </div>
    </div>
  );
}

export function GapBar({ score, target, color }: { score: number; target: number; color: string }) {
  const fill = Math.max(0, Math.min(100, (score / 15) * 100));
  const mark = Math.max(0, Math.min(100, (target / 15) * 100));
  return (
    <div className="relative h-2.5 rounded-full bg-[#ECE9E1]" aria-hidden>
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${fill}%`, background: color }} />
      <span
        className="absolute top-1/2 h-4 w-[3px] -translate-y-1/2 bg-[#07080B]"
        style={{ left: `calc(${mark}% - 1.5px)` }}
      />
    </div>
  );
}

export function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
