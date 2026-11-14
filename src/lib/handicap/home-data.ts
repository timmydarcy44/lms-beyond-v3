import type { SupabaseClient } from "@supabase/supabase-js";
import { handicapPath } from "@/lib/handicap/paths";
import { STATUS_LABELS } from "@/lib/handicap/theme";

export type HandicapTodo = {
  id: string;
  tone: "amber" | "teal" | "red" | "blue";
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

export type HandicapHomeMeeting = {
  id: string;
  caseId: string;
  personName: string;
  title: string;
  scheduledAt: string;
  mode: string | null;
  isToday: boolean;
};

export type HandicapHomePerson = {
  id: string;
  personName: string;
  roleLine: string;
  status: string;
  statusLabel: string;
  accommodations: string[];
  nextStep: { text: string; tone: "green" | "amber" | "red" | "blue" | "muted" };
};

export type HandicapHomePayload = {
  firstName: string;
  counts: {
    accompanied: number;
    requests: number;
    meetingsToday: number;
    upcomingMeetings: number;
    plansFormalized: number;
    casesOutsideRequests: number;
    partnersDistinct: number;
    inProgress: number;
    plansActive: number;
    closed: number;
  };
  todos: HandicapTodo[];
  upcomingMeetings: HandicapHomeMeeting[];
  people: HandicapHomePerson[];
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export async function loadHandicapHomeData(
  service: SupabaseClient,
  firstName: string,
): Promise<HandicapHomePayload> {
  const { data: cases } = await service
    .from("disability_cases")
    .select(
      "id, status, scope, employee_id, cfa_application_id, person_profile_id, organization_id, rqth_valid_until, created_at, closed_at",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  const caseRows = cases ?? [];
  const caseIds = caseRows.map((c) => String(c.id));

  const [{ data: accommodations }, { data: meetings }, { data: actions }, { data: partners }] =
    await Promise.all([
      caseIds.length
        ? service
            .from("disability_accommodations")
            .select("id, case_id, label, shared_with_trainer_at")
            .in("case_id", caseIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      caseIds.length
        ? service
            .from("disability_meetings")
            .select("id, case_id, title, scheduled_at, mode, status")
            .in("case_id", caseIds)
            .order("scheduled_at", { ascending: true })
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      caseIds.length
        ? service
            .from("disability_actions")
            .select("id, case_id, label, due_date, status")
            .in("case_id", caseIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      caseIds.length
        ? service.from("disability_partners").select("case_id, partner").in("case_id", caseIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ]);

  const employeeIds = caseRows.map((c) => c.employee_id).filter(Boolean) as string[];
  const profileIds = caseRows.map((c) => c.person_profile_id).filter(Boolean) as string[];
  const cfaIds = caseRows.map((c) => c.cfa_application_id).filter(Boolean) as string[];

  const [{ data: employees }, { data: profiles }, { data: cfaApps }] = await Promise.all([
    employeeIds.length
      ? service
          .from("employees")
          .select("id, first_name, last_name, job_title, company_id")
          .in("id", employeeIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    profileIds.length
      ? service
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", profileIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    cfaIds.length
      ? service
          .from("cfa_applications")
          .select("id, first_name, last_name")
          .in("id", cfaIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const empById = new Map((employees ?? []).map((e) => [String(e.id), e]));
  const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));
  const cfaById = new Map((cfaApps ?? []).map((c) => [String(c.id), c]));

  const orgIds = Array.from(
    new Set(
      [
        ...caseRows.map((c) => c.organization_id).filter(Boolean),
        ...(employees ?? []).map((e) => e.company_id).filter(Boolean),
      ].map(String),
    ),
  );
  const { data: orgs } = orgIds.length
    ? await service.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] as Array<Record<string, unknown>> };
  const orgById = new Map((orgs ?? []).map((o) => [String(o.id), String(o.name ?? "")]));

  function personName(c: (typeof caseRows)[number]): string {
    if (c.employee_id) {
      const e = empById.get(String(c.employee_id));
      if (e) {
        return (
          [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || "Collaborateur"
        );
      }
    }
    if (c.cfa_application_id) {
      const a = cfaById.get(String(c.cfa_application_id));
      if (a) {
        return [a.first_name, a.last_name].filter(Boolean).join(" ").trim() || "Apprenant";
      }
    }
    if (c.person_profile_id) {
      const p = profileById.get(String(c.person_profile_id));
      if (p) {
        return (
          String(p.full_name ?? "").trim() ||
          [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
          "Personne"
        );
      }
    }
    return "Personne";
  }

  function roleLine(c: (typeof caseRows)[number]): string {
    const emp = c.employee_id ? empById.get(String(c.employee_id)) : null;
    const orgName =
      (c.organization_id && orgById.get(String(c.organization_id))) ||
      (emp?.company_id && orgById.get(String(emp.company_id))) ||
      null;
    if (c.scope === "school" || c.cfa_application_id) {
      return ["Alternant", orgName || "Byound School"].filter(Boolean).join(" · ");
    }
    return ["Salarié", orgName || "Entreprise", "Business"].filter(Boolean).join(" · ");
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in45 = new Date(now);
  in45.setDate(in45.getDate() + 45);

  const accByCase = new Map<string, Array<{ label: string; shared: boolean }>>();
  for (const a of accommodations ?? []) {
    const cid = String(a.case_id);
    const list = accByCase.get(cid) ?? [];
    list.push({
      label: String(a.label ?? ""),
      shared: Boolean(a.shared_with_trainer_at),
    });
    accByCase.set(cid, list);
  }

  const meetingsList = (meetings ?? [])
    .filter((m) => m.scheduled_at)
    .map((m) => ({
      id: String(m.id),
      caseId: String(m.case_id),
      title: String(m.title ?? "Rendez-vous"),
      scheduledAt: String(m.scheduled_at),
      mode: m.mode ? String(m.mode) : null,
      status: String(m.status ?? "open"),
    }));

  const meetingsToday = meetingsList.filter((m) => {
    const d = new Date(m.scheduledAt);
    return d >= todayStart && d <= todayEnd;
  });

  const upcomingMeetings: HandicapHomeMeeting[] = meetingsList
    .filter((m) => new Date(m.scheduledAt) >= todayStart && m.status !== "closed")
    .slice(0, 40)
    .map((m) => {
      const c = caseRows.find((x) => String(x.id) === m.caseId);
      return {
        id: m.id,
        caseId: m.caseId,
        personName: c ? personName(c) : "Personne",
        title: m.title,
        scheduledAt: m.scheduledAt,
        mode: m.mode,
        isToday: isSameDay(new Date(m.scheduledAt), now),
      };
    });

  const todos: HandicapTodo[] = [];

  for (const c of caseRows.filter((x) => x.status === "request")) {
    todos.push({
      id: `req-${c.id}`,
      tone: "amber",
      tag: "Nouvelle demande",
      title: `${personName(c)} a demandé un aménagement`,
      subtitle: "À prendre en charge",
      cta: "Prendre contact",
      href: handicapPath(`/personnes/${c.id}`),
    });
  }

  for (const m of meetingsToday) {
    const c = caseRows.find((x) => String(x.id) === m.caseId);
    const hour = new Date(m.scheduledAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    todos.push({
      id: `meet-${m.id}`,
      tone: "teal",
      tag: `Aujourd'hui · ${hour}`,
      title: `Rendez-vous avec ${c ? personName(c) : "la personne"}`,
      subtitle: m.title,
      cta: "Ouvrir le dossier",
      href: handicapPath(`/personnes/${m.caseId}`),
    });
  }

  for (const a of actions ?? []) {
    if (a.status === "done" || !a.due_date) continue;
    const due = new Date(String(a.due_date));
    if (due >= todayStart) continue;
    const c = caseRows.find((x) => String(x.id) === String(a.case_id));
    const days = Math.max(1, Math.floor((todayStart.getTime() - due.getTime()) / 86400000));
    todos.push({
      id: `act-${a.id}`,
      tone: "red",
      tag: `Échéance dépassée de ${days} j`,
      title: String(a.label ?? "Action en retard"),
      subtitle: c ? personName(c) : "Dossier",
      cta: "Ouvrir",
      href: handicapPath(`/personnes/${a.case_id}`),
    });
  }

  for (const c of caseRows) {
    if (!c.rqth_valid_until) continue;
    const until = new Date(String(c.rqth_valid_until));
    if (until > in45 || until < todayStart) continue;
    const days = Math.ceil((until.getTime() - now.getTime()) / 86400000);
    todos.push({
      id: `rqth-${c.id}`,
      tone: "blue",
      tag: `Dans ${days} jours`,
      title: "Justificatif RQTH à renouveler",
      subtitle: personName(c),
      cta: "Prévenir",
      href: handicapPath(`/personnes/${c.id}`),
    });
  }

  for (const c of caseRows) {
    if (c.status === "closed" || c.status === "request") continue;
    const list = accByCase.get(String(c.id)) ?? [];
    const unshared = list.filter((x) => !x.shared);
    if (!unshared.length) continue;
    todos.push({
      id: `share-${c.id}`,
      tone: "red",
      tag: "Aménagements non transmis",
      title: "Transmettre les aménagements au formateur",
      subtitle: personName(c),
      cta: "Transmettre",
      href: handicapPath(`/personnes/${c.id}`),
    });
  }

  const toneOrder = { red: 0, amber: 1, teal: 2, blue: 3 } as const;
  todos.sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone]);

  const people: HandicapHomePerson[] = caseRows.map((c) => {
    const labels = (accByCase.get(String(c.id)) ?? []).map((x) => x.label).filter(Boolean);
    const meetToday = meetingsToday.find((m) => m.caseId === String(c.id));
    let nextStep: HandicapHomePerson["nextStep"] = {
      text: "Suivre le dossier",
      tone: "muted",
    };
    if (meetToday) {
      const hour = new Date(meetToday.scheduledAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      nextStep = { text: `RDV aujourd'hui ${hour}`, tone: "green" };
    } else if (c.status === "request") {
      nextStep = { text: "À contacter", tone: "amber" };
    } else if ((accByCase.get(String(c.id)) ?? []).some((x) => !x.shared)) {
      nextStep = { text: "Transmettre au formateur", tone: "red" };
    } else if (c.rqth_valid_until) {
      const until = new Date(String(c.rqth_valid_until));
      if (until <= in45 && until >= todayStart) {
        nextStep = { text: "Justificatif à renouveler", tone: "blue" };
      }
    } else if (c.status === "plan" || c.status === "interview") {
      nextStep = { text: "Valider le plan", tone: "muted" };
    }

    return {
      id: String(c.id),
      personName: personName(c),
      roleLine: roleLine(c),
      status: String(c.status),
      statusLabel: STATUS_LABELS[String(c.status)] ?? String(c.status),
      accommodations: labels,
      nextStep,
    };
  });

  const requests = caseRows.filter((c) => c.status === "request").length;
  const closed = caseRows.filter((c) => c.status === "closed").length;
  const plansActive = caseRows.filter((c) => c.status === "active" || c.status === "plan").length;
  const outsideRequests = caseRows.filter((c) => c.status !== "request").length;
  const plansFormalized = caseRows.filter(
    (c) => c.status === "active" || c.status === "plan" || c.status === "review",
  ).length;
  const partnerSet = new Set((partners ?? []).map((p) => `${p.case_id}:${p.partner}`));

  return {
    firstName: firstName || "Référente",
    counts: {
      accompanied: caseRows.filter((c) => c.status !== "closed").length,
      requests,
      meetingsToday: meetingsToday.length,
      upcomingMeetings: upcomingMeetings.length,
      plansFormalized,
      casesOutsideRequests: outsideRequests,
      partnersDistinct: partnerSet.size,
      inProgress: caseRows.filter((c) => c.status !== "closed" && c.status !== "request").length,
      plansActive,
      closed,
    },
    todos: todos.slice(0, 8),
    upcomingMeetings,
    people,
  };
}
