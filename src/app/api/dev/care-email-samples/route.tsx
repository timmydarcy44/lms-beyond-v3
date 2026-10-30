import { NextResponse } from "next/server";
import { createElement, type ComponentProps, type ReactElement } from "react";
import { render } from "@react-email/render";
import { CancellationEmail } from "../../../../../emails/care/CancellationEmail";
import { ConfirmationEmail, type ConfirmationEmailProps } from "../../../../../emails/care/ConfirmationEmail";
import { DocumentEmail } from "../../../../../emails/care/DocumentEmail";
import { MovedEmail } from "../../../../../emails/care/MovedEmail";
import { ReminderEmail } from "../../../../../emails/care/ReminderEmail";
import { CARE_FROM } from "@/lib/care/booking-emails";
import { sendEmail } from "@/lib/email/resend-client";

export const dynamic = "force-dynamic";

const TO = "timmydarcy44@gmail.com";

function preview<T>(component: T): ComponentProps<T & { PreviewProps: ComponentProps<T> }> {
  return (component as unknown as { PreviewProps: ComponentProps<T & { PreviewProps: ComponentProps<T> }> }).PreviewProps;
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Indisponible" }, { status: 404 });
  }
  const cabinet = (ConfirmationEmail as unknown as { PreviewProps: ConfirmationEmailProps }).PreviewProps;
  const visio: ConfirmationEmailProps = {
    ...cabinet,
    preheader: "Avec Timmy Darcy, en visio. Ajoutez-le à votre agenda.",
    card: { ...cabinet.card, placeTitle: "En visio", placeDetail: "Le lien sera actif 15 min avant", mapsUrl: null },
  };
  const messages: Array<[string, string, ReactElement]> = [
    ["Rendez-vous confirmé · jeudi 29 octobre à 12:00", "care_confirmation", createElement(ConfirmationEmail, cabinet)],
    ["Rendez-vous confirmé · jeudi 29 octobre à 12:00 (visio)", "care_confirmation", createElement(ConfirmationEmail, visio)],
    ["Demain à 12:00 · votre rendez-vous Byound Care", "care_reminder", createElement(ReminderEmail, preview(ReminderEmail))],
    ["Rendez-vous annulé · jeudi 29 octobre", "care_cancellation", createElement(CancellationEmail, preview(CancellationEmail))],
    ["Rendez-vous déplacé · vendredi 30 octobre à 12:00", "care_moved", createElement(MovedEmail, preview(MovedEmail))],
    ["Un nouveau document est disponible dans votre espace", "care_document", createElement(DocumentEmail, preview(DocumentEmail))],
  ];
  const sent: string[] = [];
  for (const [subject, tag, node] of messages) {
    const html = await render(node);
    const text = await render(node, { plainText: true });
    const result = await sendEmail({
      from: CARE_FROM,
      to: TO,
      subject: `[Aperçu] ${subject}`,
      html,
      text,
      skipBcc: true,
      tags: { type: tag },
    });
    if (!result.success) return NextResponse.json({ error: result.error, sent }, { status: 502 });
    sent.push(subject);
  }
  return NextResponse.json({ ok: true, to: TO, sent: sent.length });
}
