import { redirect } from "next/navigation";
import { loadHandicapHomeData } from "@/lib/handicap/home-data";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapRendezVousPage() {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const service = getServiceRoleClient();
  if (!service) {
    return <p className="text-sm text-[#9AA3BD]">Service indisponible.</p>;
  }

  const data = await loadHandicapHomeData(service, gate.firstName || "Référente");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-extrabold">Rendez-vous</h1>
        <p className="text-sm" style={{ color: T.muted }}>
          {data.upcomingMeetings.length} à venir
        </p>
      </div>
      {data.upcomingMeetings.length === 0 ? (
        <p
          className="rounded-[24px] border px-5 py-8 text-sm"
          style={{ background: T.card, borderColor: T.border, color: T.muted }}
        >
          Aucun rendez-vous planifié.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.upcomingMeetings.map((m) => {
            const d = new Date(m.scheduledAt);
            return (
              <li key={m.id}>
                <a
                  href={`/handicap/personnes/${m.caseId}`}
                  className="flex items-center gap-4 rounded-[20px] border px-4 py-3"
                  style={{ background: T.card, borderColor: T.border, color: T.text }}
                >
                  <div
                    className="grid h-[52px] w-12 place-items-center rounded-xl text-center text-[11px] font-bold leading-tight"
                    style={{
                      background: m.isToday ? T.accent : T.inner,
                      color: m.isToday ? T.bg : T.muted,
                    }}
                  >
                    <span>
                      {d.toLocaleDateString("fr-FR", { day: "2-digit" })}
                      <br />
                      {d.toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{m.personName}</p>
                    <p className="text-xs" style={{ color: T.muted }}>
                      {d.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {m.title}
                      {m.mode ? ` · ${m.mode}` : ""}
                    </p>
                  </div>
                  <span style={{ color: T.muted }}>›</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
