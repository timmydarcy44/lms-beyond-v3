import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/emails/brevo";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const {
      start_date,
      company_name,
      contact_first_name,
      contact_last_name,
      email,
      phone,
      role,
      autonomy,
      accepts_atypical,
      offer_mode,
      ai_prompt,
      ai_culture,
      ai_city,
      ai_salary,
      offer_text,
      soft_skills,
    } = payload ?? {};

    if (!company_name || !contact_first_name || !contact_last_name || !email || !phone || !role) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_offer_requests")
      .insert({
        start_date,
        company_name,
        contact_first_name,
        contact_last_name,
        email,
        phone,
        role,
        autonomy,
        accepts_atypical,
        offer_mode,
        ai_prompt,
        ai_culture,
        ai_city,
        ai_salary,
        offer_text,
        soft_skills,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/submit-request] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const notifyEmail = process.env.BEYOND_CONNECT_OFFER_NOTIFY_EMAIL || "t.darcy@beyondcenter.fr";
    await sendEmail({
      to: notifyEmail,
      subject: "Nouvelle offre Beyond Connect",
      htmlContent: `
        <h2>Nouvelle demande d'offre</h2>
        <p><strong>Entreprise :</strong> ${company_name}</p>
        <p><strong>Contact :</strong> ${contact_first_name} ${contact_last_name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        <p><strong>Poste :</strong> ${role}</p>
        <p><strong>Date souhaitée :</strong> ${start_date || "-"}</p>
        <p><strong>Autonomie :</strong> ${autonomy || "-"}</p>
        <p><strong>Profils atypiques :</strong> ${accepts_atypical ? "Oui" : "Non"}</p>
        <p><strong>Soft skills :</strong> ${(soft_skills || []).join(", ")}</p>
      `,
      textContent: `Nouvelle demande d'offre\nEntreprise: ${company_name}\nContact: ${contact_first_name} ${contact_last_name}\nEmail: ${email}\nTéléphone: ${phone}\nPoste: ${role}\nDate souhaitée: ${start_date || "-"}\nAutonomie: ${autonomy || "-"}\nProfils atypiques: ${accepts_atypical ? "Oui" : "Non"}\nSoft skills: ${(soft_skills || []).join(", ")}`,
      tags: ["beyond-connect", "offer-request"],
    });

    return NextResponse.json({ success: true, request: data });
  } catch (error) {
    console.error("[beyond-connect/submit-request] Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
