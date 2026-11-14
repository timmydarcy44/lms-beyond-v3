import Link from "next/link";
import { redirect } from "next/navigation";
import { loadHandicapHomeData } from "@/lib/handicap/home-data";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapDemandesPage() {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const service = getServiceRoleClient();
  if (!service) {
    return <p className="text-sm text-[#9AA3BD]">Service indisponible.</p>;
  }

  const data = await loadHandicapHomeData(service, gate.firstName || "Référente");
  const demandes = data.people.filter((p) => p.status === "request");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-extrabold">Demandes</h1>
        <p className="text-sm" style={{ color: T.muted }}>
          {demandes.length} demande{demandes.length > 1 ? "s" : ""} en attente · contact sous 72 h
        </p>
      </div>

      {demandes.length === 0 ? (
        <p
          className="rounded-[24px] border px-5 py-8 text-sm"
          style={{ background: T.card, borderColor: T.border, color: T.muted }}
        >
          Aucune nouvelle demande pour le moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {demandes.map((p) => (
            <li key={p.id}>
              <Link
                href={`/handicap/personnes/${p.id}`}
                className="flex items-center justify-between rounded-[20px] border px-4 py-3"
                style={{ background: T.card, borderColor: T.border, color: T.text }}
              >
                <div>
                  <p className="font-bold">{p.personName}</p>
                  <p className="text-xs" style={{ color: T.muted }}>
                    {p.roleLine}
                    {p.accommodations[0] ? ` · ${p.accommodations[0]}` : ""}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: "rgba(242,207,107,0.15)", color: T.amber }}
                >
                  Prendre contact ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
