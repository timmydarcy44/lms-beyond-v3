import type { ReactNode } from "react";
import "./callout.css";

export type CalloutVariant = "definition" | "example" | "key";

const CALLOUTS: Record<CalloutVariant, { label: string; glyph: string }> = {
  definition: { label: "Définition", glyph: "Aa" },
  example: { label: "Exemple concret", glyph: "◎" },
  key: { label: "À retenir", glyph: "★" },
};

export function Callout({ variant, children }: { variant: CalloutVariant; children: ReactNode }) {
  const callout = CALLOUTS[variant];
  return (
    <aside className={`lms-callout lms-callout--${variant}`} aria-label={callout.label}>
      <div className="lms-callout__head">
        <span className="lms-callout__badge" aria-hidden>
          {callout.glyph}
        </span>
        <span className="lms-callout__label">{callout.label}</span>
      </div>
      <div className="lms-callout__text">{children}</div>
    </aside>
  );
}
