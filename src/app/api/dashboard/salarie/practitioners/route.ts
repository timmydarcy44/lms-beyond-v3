import { NextResponse } from "next/server";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import {
  mapPractitionerRow,
  SALARIE_PRACTITIONERS_FALLBACK,
  type SalariePractitionerRow,
} from "@/lib/learner/practitioners";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Praticiens Byound visibles dans Mes coachings (salarié / apprenant). */
export async function GET() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = getServiceRoleClient() ?? authClient;
  const { data, error } = await db
    .from("praticiens_bct")
    .select("id, prenom, nom, photo_url, titre, biographie, specialites")
    .eq("status", "active")
    .eq("visible_salarie_coaching", true)
    .order("nom", { ascending: true });

  const rows = error ? [] : ((data ?? []) as SalariePractitionerRow[]);
  const praticiens =
    isJadeDemoEmail(user.email) || rows.length === 0
      ? SALARIE_PRACTITIONERS_FALLBACK
      : rows.map(mapPractitionerRow);

  const today = new Date().toISOString().slice(0, 10);
  const { data: session } = await db
    .from("sessions_bct")
    .select("date_session, heure_debut, praticien_id")
    .eq("collaborateur_id", user.id)
    .gte("date_session", today)
    .order("date_session", { ascending: true })
    .limit(1)
    .maybeSingle();

  let nextAppointment: {
    practitionerName: string;
    title: string;
    dateLabel: string;
    time: string;
    place: string;
  } | null = null;

  if (isJadeDemoEmail(user.email)) {
    const when = new Date();
    when.setDate(when.getDate() + 3);
    nextAppointment = {
      practitionerName: "Camille Bernard",
      title: "Coaching commercial",
      dateLabel: when.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
      time: "16:00",
      place: "Visio Byound",
    };
  } else if (session?.date_session) {
    const praticien = praticiens.find((item) => item.id === session.praticien_id);
    const date = new Date(`${session.date_session}T12:00:00`);
    nextAppointment = {
      practitionerName: praticien?.name ?? "Praticien Byound",
      title: praticien?.title ?? "Rendez-vous",
      dateLabel: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
      time: String(session.heure_debut ?? "").slice(0, 5) || "À confirmer",
      place: "Visio Byound",
    };
  }

  return NextResponse.json({
    praticiens,
    source: rows.length > 0 ? "database" : "fallback",
    nextAppointment,
  });
}
