import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JournalEntreprisePage() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok || !("organizationId" in access)) {
    return <main className="p-8">Le journal est réservé à l'administrateur du compte.</main>;
  }
  const db = getServiceRoleClient();
  const activity = db
    ? await db.from("org_activity").select("id, actor_type, action, payload, created_at").eq("org_id", access.organizationId).order("created_at", { ascending: false }).limit(50)
    : { data: [], error: null };
  const rows = activity.error ? [] : activity.data ?? [];
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-extrabold">Journal</h1>
      <p className="mt-2 text-sm text-neutral-600">Les interventions de Byound dans votre espace apparaissent ici, avec leur motif.</p>
      <ul className="mt-6 space-y-3">
        {rows.length === 0 ? <li className="text-sm text-neutral-500">Aucune intervention enregistrée.</li> : null}
        {rows.map((row) => {
          const payload = (row.payload ?? {}) as { reasonCode?: string; reasonText?: string };
          return (
            <li key={row.id} className="rounded-2xl border border-neutral-200 p-4">
              <p className="font-semibold">{row.actor_type === "byound_on_behalf" ? "Byound" : "Votre équipe"} · {row.action}</p>
              <p className="text-sm text-neutral-600">{new Date(row.created_at).toLocaleString("fr-FR")}</p>
              {payload.reasonText ? <p className="mt-2 text-sm">{payload.reasonText}</p> : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
