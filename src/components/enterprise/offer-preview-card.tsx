import { formatOfferPay } from "@/lib/entreprise/offer-conditions";
import type { OfferPoste } from "@/lib/entreprise/offer-poste";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "B";
}

export function OfferPreviewCard({
  draft,
  companyName,
  logoUrl,
}: {
  draft: OfferPoste;
  companyName: string;
  logoUrl?: string | null;
}) {
  const title = String(draft.title ?? "").trim() || "Sans titre";
  const city = String(draft.city ?? "").trim();
  const pay = formatOfferPay(draft.salary_min, draft.salary_max, draft.salary_period === "year" ? "year" : "month");
  const duration = String(draft.contract_duration ?? "").trim();
  const hours = typeof draft.hours_per_week === "number" && draft.hours_per_week > 0 ? `${draft.hours_per_week} h / semaine` : "";
  const chips = [draft.contract_type, draft.work_mode, pay, duration || hours].map((item) => String(item ?? "").trim()).filter(Boolean);
  const description = String(draft.description ?? "").trim();
  const name = companyName.trim() || "Votre entreprise";

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#070C1C] p-5 text-white">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#6E5BFF]/50" aria-hidden />
      <p className="relative text-sm text-white/70">Aperçu de l&apos;annonce</p>
      <div className="relative mt-5 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-extrabold text-[#07080B]">
          {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : initials(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-white/60">{[city, "publiée aujourd'hui"].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <p className="relative mt-5 text-2xl font-extrabold tracking-[-0.03em]">{title}</p>
      {chips.length ? (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {chips.map((chip, index) => (
            <span key={`${chip}-${index}`} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <p className={`relative mt-4 line-clamp-3 text-sm ${description ? "text-white/80" : "text-white/50"}`}>
        {description || "La description se complète à gauche."}
      </p>
      <button type="button" disabled className="relative mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#6E5BFF] text-sm font-semibold text-white">
        Postuler
      </button>
    </div>
  );
}
