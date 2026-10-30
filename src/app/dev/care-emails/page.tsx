import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { render } from "@react-email/render";
import { CancellationEmail } from "../../../../emails/care/CancellationEmail";
import { ConfirmationEmail, type ConfirmationEmailProps } from "../../../../emails/care/ConfirmationEmail";
import { DocumentEmail } from "../../../../emails/care/DocumentEmail";
import { MovedEmail } from "../../../../emails/care/MovedEmail";
import { ReminderEmail } from "../../../../emails/care/ReminderEmail";

export const dynamic = "force-dynamic";

export default async function CareEmailPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const cabinet = (ConfirmationEmail as unknown as { PreviewProps: ConfirmationEmailProps }).PreviewProps;
  const visio: ConfirmationEmailProps = {
    ...cabinet,
    preheader: "Avec Timmy Darcy, en visio. Ajoutez-le à votre agenda.",
    card: {
      ...cabinet.card,
      placeTitle: "En visio",
      placeDetail: "Le lien sera actif 15 min avant",
      mapsUrl: null,
    },
  };
  const rendered = await Promise.all([
    ["Confirmation, cabinet", render(<ConfirmationEmail {...cabinet} />)],
    ["Confirmation, visio", render(<ConfirmationEmail {...visio} />)],
    ["Rappel", render(<ReminderEmail {...(ReminderEmail as unknown as { PreviewProps: ComponentProps<typeof ReminderEmail> }).PreviewProps} />)],
    ["Annulation", render(<CancellationEmail {...(CancellationEmail as unknown as { PreviewProps: ComponentProps<typeof CancellationEmail> }).PreviewProps} />)],
    ["Déplacement", render(<MovedEmail {...(MovedEmail as unknown as { PreviewProps: ComponentProps<typeof MovedEmail> }).PreviewProps} />)],
    ["Document", render(<DocumentEmail {...(DocumentEmail as unknown as { PreviewProps: ComponentProps<typeof DocumentEmail> }).PreviewProps} />)],
  ]);
  const html = await Promise.all(rendered.map(async ([label, promise]) => ({ label, html: await promise })));

  return (
    <main style={{ background: "#E7E1DC", minHeight: "100vh", padding: 24, fontFamily: "Manrope, Arial, sans-serif" }}>
      <h1 style={{ margin: "0 0 16px" }}>Emails Byound Care</h1>
      <div style={{ display: "grid", gap: 28 }}>
        {html.map((item) => (
          <section key={item.label}>
            <h2 style={{ fontSize: 16 }}>{item.label}</h2>
            <iframe title={item.label} srcDoc={item.html} style={{ width: "100%", height: 820, border: 0, background: "#fff", borderRadius: 16 }} />
          </section>
        ))}
      </div>
    </main>
  );
}
