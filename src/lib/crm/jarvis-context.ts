import { getServiceRoleClient } from "@/lib/supabase/server";
import { getCrmUsers } from "@/lib/queries/super-admin";
import { formatCrmRoleLabel } from "@/lib/crm/crm-shared";

export type JarvisSuperContext = {
  generatedAt: string;
  organizations: Array<{ id: string; name: string; slug: string | null; memberCount: number }>;
  usersByRole: Record<string, number>;
  usersSample: Array<{ email: string; role: string; roleLabel: string; organizations: string }>;
  totals: {
    profiles: number;
    orgMemberships: number;
    instructorsFromMemberships: number;
    instructorsFromProfiles: number;
    formateursTotal: number;
    learners: number;
    tutors: number;
    admins: number;
    btoc: number;
  };
  pipeline: { btobDeals: number; btocDeals: number } | null;
};

export async function getJarvisSuperContext(): Promise<JarvisSuperContext> {
  const users = await getCrmUsers();
  const supabase = getServiceRoleClient();

  const usersByRole: Record<string, number> = {};
  for (const u of users) {
    usersByRole[u.role] = (usersByRole[u.role] ?? 0) + 1;
  }

  const instructorsFromProfiles = users.filter((u) => u.role === "instructor").length;
  const formateursTotal = users.filter(
    (u) => u.role === "instructor" || u.role === "instructor_assistant",
  ).length;

  let organizations: JarvisSuperContext["organizations"] = [];
  let pipeline: JarvisSuperContext["pipeline"] = null;

  if (supabase) {
    const { data: orgs } = await supabase.from("organizations").select("id, name, slug");
    const { data: memberships } = await supabase.from("org_memberships").select("org_id, role");

    const memberCount = new Map<string, number>();
    const instructorMembershipCount = { count: 0 };
    for (const m of memberships ?? []) {
      memberCount.set(m.org_id, (memberCount.get(m.org_id) ?? 0) + 1);
      if (m.role === "instructor") instructorMembershipCount.count += 1;
    }

    organizations = (orgs ?? []).map((o) => ({
      id: o.id,
      name: o.name ?? "—",
      slug: o.slug ?? null,
      memberCount: memberCount.get(o.id) ?? 0,
    }));

    const [{ count: btob }, { count: btoc }] = await Promise.all([
      supabase
        .from("crm_pipeline_deals")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_type", "btob"),
      supabase
        .from("crm_pipeline_deals")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_type", "btoc"),
    ]);

    pipeline = { btobDeals: btob ?? 0, btocDeals: btoc ?? 0 };

    return {
      generatedAt: new Date().toISOString(),
      organizations,
      usersByRole,
      usersSample: users.slice(0, 40).map((u) => ({
        email: u.email,
        role: u.role,
        roleLabel: formatCrmRoleLabel(u.role),
        organizations: u.organizations.map((o) => o.name).join(", ") || "—",
      })),
      totals: {
        profiles: users.length,
        orgMemberships: memberships?.length ?? 0,
        instructorsFromMemberships: instructorMembershipCount.count,
        instructorsFromProfiles,
        formateursTotal,
        learners: usersByRole.learner ?? usersByRole.student ?? 0,
        tutors: usersByRole.tutor ?? 0,
        admins: usersByRole.admin ?? 0,
        btoc: usersByRole.btoc ?? usersByRole.PARTICULIER ?? 0,
      },
      pipeline,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    organizations: [],
    usersByRole,
    usersSample: users.slice(0, 40).map((u) => ({
      email: u.email,
      role: u.role,
      roleLabel: formatCrmRoleLabel(u.role),
      organizations: u.organizations.map((o) => o.name).join(", ") || "—",
    })),
    totals: {
      profiles: users.length,
      orgMemberships: 0,
      instructorsFromMemberships: 0,
      instructorsFromProfiles,
      formateursTotal,
      learners: usersByRole.learner ?? 0,
      tutors: usersByRole.tutor ?? 0,
      admins: usersByRole.admin ?? 0,
      btoc: usersByRole.btoc ?? 0,
    },
    pipeline: null,
  };
}
