import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/serious-games/shared";

// Téléchargement du livrable PDF d'une partie : l'apprenant pour lui-même, l'école pour ses apprenants (RLS).
export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!UUID_RE.test(attemptId)) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: attempt } = await supabase.from("serious_game_attempts").select("pdf_path").eq("id", attemptId).maybeSingle();
  if (!attempt?.pdf_path) return NextResponse.json({ error: "Aucun PDF pour cette partie" }, { status: 404 });

  const { data, error } = await supabase.storage.from("serious-game-deliverables").createSignedUrl(attempt.pdf_path, 120, { download: true });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "PDF indisponible" }, { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
