import { getServiceRoleClient } from "@/lib/supabase/server";
import { isCareAudience } from "@/lib/control/care-audience";
import { splitFullName } from "@/lib/crm/crm-shared";

export type CareProspectRow = {
  id: string;
  email: string;
  name: string;
  source: "rdv" | "suivi" | "profil";
  phone: string | null;
  createdAt: string | null;
  coachName: string | null;
};

function displayName(first: string | null | undefined, last: string | null | undefined, email: string) {
  const name = [first, last].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ");
  return name || email.split("@")[0] || "Prospect";
}

export async function loadCareProspects(): Promise<CareProspectRow[]> {
  const service = getServiceRoleClient();
  if (!service) return [];

  const byEmail = new Map<string, CareProspectRow>();

  const upsert = (row: CareProspectRow, rank: number) => {
    const key = row.email.trim().toLowerCase();
    if (!key) return;
    const current = byEmail.get(key);
    const currentRank = current
      ? current.source === "rdv"
        ? 3
        : current.source === "suivi"
          ? 2
          : 1
      : 0;
    if (!current || rank >= currentRank) byEmail.set(key, row);
  };

  const [{ data: bookings }, { data: clients }, { data: experts }, roleProfiles, demoProfiles, anaisProfiles] =
    await Promise.all([
    service
      .from("care_bookings")
      .select("id, client_email, client_first_name, client_last_name, client_phone, created_at, expert_id")
      .order("created_at", { ascending: false })
      .limit(500),
    service
      .from("expert_care_clients")
      .select("id, email, first_name, last_name, phone, created_at, expert_id")
      .order("created_at", { ascending: false })
      .limit(500),
    service.from("experts").select("id, first_name, last_name, email"),
    service
      .from("profiles")
      .select("id, email, full_name, role, role_type")
      .or("role.in.(care_patient,patient,praticien,praticien_bct),role_type.in.(care_patient,patient,care)")
      .limit(500),
    service.from("profiles").select("id, email, full_name, role, role_type").ilike("email", "%care.demo%").limit(50),
    service.from("profiles").select("id, email, full_name, role, role_type").ilike("full_name", "%anais%").limit(50),
  ]);
  const profiles = [
    ...(roleProfiles.data ?? []),
    ...(demoProfiles.data ?? []),
    ...(anaisProfiles.data ?? []),
  ];

  const coachName = new Map<string, string>();
  for (const expert of experts ?? []) {
    const name = [expert.first_name, expert.last_name].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ");
    if (name) coachName.set(String(expert.id), name);
  }

  for (const row of bookings ?? []) {
    const email = String(row.client_email ?? "").trim();
    upsert(
      {
        id: String(row.id),
        email,
        name: displayName(row.client_first_name, row.client_last_name, email),
        source: "rdv",
        phone: row.client_phone ? String(row.client_phone) : null,
        createdAt: row.created_at ? String(row.created_at) : null,
        coachName: coachName.get(String(row.expert_id)) ?? null,
      },
      3,
    );
  }

  for (const row of clients ?? []) {
    const email = String(row.email ?? "").trim();
    upsert(
      {
        id: String(row.id),
        email,
        name: displayName(row.first_name, row.last_name, email),
        source: "suivi",
        phone: row.phone ? String(row.phone) : null,
        createdAt: row.created_at ? String(row.created_at) : null,
        coachName: coachName.get(String(row.expert_id)) ?? null,
      },
      2,
    );
  }

  for (const row of profiles ?? []) {
    const email = String(row.email ?? "").trim();
    const names = splitFullName(row.full_name ?? null);
    const person = {
      id: String(row.id),
      email,
      name: [names.firstName, names.lastName].filter((part) => part && part !== "—").join(" "),
      role: row.role,
      roleType: row.role_type,
    };
    if (!isCareAudience(person) && !isCareAudience({ email, name: person.name })) continue;
    upsert(
      {
        id: String(row.id),
        email,
        name: person.name || email.split("@")[0] || "Prospect",
        source: "profil",
        phone: null,
        createdAt: null,
        coachName: null,
      },
      1,
    );
  }

  return [...byEmail.values()].sort((a, b) => {
    const da = a.createdAt ? Date.parse(a.createdAt) : 0;
    const db = b.createdAt ? Date.parse(b.createdAt) : 0;
    return db - da;
  });
}
