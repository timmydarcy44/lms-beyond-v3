import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaCrmContacts, getJessicaCrmRevenueSummary } from "@/lib/queries/jessica-crm-contacts";
import { getJessicaCabinetYearRevenue } from "@/lib/queries/jessica-cabinet-patients";
import { getJessicaResources } from "@/lib/queries/jessica-resources";
import { JessicaCrmUsersList } from "@/components/jessica-contentin/crm/jessica-crm-users-list";
import { JessicaSuperPage, JessicaSuperButton, JessicaSuperStatCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { Plus, Users, Euro } from "lucide-react";

export const revalidate = 0;

export default async function JessicaCrmPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  const [contacts, resources, revenue, year2026] = await Promise.all([
    getJessicaCrmContacts().catch((e) => {
      console.error("[jessica-crm] contacts error:", e);
      return [];
    }),
    getJessicaResources(),
    getJessicaCrmRevenueSummary().catch((e) => {
      console.error("[jessica-crm] revenue error:", e);
      return {
        hourlyRate: 75,
        totalCabinetRevenue: 0,
        totalLmsRevenue: 0,
        totalRevenue: 0,
        monthly: [],
      };
    }),
    getJessicaCabinetYearRevenue(2026).catch((e) => {
      console.error("[jessica-crm] year revenue error:", e);
      return { revenue: 0, hours: 0, appointmentCount: 0 };
    }),
  ]);

  const withLms = contacts.filter((c) => c.contactKind !== "patient").length;
  const recentMonths = revenue.monthly.slice(-3);

  return (
    <JessicaSuperPage
      title="CRM — Clients"
      subtitle="Patients cabinet et comptes LMS — CA formations + consultations (75€/h)."
      actions={
        <JessicaSuperButton href="/super/jessica-crm/new">
          <Plus className="h-4 w-4" />
          Ajouter un client
        </JessicaSuperButton>
      }
    >
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <JessicaSuperStatCard label="Clients" value={contacts.length} icon={<Users className="h-5 w-5" />} />
        <JessicaSuperStatCard
          label="CA cabinet 2026"
          value={`${year2026.revenue.toFixed(0)}€`}
          accent
          icon={<Euro className="h-5 w-5" />}
          hint={
            year2026.appointmentCount > 0
              ? `${year2026.appointmentCount} RDV · ${year2026.hours.toFixed(1)}h`
              : "01/01 – 31/12/2026"
          }
        />
        <JessicaSuperStatCard
          label="CA cabinet (total)"
          value={`${revenue.totalCabinetRevenue.toFixed(0)}€`}
          icon={<Euro className="h-5 w-5" />}
          hint={`${revenue.hourlyRate}€/h`}
        />
        <JessicaSuperStatCard label="CA formations" value={`${revenue.totalLmsRevenue.toFixed(0)}€`} />
        <JessicaSuperStatCard
          label="CA total"
          value={`${revenue.totalRevenue.toFixed(0)}€`}
          accent
          hint={`${withLms} avec compte LMS`}
        />
      </div>

      {recentMonths.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {recentMonths.map((m) => (
            <JessicaSuperStatCard
              key={m.month}
              label={m.label}
              value={`${m.totalRevenue.toFixed(0)}€`}
              hint={
                <span>
                  Cabinet {m.cabinetRevenue.toFixed(0)}€ · Formations {m.lmsRevenue.toFixed(0)}€
                  {m.appointmentHours > 0 ? ` · ${m.appointmentHours.toFixed(1)}h` : ""}
                </span>
              }
            />
          ))}
        </div>
      )}

      <JessicaCrmUsersList initialUsers={contacts} availableResources={resources} />
    </JessicaSuperPage>
  );
}
