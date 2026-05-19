import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

const pickNonEmpty = (value: unknown): string | null => {
  const s = String(value ?? "").trim();
  return s ? s : null;
};

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase.from("validators").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ validators: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null) as any;
  const first = pickNonEmpty(body?.first_name);
  const last = pickNonEmpty(body?.last_name);
  if (!first || !last) {
    return NextResponse.json({ error: "first_name et last_name requis" }, { status: 400 });
  }

  // Champs attendus (noms exacts)
  const description = pickNonEmpty(body?.description);
  const photoUrl = pickNonEmpty(body?.photo_url);

  // Insert with fallback on missing columns (heterogeneous schemas)
  const row: Record<string, unknown> = {
    first_name: first,
    last_name: last,
    description,
    photo_url: photoUrl,
  };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase.from("validators").insert(row as never).select("*").maybeSingle();
    if (!error) {
      return NextResponse.json({ ...data });
    }
    const msg = String((error as any)?.message ?? "");
    const code = String((error as any)?.code ?? "");
    if (code === "42703" || /column .* does not exist/i.test(msg)) {
      const m = msg.match(/column \"([^\"]+)\"/i);
      const col = m?.[1];
      if (col && col in row) {
        delete (row as any)[col];
        continue;
      }
    }
    return NextResponse.json({ error: error.message, details: (error as any)?.details, hint: (error as any)?.hint }, { status: 400 });
  }

  return NextResponse.json({ error: "Insert échoué" }, { status: 400 });
}

