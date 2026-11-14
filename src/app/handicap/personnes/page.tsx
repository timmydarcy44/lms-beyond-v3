import { redirect } from "next/navigation";
import { HandicapPlaceholder } from "@/components/handicap/handicap-placeholder";
import { loadHandicapHomeData } from "@/lib/handicap/home-data";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapPersonnesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nouveau?: string }>;
}) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");
  const sp = await searchParams;
  const service = getServiceRoleClient();
  if (!service) return <HandicapPlaceholder title="Personnes" hint="Service indisponible." />;

  const data = await loadHandicapHomeData(service, gate.firstName || "Référente");
  const q = String(sp.q ?? "").trim().toLowerCase();
  const people = q
    ? data.people.filter(
        (p) =>
          p.personName.toLowerCase().includes(q) || p.roleLine.toLowerCase().includes(q),
      )
    : data.people;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold" style={{ color: T.text }}>
            Personnes accompagnées
          </h1>
          <p className="text-sm" style={{ color: T.muted }}>
            {people.length} dossier{people.length > 1 ? "s" : ""}
            {q ? ` · recherche « ${q} »` : ""}
          </p>
        </div>
        {sp.nouveau ? (
          <p className="text-sm" style={{ color: T.amber }}>
            Création d&apos;accompagnement : à venir (Lot 4)
          </p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id}>
            <a
              href={`/handicap/personnes/${p.id}`}
              className="flex items-center justify-between rounded-[20px] border px-4 py-3"
              style={{ background: T.card, borderColor: T.border, color: T.text }}
            >
              <div>
                <p className="font-bold">{p.personName}</p>
                <p className="text-xs" style={{ color: T.muted }}>
                  {p.roleLine} · {p.statusLabel}
                </p>
              </div>
              <span style={{ color: T.muted }}>›</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
