import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { getCrmUsers } from "@/lib/queries/super-admin";
import { formatCrmRoleLabel } from "@/lib/crm/crm-shared";

type Body = {
  subject?: string;
  html?: string;
  segment?: "all" | "role" | "single";
  role?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const subject = body?.subject?.trim() ?? "";
  const html = body?.html?.trim() ?? "";
  const segment = body?.segment ?? "all";

  if (!subject || !html) {
    return NextResponse.json({ error: "Objet et contenu HTML requis" }, { status: 400 });
  }

  let recipients: string[] = [];

  if (segment === "single") {
    const email = body?.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email destinataire requis" }, { status: 400 });
    }
    recipients = [email];
  } else {
    const users = await getCrmUsers();
    const filtered =
      segment === "role" && body?.role
        ? users.filter((u) => u.role === body.role)
        : users;
    recipients = [...new Set(filtered.map((u) => u.email).filter(Boolean))];
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Aucun destinataire" }, { status: 400 });
  }

  const batchSize = 50;
  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const result = await sendEmail({ to: batch, subject, html });
    if (result.success) {
      sent += batch.length;
    } else {
      errors.push(result.error ?? "Erreur inconnue");
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Envoi impossible", recipients: recipients.length },
      { status: 502 },
    );
  }

  const roleLabel =
    segment === "role" && body?.role ? formatCrmRoleLabel(body.role) : null;

  return NextResponse.json({
    ok: true,
    sent,
    total: recipients.length,
    segment,
    roleLabel,
    errors: errors.length > 0 ? errors : undefined,
  });
}
