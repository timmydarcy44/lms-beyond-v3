import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import type { PraticienBct } from "@/lib/marketplace/types";

type CardPraticien = Pick<
  PraticienBct,
  | "id"
  | "prenom"
  | "nom"
  | "photo_url"
  | "titre"
  | "specialites"
  | "tarif_session"
  | "duree_session"
  | "note_moyenne"
  | "nombre_avis"
>;

export function PraticienCard({ praticien }: { praticien: CardPraticien }) {
  const note = Number(praticien.note_moyenne ?? 0);
  const stars = note > 0 ? "★".repeat(Math.round(note)) + "☆".repeat(5 - Math.round(note)) : "—";

  return (
    <Link
      href={`/dashboard/entreprise/marketplace/${praticien.id}`}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-700">
          {praticien.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={praticien.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            "📷"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">
            {praticien.prenom} {praticien.nom}
          </h3>
          <p className="text-sm text-slate-600">{praticien.titre ?? "Psychopédagogue"}</p>
          <p className="mt-1 text-xs text-amber-600">
            {stars} {note > 0 ? note.toFixed(1) : ""} ({praticien.nombre_avis} avis)
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs text-slate-500">
        {(praticien.specialites ?? []).slice(0, 4).join(" · ") || "Accompagnement cognitif"}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">
          {formatEurosFromCents(praticien.tarif_session)} / {praticien.duree_session} min
        </span>
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">✅ BCT Certifié</Badge>
      </div>
      <span className="mt-4 text-sm font-medium text-violet-700">Voir le profil →</span>
    </Link>
  );
}
