import type { ReactNode } from "react";

type Section = {
  id: string;
  label: string;
  content: ReactNode;
};

type Props = {
  sections: Section[];
  className?: string;
};

/** Sections empilées (sans onglets) — adapté à l'impression PDF. */
export function ProfileSectionStack({ sections, className = "" }: Props) {
  return (
    <div className={`space-y-8 ${className}`}>
      {sections.map((section) => (
        <section
          key={section.id}
          id={`profile-section-${section.id}`}
          className="break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-sm font-semibold text-[#0a0a0a]">{section.label}</h3>
          <div className="mt-4">{section.content}</div>
        </section>
      ))}
    </div>
  );
}
