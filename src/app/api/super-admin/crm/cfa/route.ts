import { NextRequest, NextResponse } from "next/server";

import { CFA_APPLICATION_STATUSES } from "@/lib/cfa-applications";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await db
    .from("cfa_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ applications: [], migrationRequired: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const applications = await Promise.all(
    (data ?? []).map(async (application) => {
      const [cvSigned, motivationSigned] = await Promise.all([
        application.cv_path
          ? db.storage
              .from("cfa-applications")
              .createSignedUrl(String(application.cv_path), 3600)
          : Promise.resolve({ data: null }),
        application.motivation_media_url &&
        !String(application.motivation_media_url).startsWith("http")
          ? db.storage
              .from("cfa-applications")
              .createSignedUrl(String(application.motivation_media_url), 3600)
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...application,
        cv_url: cvSigned.data?.signedUrl ?? null,
        motivation_media_signed_url:
          motivationSigned.data?.signedUrl ?? application.motivation_media_url ?? null,
      };
    }),
  );
  return NextResponse.json({ applications });
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = String(body?.id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  if (
    !id ||
    !CFA_APPLICATION_STATUSES.includes(
      status as (typeof CFA_APPLICATION_STATUSES)[number],
    )
  ) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const patch: Record<string, unknown> = { status };
  if (body?.interviewAt !== undefined) {
    patch.interview_at = body.interviewAt ? String(body.interviewAt) : null;
  }
  if (body?.interviewNotes !== undefined) {
    patch.interview_notes = String(body.interviewNotes ?? "").trim() || null;
  }
  if (body?.decisionNotes !== undefined) {
    patch.admission_decision_notes = String(body.decisionNotes ?? "").trim() || null;
  }
  if (status === "admitted") patch.admitted_at = new Date().toISOString();

  const { data, error } = await db
    .from("cfa_applications")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (status === "admitted" && data?.email && process.env.RESEND_API_KEY) {
    const publicUrl = (
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://edgebs.fr"
    ).replace(/\/$/, "");
    const resumeUrl = `${publicUrl}/ecole/candidater?resume=${encodeURIComponent(String(data.resume_token))}`;
    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Byound <noreply@edgebs.fr>",
        to: String(data.email),
        subject: "Welcome to Byound. You’re in.",
        html: `<div style="background:#070b1f;color:#fff;padding:40px;font-family:Arial,sans-serif"><p style="color:#8c86ff;text-transform:uppercase;letter-spacing:.16em">Byound School</p><h1 style="font-size:40px;line-height:1">Welcome to Byound.<br/>You’re in.</h1><p>Félicitations ${data.first_name}. Ton admission est confirmée.</p><p><a href="${resumeUrl}" style="display:inline-block;margin-top:16px;background:#fff;color:#070b1f;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">Voir mes prochaines étapes</a></p></div>`,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({ application: data });
}
