import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

type Card = { front?: string; back?: string };

export async function POST(request: Request) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = auth?.user?.id;
  if (!userId || !supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const courseId = String(body?.courseId ?? "").trim();
  const lessonId = String(body?.lessonId ?? "").trim();
  const cards = (Array.isArray(body?.cards) ? body.cards : [])
    .map((card: Card) => ({
      front: String(card?.front ?? "").trim().slice(0, 180),
      back: String(card?.back ?? "").trim().slice(0, 400),
    }))
    .filter((card: { front: string; back: string }) => card.front && card.back)
    .slice(0, 12);

  if (!courseId || !cards.length) return NextResponse.json({ active: false, added: 0, cards: [] });

  const { count, error: countError } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (countError || !count) return NextResponse.json({ active: false, added: 0, cards: [] });

  const db = getServiceRoleClient() ?? supabase;
  const rows = cards.map((card: { front: string; back: string }) => ({
    course_id: courseId,
    front: card.front,
    back: card.back,
    question: card.front,
    answer: card.back,
    learner_id: userId,
    local_chapter_ref: lessonId || null,
  }));

  const inserted = await db.from("flashcards").insert(rows).select("id");
  if (inserted.error && (inserted.error.code === "42703" || /column/i.test(inserted.error.message ?? ""))) {
    return NextResponse.json({ active: true, added: cards.length, cards, stored: "local" });
  }
  if (inserted.error) {
    return NextResponse.json({ active: true, added: cards.length, cards, stored: "local" });
  }

  return NextResponse.json({
    active: true,
    added: inserted.data?.length ?? cards.length,
    cards,
    stored: "database",
  });
}
