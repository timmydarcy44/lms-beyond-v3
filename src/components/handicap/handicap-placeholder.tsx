import { HANDICAP_THEME as T } from "@/lib/handicap/theme";

export function HandicapPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div
      className="rounded-[24px] border p-8"
      style={{ background: T.card, borderColor: T.border }}
    >
      <h1 className="text-[24px] font-extrabold" style={{ color: T.text }}>
        {title}
      </h1>
      <p className="mt-2 text-sm" style={{ color: T.muted }}>
        {hint}
      </p>
    </div>
  );
}
