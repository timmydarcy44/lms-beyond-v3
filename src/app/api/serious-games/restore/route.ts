import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

// Renvoie au jeu sa sauvegarde (reprise de partie) et la collection de badges de l'apprenant.
export async function GET(req: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const url = new URL(req.url);
  const blockId = (url.searchParams.get("blockId") ?? "").slice(0, 80);
  const gameId = (url.searchParams.get("game") ?? "").slice(0, 80);
  if (!blockId || !gameId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const [{ data: save }, { data: col }] = await Promise.all([
    supabase.from("serious_game_saves").select("state").eq("user_id", user.id).eq("block_id", blockId).maybeSingle(),
    supabase.from("serious_game_collections").select("collection").eq("user_id", user.id).eq("game_id", gameId).maybeSingle(),
  ]);
  return NextResponse.json({ state: save?.state ?? null, collection: col?.collection ?? null });
}
