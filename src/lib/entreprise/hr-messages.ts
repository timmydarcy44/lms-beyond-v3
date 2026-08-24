import { randomUUID } from "crypto";

export type HrMessageSenderRole = "rh" | "employee";

export type EntrepriseHrMessage = {
  id: string;
  org_id: string;
  employee_id: string;
  employee_name: string | null;
  employee_job_title: string | null;
  sender_role: HrMessageSenderRole;
  sender_user_id: string | null;
  content: string;
  created_at: string;
};

export type EntrepriseHrThread = {
  employee_id: string;
  employee_name: string;
  employee_job_title: string | null;
  last_message: string | null;
  last_at: string | null;
  unread_from_employee: number;
};

/** Fallback mémoire si la table n'est pas encore migrée (démo / local). */
const memoryByOrg = new Map<string, EntrepriseHrMessage[]>();

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

export function getEdgebsDemoSeedMessages(orgId: string): EntrepriseHrMessage[] {
  return [
    {
      id: randomUUID(),
      org_id: orgId,
      employee_id: "edgebs-demo-alex",
      employee_name: "Alex Martin",
      employee_job_title: "Account Manager",
      sender_role: "employee",
      sender_user_id: null,
      content: "Bonjour, est-ce que je peux décaler mon entretien annuel à jeudi ?",
      created_at: hoursAgo(26),
    },
    {
      id: randomUUID(),
      org_id: orgId,
      employee_id: "edgebs-demo-alex",
      employee_name: "Alex Martin",
      employee_job_title: "Account Manager",
      sender_role: "rh",
      sender_user_id: null,
      content: "Oui, jeudi 10h30 te convient ?",
      created_at: hoursAgo(25),
    },
    {
      id: randomUUID(),
      org_id: orgId,
      employee_id: "edgebs-demo-alex",
      employee_name: "Alex Martin",
      employee_job_title: "Account Manager",
      sender_role: "employee",
      sender_user_id: null,
      content: "Parfait, merci !",
      created_at: hoursAgo(24),
    },
    {
      id: randomUUID(),
      org_id: orgId,
      employee_id: "edgebs-demo-julie",
      employee_name: "Julie Morel",
      employee_job_title: "L&D",
      sender_role: "employee",
      sender_user_id: null,
      content: "Petite question rapide : le parcours Communication est-il ouvert aux nouveaux ?",
      created_at: hoursAgo(5),
    },
    {
      id: randomUUID(),
      org_id: orgId,
      employee_id: "edgebs-demo-sarah",
      employee_name: "Sarah Petit",
      employee_job_title: "Marketing",
      sender_role: "rh",
      sender_user_id: null,
      content: "Sarah, peux-tu valider tes disponibilités pour la formation IA de mars ?",
      created_at: hoursAgo(3),
    },
    {
      id: randomUUID(),
      org_id: orgId,
      employee_id: "edgebs-demo-sarah",
      employee_name: "Sarah Petit",
      employee_job_title: "Marketing",
      sender_role: "employee",
      sender_user_id: null,
      content: "Oui, semaines 12 et 13 OK pour moi.",
      created_at: hoursAgo(2),
    },
  ];
}

export function listMemoryMessages(orgId: string): EntrepriseHrMessage[] {
  return [...(memoryByOrg.get(orgId) ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export function ensureMemorySeed(orgId: string, seed: EntrepriseHrMessage[]) {
  if (!memoryByOrg.has(orgId) || (memoryByOrg.get(orgId)?.length ?? 0) === 0) {
    memoryByOrg.set(orgId, [...seed]);
  }
}

export function appendMemoryMessage(message: EntrepriseHrMessage) {
  const list = memoryByOrg.get(message.org_id) ?? [];
  memoryByOrg.set(message.org_id, [...list, message]);
}

export function buildThreadsFromMessages(
  messages: EntrepriseHrMessage[],
  employees: Array<{
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    job_title?: string | null;
  }>,
): EntrepriseHrThread[] {
  const byEmployee = new Map<string, EntrepriseHrMessage[]>();
  for (const msg of messages) {
    const list = byEmployee.get(msg.employee_id) ?? [];
    list.push(msg);
    byEmployee.set(msg.employee_id, list);
  }

  const threads: EntrepriseHrThread[] = employees.map((emp) => {
    const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() || "Collaborateur";
    const msgs = byEmployee.get(emp.id) ?? [];
    const last = msgs[msgs.length - 1] ?? null;
    return {
      employee_id: emp.id,
      employee_name: last?.employee_name?.trim() || name,
      employee_job_title: emp.job_title ?? last?.employee_job_title ?? null,
      last_message: last?.content ?? null,
      last_at: last?.created_at ?? null,
      unread_from_employee: msgs.filter((m) => m.sender_role === "employee").length > 0 && last?.sender_role === "employee" ? 1 : 0,
    };
  });

  return threads.sort((a, b) => {
    const ta = a.last_at ? new Date(a.last_at).getTime() : 0;
    const tb = b.last_at ? new Date(b.last_at).getTime() : 0;
    return tb - ta;
  });
}
