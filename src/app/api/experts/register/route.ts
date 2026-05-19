import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getResendClient } from "@/lib/email/resend-client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function generateRandomPassword() {
  // Strong random password (not shown to user). User access is activated after review.
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  const base = Buffer.from(bytes).toString("base64url");
  return `Bc_${base}_!9`;
}

export async function POST(request: NextRequest) {
  try {
    console.log("1. Données reçues : lecture JSON...");
    const supabase = getServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const body = await request.json().catch(() => ({}));
    console.log("1. Données reçues :", body);
    console.log("RESEND_API_KEY présent :", Boolean(process.env.RESEND_API_KEY));

    const data = body ?? {};

    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const firstName = typeof data.first_name === "string" ? data.first_name.trim() : "";
    const lastName = typeof data.last_name === "string" ? data.last_name.trim() : "";
    const headline = typeof data.headline === "string" ? data.headline.trim() : "";
    const photoUrl = typeof data.photo_url === "string" ? data.photo_url.trim() : "";
    const linkedinUrl = typeof data.linkedin_url === "string" ? data.linkedin_url.trim() : "";
    const wantsCertification = Boolean(data.wants_certification ?? data.wantsCertification ?? data.wants_beyond_certified);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Prénom/Nom requis." }, { status: 400 });
    }

    const specialties = Array.isArray(data.specialties) ? data.specialties : null;
    const formatsSupported = Array.isArray(data.formats_supported) ? data.formats_supported : null;

    // 1) Ensure auth.users exists (same id as public.experts.id)
    console.log("1bis. Création utilisateur Auth (admin)...");
    let userId: string | null = null;
    try {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: generateRandomPassword(),
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = created?.user?.id ?? null;
    } catch (authErr: any) {
      // If user already exists, reuse its id.
      try {
        const { data: existing, error: getErr } = await supabase.auth.admin.getUserByEmail(email);
        if (getErr) throw getErr;
        userId = existing?.user?.id ?? null;
      } catch (getExistingErr) {
        console.error("[experts/register] Auth admin error:", authErr);
        throw authErr;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Impossible de créer l'utilisateur Auth." }, { status: 500 });
    }

    const base: Record<string, unknown> = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      headline: headline || null,
      photo_url: photoUrl || null,
      linkedin_url: linkedinUrl || null,
      is_active: false,
      specialties,
      formats_supported: formatsSupported,
      review_status: "pending_review",
      wants_certification: wantsCertification,
    };

    // best-effort insert/upsert (schema differences)
    console.log("2. Tentative insertion DB...");
    const attempts: Array<{ payload: Record<string, unknown>; onConflict?: string }> = [
      { payload: base, onConflict: "email" },
      { payload: base, onConflict: "id" },
      { payload: { ...base, id: undefined }, onConflict: "email" },
      { payload: { email, first_name: firstName, last_name: lastName, review_status: "pending_review", wants_certification: wantsCertification } },
    ];

    let lastErr: any = null;
    for (const a of attempts) {
      // eslint-disable-next-line no-await-in-loop
      const q = a.onConflict ? supabase.from("experts").upsert(a.payload, { onConflict: a.onConflict }) : supabase.from("experts").insert(a.payload);
      // eslint-disable-next-line no-await-in-loop
      const { error } = await q;
      if (!error) {
        lastErr = null;
        break;
      }
      lastErr = error;
    }
    if (lastErr) throw lastErr;

    revalidatePath("/dashboard/expert");

    console.log("3. Tentative envoi email Resend...");
    try {
      const resend = await getResendClient();
      if (!resend) {
        console.warn("[experts/register] Resend non configuré (RESEND_API_KEY manquant).");
      } else {
        const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55">
<p>Bonjour,</p>
<p>Nous avons bien reçu votre candidature. Notre équipe va l'étudier sous 48h. À très vite !</p>
<p><strong>Accès :</strong> vos accès seront activés après revue de votre profil.</p>
${wantsCertification ? `<p><strong>Parcours certifiant :</strong> Vous avez choisi le parcours certifiant, vous recevrez les instructions de paiement après validation de votre profil.</p>` : ""}
</div>`;

        try {
          await resend.emails.send({
            from: "Beyond Center <onboarding@resend.dev>",
            to: [email],
            subject: "Bienvenue dans le réseau Beyond Center 🚀",
            html,
          });
        } catch (sendError) {
          console.warn("[experts/register] Resend send failed:", sendError);
        }
      }
    } catch (emailError) {
      console.warn("[experts/register] Email send crashed:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERREUR API REGISTER:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erreur serveur",
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      },
      { status: 500 },
    );
  }
}

