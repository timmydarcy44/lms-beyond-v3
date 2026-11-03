import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const AUTHOR_ROLES = ["instructor", "formateur", "admin", "tutor", "super_admin"];

export async function POST(request: Request) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth?.user || !supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    const { data } = await supabase.from("org_memberships").select("role").eq("user_id", auth.user.id).in("role", AUTHOR_ROLES).limit(1);
    if (!data?.length) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const current = (body?.current ?? {}) as Record<string, unknown>;
  const excerpt = String(body?.excerpt ?? "").slice(0, 6000);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ proposal: current });

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Tu proposes la fiche d'annonce d'un jeu pédagogique. Réponds en JSON :
{"title":"","hook":"","duration_min":8,"steps_count":5,"skills":["notion"],"character":{"name":"","role":"","intro_line":""},"opening":""}
Le titre n'est jamais "Jeu interactif". L'accroche fait deux phrases, tutoiement. N'invente pas un personnage s'il n'apparaît pas dans l'extrait : laisse ses champs vides.`,
      },
      { role: "user", content: JSON.stringify({ extrait: excerpt, deja_rempli: current }) },
    ],
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}") as Record<string, unknown>;
  const keep = (key: string) => {
    const value = current[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return value;
    if (Array.isArray(value) && value.length) return value;
    return parsed[key];
  };

  return NextResponse.json({
    proposal: {
      title: keep("title"),
      hook: keep("hook"),
      duration_min: keep("duration_min"),
      steps_count: keep("steps_count"),
      skills: keep("skills"),
      character: current.character && typeof current.character === "object" ? current.character : parsed.character,
      opening: keep("opening"),
    },
  });
}
