import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CARE_PUBLIC_ORIGIN } from "@/lib/care/host";
import { buildCalendarLinks } from "@/lib/care/ics";
import { loadCareBookingByAccessToken } from "@/lib/care/load-booking";
import { locationText, mailInputFromBooking } from "@/lib/care/mail-copy";

export const metadata: Metadata = { title: "Ajouter à l'agenda", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CareAgendaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await loadCareBookingByAccessToken(token);
  if (!booking || booking.status !== "confirmed") notFound();
  const expired = new Date(booking.ends_at).getTime() < Date.now();
  const input = mailInputFromBooking(booking);
  const links = buildCalendarLinks({
    startsAt: new Date(booking.starts_at),
    endsAt: new Date(booking.ends_at),
    location: locationText(input),
    icsUrl: `${CARE_PUBLIC_ORIGIN}/api/care/ics/${booking.id}?token=${encodeURIComponent(booking.access_token)}`,
  });

  return (
    <main style={{ minHeight: "100vh", background: "#FBF8F6", color: "#1F1F24", fontFamily: "Manrope, Arial, sans-serif", padding: "48px 20px" }}>
      <section style={{ maxWidth: 460, margin: "0 auto", background: "#fff", border: "1px solid #EEE6E1", borderRadius: 24, padding: 28 }}>
        <p style={{ margin: 0, color: "#CE0058", fontWeight: 800 }}>Byound Care</p>
        <h1 style={{ margin: "12px 0 8px", fontSize: 28, letterSpacing: "-0.6px" }}>
          {expired ? "Ce lien a expiré" : "Ajouter à l'agenda"}
        </h1>
        <p style={{ margin: 0, color: "#5A5A62", lineHeight: 1.5 }}>
          {expired
            ? "Le rendez-vous est passé. Le lien d'agenda n'est plus actif."
            : "Choisissez l'agenda. Le fichier ne contient ni le motif ni le contenu de la séance."}
        </p>
        {expired ? null : (
          <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
            <AgendaLink href={links.google}>Google Agenda</AgendaLink>
            <AgendaLink href={links.outlook}>Outlook</AgendaLink>
            <AgendaLink href={links.ics}>Apple / fichier .ics</AgendaLink>
          </div>
        )}
      </section>
    </main>
  );
}

function AgendaLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        background: "#CE0058",
        color: "#fff",
        textAlign: "center",
        textDecoration: "none",
        fontWeight: 800,
        borderRadius: 999,
        padding: "14px 16px",
      }}
    >
      {children}
    </a>
  );
}
