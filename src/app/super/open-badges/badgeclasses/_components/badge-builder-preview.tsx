"use client";

import { BadgeCard3D } from "@/components/openbadges/badge-card-3d";

type Props = {
  name: string;
  description: string;
  level: number | null;
  imageUrl: string;
  typeLabel: string;
  validityLabel: string;
  criteriaCount: number;
  skills: string[];
  methodsLabel: string;
  expertName: string;
  issuerName: string;
  mode: "card" | "page";
  onMode: (mode: "card" | "page") => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-[#8C94B2]">{label}</span>
      <span className="text-right text-[#EEF0F7]">{value}</span>
    </div>
  );
}

export function BadgeBuilderPreview({
  name,
  description,
  level,
  imageUrl,
  typeLabel,
  validityLabel,
  criteriaCount,
  skills,
  methodsLabel,
  expertName,
  issuerName,
  mode,
  onMode,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[#A9B0CC]">Aperçu en direct</p>
        <div className="flex rounded-full border border-[#26304F] bg-[#0B1122] p-1">
          {(["card", "page"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMode(item)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                mode === item ? "bg-[#EEF0F7] text-[#0A0F1E]" : "text-[#A9B0CC]"
              }`}
            >
              {item === "card" ? "Carte" : "Page publique"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-4">
        {mode === "card" ? (
          <BadgeCard3D
            compact
            name={name.trim() || "Nom du badge"}
            recipientName="Prénom Nom"
            issuedLabel="JJ.MM.AAAA"
            level={level}
            imageUrl={imageUrl || null}
          />
        ) : (
          <div className="space-y-3 px-2 py-4">
            <p className="text-xs text-[#8C94B2]">Sur la page publique</p>
            <h3 className="text-xl font-semibold text-[#EEF0F7]">{name.trim() || "Nom du badge"}</h3>
            <p className="text-sm leading-relaxed text-[#A9B0CC]">
              {description.trim() || "Ce que le badge atteste apparaîtra ici."}
            </p>
            <p className="text-sm text-[#8C94B2]">
              {level ? `Niveau ${level}` : "Niveau"} · {criteriaCount} critère{criteriaCount > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[28px] border border-[#1A2340] bg-[#111831] px-5 py-3">
        <Row label="Type" value={`${typeLabel} · ${validityLabel}`} />
        <Row label="Critères" value={String(criteriaCount)} />
        <Row label="Compétences" value={skills.length ? skills.join(", ") : "—"} />
        <Row label="Épreuve" value={methodsLabel || "—"} />
        <Row label="Validé par" value={expertName || "—"} />
        <Row label="Émetteur" value={issuerName || "Byound"} />
      </div>
    </aside>
  );
}
