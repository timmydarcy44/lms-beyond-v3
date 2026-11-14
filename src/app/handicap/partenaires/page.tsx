import Link from "next/link";
import { HANDICAP_PARTNERS, HANDICAP_PARTNERS_META } from "@/lib/handicap/partners-directory";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";

export default function HandicapPartenairesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-extrabold" style={{ color: T.text }}>
          Partenaires
        </h1>
        <p className="text-sm" style={{ color: T.muted }}>
          {HANDICAP_PARTNERS_META.reference} · dernière MAJ {HANDICAP_PARTNERS_META.lastUpdatedLabel}
        </p>
      </div>
      <ul className="space-y-2">
        {HANDICAP_PARTNERS.map((p) => (
          <li
            key={p.id}
            className="rounded-[20px] border px-4 py-3"
            style={{ background: T.card, borderColor: T.border }}
          >
            <p className="font-bold" style={{ color: T.text }}>
              {p.name}
            </p>
            <p className="mt-1 text-sm" style={{ color: T.muted }}>
              {p.role}
            </p>
          </li>
        ))}
      </ul>
      <Link href={HANDICAP_PARTNERS_META.pdfPath} className="text-sm font-semibold" style={{ color: T.accent }}>
        Télécharger AN-HAN-01 (PDF)
      </Link>
    </div>
  );
}
