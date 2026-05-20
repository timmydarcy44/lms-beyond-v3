import { NextResponse } from "next/server";

import {
  isValidOrientationLeadContact,
  ORIENTATION_EMPLOYMENT_STATUSES,
  type OrientationLeadPayload,
} from "@/lib/orientation-lead";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<OrientationLeadPayload>;

    const contact = {
      firstName: String(body.firstName ?? body.first_name ?? "").trim(),
      lastName: String(body.lastName ?? body.last_name ?? "").trim(),
      email: String(body.email ?? "").trim(),
      phone: String(body.phone ?? body.telephone ?? "").trim(),
      employmentStatus: body.employmentStatus ?? body.employment_status,
    };

    if (!isValidOrientationLeadContact(contact)) {
      return NextResponse.json(
        { error: "Coordonnées invalides ou incomplètes." },
        { status: 400 },
      );
    }

    const db = getServiceRoleClient();
    if (!db) {
      return NextResponse.json({ error: "Base de données indisponible" }, { status: 500 });
    }

    const objectifs = Array.isArray(body.objectifs) ? body.objectifs : [];
    const profil = body.profil != null ? String(body.profil) : null;
    const format = body.format != null ? String(body.format) : null;

    const row = {
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      employment_status: contact.employmentStatus,
      objectifs,
      profil,
      format,
      result_payload: body.result ?? null,
      source: "votre-orientation",
    };

    const { data, error } = await db.from("edge_orientation_leads").insert(row).select("id").single();

    if (error) {
      if (error.code === "42P01") {
        console.warn("[edge-orientation-lead] table missing — apply migration 20260520140000");
        return NextResponse.json({ success: true, id: null, warning: "table_missing" });
      }
      console.error("[edge-orientation-lead]", error);
      return NextResponse.json(
        { error: "Enregistrement impossible", details: error.message },
        { status: 500 },
      );
    }

    const statusLabel =
      ORIENTATION_EMPLOYMENT_STATUSES.find((s) => s.id === contact.employmentStatus)?.label ??
      contact.employmentStatus;

    const resendKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.CONTACT_EMAIL?.trim() || "contact@edgebs.fr";
    if (resendKey && notifyTo) {
      const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "EDGE <noreply@edgebs.fr>";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: notifyTo,
          reply_to: contact.email,
          subject: `[EDGE] Nouveau lead orientation — ${contact.firstName} ${contact.lastName}`,
          html: `<p><strong>${contact.firstName} ${contact.lastName}</strong></p>
<p>Email : ${contact.email}<br/>Tél. : ${contact.phone}<br/>Situation : ${statusLabel}</p>
<p>Objectifs : ${objectifs.join(", ") || "—"}<br/>Profil : ${profil ?? "—"}<br/>Format : ${format ?? "—"}</p>`,
        }),
      }).catch((e) => console.warn("[edge-orientation-lead] email notify failed", e));
    }

    return NextResponse.json({ success: true, id: data?.id ?? null });
  } catch (e) {
    console.error("[edge-orientation-lead]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
