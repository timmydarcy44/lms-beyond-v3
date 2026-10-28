import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/resend-client";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(160),
  headcount: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { name, company, email, headcount, message } = parsed.data;
  const safe = (value: string) => value.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char] ?? char));
  const sent = await sendEmail({
    to: "contact@byound.fr",
    subject: `Demande de démo Byound Care — ${company}`,
    html: `<p>${safe(name)} · ${safe(company)} · ${safe(headcount)}</p><p>${safe(email)}</p><p>${safe(message)}</p>`,
    text: `${name}\n${company}\n${email}\n${headcount}\n\n${message}`,
    replyTo: email,
    skipBcc: true,
  });
  if (!sent.success) {
    return NextResponse.json({ error: "Envoi impossible" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
