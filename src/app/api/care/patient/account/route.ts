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

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Informations incomplètes." }, { status: 400 });
  }
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const email = parsed.data.email.trim().toLowerCase();
  const { mode, password, firstName, lastName } = parsed.data;

  if (mode === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      email,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
    });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        origin: "care",
        first_name: firstName ?? "",
        last_name: lastName ?? "",
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
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const row = {
      id: userId,
      email,
      full_name: fullName || email.split("@")[0],
      first_name: firstName ?? "",
      last_name: lastName ?? "",
      role: "care_patient",
      role_type: "care_patient",
    };
    const first = await admin.from("profiles").upsert(row, { onConflict: "id" });
    if (first.error) {
      await admin.from("profiles").upsert(
        { id: userId, email, full_name: row.full_name, first_name: row.first_name, last_name: row.last_name, role_type: "care_patient" },
        { onConflict: "id" },
      );
    }
  }
  if (!data.session) {
    return NextResponse.json({
      ok: true,
      needsConfirmation: true,
      email,
      message: "Compte créé. Confirmez l’e-mail si demandé, puis reconnectez-vous.",
    });
  }
  return NextResponse.json({ ok: true, email, firstName: firstName ?? "", lastName: lastName ?? "" });
}
