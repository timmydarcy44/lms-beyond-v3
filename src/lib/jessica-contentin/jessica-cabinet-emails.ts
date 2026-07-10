import { sendEmail } from "@/lib/email/resend-client";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  fetchJessicaCalendarEvents,
  getParisDateTime,
  parisDayBounds,
  parisWeekBounds,
  summarizeCalendarEvents,
  type JessicaCalendarEvent,
} from "@/lib/jessica-contentin/jessica-calendar-events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function formatEventTime(startIso: string, endIso: string): string {
  try {
    const start = format(new Date(startIso), "HH:mm", { locale: fr });
    const end = format(new Date(endIso), "HH:mm", { locale: fr });
    return `${start} – ${end}`;
  } catch {
    return "—";
  }
}

function eventsListHtml(events: JessicaCalendarEvent[]): string {
  if (events.length === 0) {
    return "<p>Aucun rendez-vous prévu.</p>";
  }
  const items = events
    .map(
      (e) =>
        `<li style="margin-bottom:8px;"><strong>${formatEventTime(e.startIso, e.endIso)}</strong> — ${e.summary}</li>`,
    )
    .join("");
  return `<ul style="padding-left:20px;margin:16px 0;">${items}</ul>`;
}

export async function sendJessicaDailyAppointmentsEmail(): Promise<{ sent: boolean; count: number }> {
  const paris = getParisDateTime();
  if (paris.weekday === 0 || paris.weekday === 6) {
    return { sent: false, count: 0 };
  }

  const { start, end } = parisDayBounds(paris.year, paris.month, paris.day);
  const events = await fetchJessicaCalendarEvents(start, end);
  const dayLabel = format(start, "EEEE d MMMM yyyy", { locale: fr });

  const result = await sendEmail({
    to: JESSICA_CONTENTIN_EMAIL,
    subject: `Vos rendez-vous du ${dayLabel}`,
    skipBcc: true,
    html: `
      <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;">
        <p>Bonjour Jessica,</p>
        <p>Voici vos rendez-vous prévus pour <strong>aujourd'hui (${dayLabel})</strong> :</p>
        ${eventsListHtml(events)}
        <p style="color:#5C5348;font-size:14px;">Bonne journée,<br/>Votre assistant cabinet</p>
      </div>
    `,
  });

  return { sent: result.success, count: events.length };
}

export async function sendJessicaWeeklyRecapEmail(): Promise<{
  sent: boolean;
  count: number;
  revenue: number;
}> {
  const paris = getParisDateTime();
  const { start, end } = parisWeekBounds(paris.year, paris.month, paris.day, paris.weekday);
  const now = new Date();
  const events = (await fetchJessicaCalendarEvents(start, end)).filter(
    (e) => new Date(e.endIso) <= now,
  );
  const { count, revenue } = summarizeCalendarEvents(events);

  const result = await sendEmail({
    to: JESSICA_CONTENTIN_EMAIL,
    subject: `Récapitulatif de la semaine — ${count} rendez-vous`,
    skipBcc: true,
    html: `
      <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;">
        <p>Bonjour Jessica,</p>
        <p>Cette semaine, tu as eu <strong>${count} rendez-vous</strong> pour un CA de <strong>${revenue.toFixed(0)}€</strong>.</p>
        ${events.length > 0 ? `<p>Détail :</p>${eventsListHtml(events)}` : ""}
        <p style="color:#5C5348;font-size:14px;">Bon week-end,<br/>Votre assistant cabinet</p>
      </div>
    `,
  });

  return { sent: result.success, count, revenue };
}
