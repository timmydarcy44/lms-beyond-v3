import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  mode: z.enum(["login", "signup"]),
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
});

async function upsertPatientProfile(
  admin: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || email.split("@")[0];
  const attempts = [
    {
      id: userId,
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role: "care_patient",
      role_type: "care_patient",
    },
    {
      id: userId,
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role: "patient",
      role_type: "care_patient",
    },
    {
      id: userId,
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role_type: "care_patient",
    },
  ];
  for (const row of attempts) {
    const { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });
    if (!error) return;
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Informations incomplètes." }, { status: 400 });
  }
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const email = parsed.data.email.trim().toLowerCase();
  const { mode, password } = parsed.data;
  const firstName = parsed.data.firstName ?? "";
  const lastName = parsed.data.lastName ?? "";

  if (mode === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      email,
      firstName,
      lastName,
    });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        origin: "care",
        role: "care_patient",
        first_name: firstName,
        last_name: lastName,
      },
    },
  });
  if (error) {
    const existing = /already|existe|registered/i.test(error.message);
    return NextResponse.json(
      { error: existing ? "Un compte existe déjà avec cet e-mail. Connectez-vous." : error.message },
      { status: 400 },
    );
  }
  const userId = data.user?.id;
  const admin = getServiceRoleClient();
  if (userId && admin) {
    await upsertPatientProfile(admin, userId, email, firstName, lastName);
  }
  if (!data.session) {
    return NextResponse.json({
      ok: true,
      needsConfirmation: true,
      email,
      message: "Compte patient créé. Confirmez l’e-mail si demandé, puis reconnectez-vous.",
    });
  }
  return NextResponse.json({ ok: true, email, firstName, lastName });
}
