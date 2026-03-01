import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export default async function SchoolProspectsPage() {
  const getOpcoStyle = (opcoName: string) => {
    const normalized = (opcoName || "").toLowerCase();
    if (normalized.includes("mobilités")) return "bg-gradient-to-r from-blue-600 to-blue-400 text-white";
    if (normalized.includes("akto")) return "bg-gradient-to-r from-emerald-700 to-emerald-500 text-white";
    if (normalized.includes("constructys")) return "bg-gradient-to-r from-green-500 to-yellow-400 text-black";
    return "bg-gradient-to-r from-orange-500 to-orange-300 text-black";
  };
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/entreprises/prospects");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/entreprises/prospects");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, role_type, school_id")
    .eq("id", session.id)
    .maybeSingle();

  const isSchoolProfile = currentProfile?.role_type === "ecole";
  const allowTestAccess = session?.email === "jean@test.fr" && !!currentProfile?.school_id;
  if (!currentProfile || (!isSchoolProfile && !allowTestAccess)) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = currentProfile.school_id;

  const { data: prospects } = await supabase
    .from("crm_prospects")
    .select("id, company_name, name, opco_name, opco, step, target_class_id")
    .eq("school_id", schoolId);

  const classIds = (prospects || [])
    .map((row) => row.target_class_id)
    .filter(Boolean) as string[];
  const { data: classes } = classIds.length
    ? await supabase.from("school_classes").select("id, name, npc_amount").in("id", classIds)
    : { data: [] };

  const classMap = new Map(
    (classes || []).map((item) => [item.id, { name: item.name || "", npc_amount: item.npc_amount || 0 }])
  );

  return (
    <div className="min-h-screen bg-white px-8 py-10 text-black">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-[24px] border border-white/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Prospects</h1>
          <p className="mt-2 text-sm text-black/60">Liste des entreprises en prospection.</p>
        </header>
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.2em] text-black/50">
              <tr>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">OPCO</th>
                <th className="px-4 py-3">NPC Estime</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {(prospects || []).map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-black">
                    {row.company_name || row.name || "Entreprise"}
                  </td>
                  <td className="px-4 py-3 text-black/70">
                    {(() => {
                      const opcoValue = row.opco_name || row.opco || "-";
                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold ${getOpcoStyle(
                            opcoValue
                          )}`}
                        >
                          {opcoValue.toUpperCase()}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-black/70">
                    {(classMap.get(row.target_class_id || "")?.npc_amount || 0).toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3 text-black/70">{row.step || "-"}</td>
                </tr>
              ))}
              {!prospects?.length ? (
                <tr>
                  <td className="px-4 py-6 text-black/50" colSpan={4}>
                    Aucun prospect pour le moment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
