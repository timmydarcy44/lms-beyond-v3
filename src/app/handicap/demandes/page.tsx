import { redirect } from "next/navigation";
import { HandicapPersonCard } from "@/components/handicap/handicap-person-card";
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
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-extrabold">Demandes</h1>
        <p className="text-sm" style={{ color: T.muted }}>
          {demandes.length} demande{demandes.length > 1 ? "s" : ""} en attente · contact sous 72 h
        </p>
      </div>

      {demandes.length === 0 ? (
        <p
          className="rounded-[24px] border px-5 py-10 text-sm"
          style={{ background: T.card, borderColor: T.border, color: T.muted }}
        >
          Aucune nouvelle demande pour le moment.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {demandes.map((p) => (
            <HandicapPersonCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}
