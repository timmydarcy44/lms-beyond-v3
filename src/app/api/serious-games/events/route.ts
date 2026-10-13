import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getGameRules, gauges, jsonOk, num, str, tone } from "@/lib/serious-games/shared";

/**
 * Point d'entrée unique : le lecteur du bloc « Jeu interactif » relaie ici chaque événement du jeu.
 * Corps : { blockId, courseId, lessonId, game, version, event, ...données de l'événement }
 * La partie en cours est retrouvée côté serveur (par apprenant et par bloc), y compris après un rechargement.
 */
export async function POST(req: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const b = await req.json().catch(() => null);
  const blockId = str(b?.blockId, 80), gameId = str(b?.game, 80), event = str(b?.event, 30);
  const version = Math.round(num(b?.version, 1, 1000) ?? 1);
  if (!blockId || !gameId || !event) return NextResponse.json({ error: "Requête incomplète" }, { status: 400 });

  const now = new Date().toISOString();

  // Partie en cours pour ce bloc
  const current = async (): Promise<string | null> => {
    const { data } = await supabase.from("serious_game_saves").select("current_attempt_id")
      .eq("user_id", user.id).eq("block_id", blockId).maybeSingle();
    if (data?.current_attempt_id) return data.current_attempt_id as string;
    const { data: last } = await supabase.from("serious_game_attempts").select("id")
      .eq("user_id", user.id).eq("block_id", blockId).order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (last?.id) return last.id as string;
    // Partie commencée avant la mise en place du suivi : on la crée pour ne pas perdre le résultat
    const { data: created } = await supabase.from("serious_game_attempts").insert({
      user_id: user.id, game_id: gameId, game_version: version, block_id: blockId,
      course_id: str(b?.courseId, 80) || null, lesson_id: str(b?.lessonId, 80) || null,
    }).select("id").single();
    if (!created) return null;
    await supabase.from("serious_game_saves").upsert(
      { user_id: user.id, block_id: blockId, game_id: gameId, current_attempt_id: created.id, updated_at: now },
      { onConflict: "user_id,block_id" });
    return created.id as string;
  };

  switch (event) {
    case "started": {
      const { data, error } = await supabase.from("serious_game_attempts").insert({
        user_id: user.id, game_id: gameId, game_version: version,
        block_id: blockId, course_id: str(b?.courseId, 80) || null, lesson_id: str(b?.lessonId, 80) || null,
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await supabase.from("serious_game_saves").upsert(
        { user_id: user.id, block_id: blockId, game_id: gameId, current_attempt_id: data.id, updated_at: now },
        { onConflict: "user_id,block_id" });
      return NextResponse.json({ ok: true, attemptId: data.id });
    }

    case "step": {
      const attemptId = await current();
      if (!attemptId) return NextResponse.json({ error: "Aucune partie en cours" }, { status: 409 });
      const stepIndex = Math.round(num(b.stepIndex, 1, 30) ?? 0);
      const question = str(b.question, 2000);
      if (!stepIndex || !question) return NextResponse.json({ error: "Réponse incomplète" }, { status: 400 });
      const options = Array.isArray(b.options) ? b.options.slice(0, 40).map((o: any) => ({
        key: str(o?.key, 20), text: str(o?.text, 600), tone: tone(o?.tone) ?? "mid",
        concept: str(o?.concept, 160), feedback: str(o?.feedback, 1200),
      })) : [];
      const selected = Array.isArray(b.selectedKeys) ? b.selectedKeys.slice(0, 60).map((k: unknown) => str(k, 20)).filter(Boolean) : null;
      const { error } = await supabase.from("serious_game_answers").upsert({
        attempt_id: attemptId, user_id: user.id, game_id: gameId, step_index: stepIndex,
        node_id: str(b.node, 80) || `step-${stepIndex}`, situation: str(b.situation, 1200), speaker: str(b.speaker, 120),
        question, tension: num(b.tension, 0, 5), options,
        chosen_key: str(b.chosenKey, 20) || "-", chosen_text: str(b.chosenText, 600) || "-",
        chosen_keys: selected, free_text: str(b.freeText, 8000) || null,
        tone: tone(b.tone), concept: str(b.concept, 160), feedback: str(b.feedback, 2000),
        delta: gauges(b.delta), gauges: gauges(b.gauges),
      }, { onConflict: "attempt_id,step_index", ignoreDuplicates: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await supabase.from("serious_game_attempts").update({ steps_count: stepIndex, last_activity_at: now })
        .eq("id", attemptId).eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }

    case "completed": {
      const attemptId = await current();
      if (!attemptId) return NextResponse.json({ error: "Aucune partie en cours" }, { status: 409 });
      const rules = await getGameRules(supabase, gameId, version);
      const ending = str(b.ending, 60);
      if (rules.endings && !rules.endings.includes(ending)) return NextResponse.json({ error: "Fin de partie invalide" }, { status: 400 });
      const score = num(b.score, 0, 100);
      if (score === null) return NextResponse.json({ error: "Score invalide" }, { status: 400 });
      const criteria = b.criteria && typeof b.criteria === "object" ? gauges(b.criteria) : null;
      const badges = Array.isArray(b.badges) ? b.badges.slice(0, 30).map((x: any) => ({ id: str(x?.id, 40), name: str(x?.name, 80) })) : [];
      const passed = Math.round(score) >= rules.passingScore;
      const { data, error } = await supabase.from("serious_game_attempts").update({
        status: "completed", ending, ending_title: str(b.endingTitle, 200), ending_text: str(b.endingText, 2000), lesson: str(b.lesson, 4000),
        tone: tone(b.tone), score: Math.round(score), passed, criteria, xp: Math.round(num(b.xp, 0, 1e6) ?? 0), badges,
        duration_sec: Math.round(num(b.durationSec, 0, 86400) ?? 0) || null,
        report: jsonOk(b.report) ? b.report ?? null : null,
        satisfaction: num(b.satisfaction, 0, 100), ambiance: num(b.ambiance, 0, 100), cost: num(b.cost, 0, 100000),
        endings_found: Math.round(num(b.endingsFound, 0, 100) ?? 0) || null,
        completed_at: now, last_activity_at: now,
      }).eq("id", attemptId).eq("user_id", user.id).eq("status", "started").select("id, score").single();
      if (error || !data) return NextResponse.json({ error: "Partie déjà terminée ou introuvable" }, { status: 409 });

      // Point d'accroche Open Badges : déclencher ici le badge du jeu si `passed`.
      // ex. if (passed) await triggerBadge(user.id, `jeu:${gameId}`);

      return NextResponse.json({ ok: true, attemptId, score: data.score, passed });
    }

    case "deliverable": {
      const attemptId = await current();
      if (!attemptId) return NextResponse.json({ error: "Aucune partie" }, { status: 409 });
      if (str(b.mimeType, 40) !== "application/pdf" || typeof b.base64 !== "string") return NextResponse.json({ error: "Format refusé" }, { status: 400 });
      const bytes = Buffer.from(b.base64, "base64");
      if (bytes.length > 5 * 1024 * 1024 || bytes.subarray(0, 4).toString() !== "%PDF") return NextResponse.json({ error: "PDF invalide" }, { status: 400 });
      const path = `${user.id}/${attemptId}.pdf`;
      const { error } = await supabase.storage.from("serious-game-deliverables").upload(path, bytes, { contentType: "application/pdf", upsert: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await supabase.from("serious_game_attempts").update({ pdf_path: path }).eq("id", attemptId).eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }

    case "state": {
      if (!jsonOk(b.state)) return NextResponse.json({ error: "Sauvegarde trop volumineuse" }, { status: 413 });
      await supabase.from("serious_game_saves").upsert(
        { user_id: user.id, block_id: blockId, game_id: gameId, state: b.state ?? null, updated_at: now },
        { onConflict: "user_id,block_id" });
      return NextResponse.json({ ok: true });
    }

    case "collection": {
      const c = b.collection;
      if (!c || !Array.isArray(c.badges) || !jsonOk(c)) return NextResponse.json({ error: "Collection invalide" }, { status: 400 });
      await supabase.from("serious_game_collections").upsert(
        { user_id: user.id, game_id: gameId, collection: { badges: c.badges.slice(0, 50).map((x: unknown) => str(x, 40)), best: num(c.best, 0, 100) ?? 0, runs: num(c.runs, 0, 10000) ?? 0 }, updated_at: now },
        { onConflict: "user_id,game_id" });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true, ignored: event });
  }
}
