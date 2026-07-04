import { NextResponse } from "next/server";

import { PROFIL_COMPORTEMENTAL_BADGE_NAME } from "@/lib/openbadges/diagnostic-commercial-badge";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CrossProfileCompletionRow = {
  show_badge_animation?: boolean;
  opening_paragraph?: string;
  badge_id?: string;
};

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
  const { data: profile } = await db
    .from("profiles")
    .select("cross_profile_completion")
    .eq("id", user.id)
    .maybeSingle();

  const completion = (profile?.cross_profile_completion ?? null) as CrossProfileCompletionRow | null;
  const pending = Boolean(completion?.show_badge_animation);

  if (!pending) {
    return NextResponse.json({ pending: false });
  }

  const badgeId = completion?.badge_id ? String(completion.badge_id) : null;
  let badgeImageUrl: string | null = null;
  if (badgeId) {
    const { data: badgeRow } = await db
      .from("open_badges")
      .select("image_url")
      .eq("id", badgeId)
      .maybeSingle();
    badgeImageUrl = badgeRow?.image_url ? String(badgeRow.image_url) : null;
  }

  return NextResponse.json({
    pending: true,
    badgeName: PROFIL_COMPORTEMENTAL_BADGE_NAME,
    badgeImageUrl,
    openingParagraph: completion?.opening_paragraph ?? null,
    walletHref: "/dashboard/apprenant/profil-comportemental",
  });
}

export async function POST() {
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
  const { data: profile } = await db
    .from("profiles")
    .select("cross_profile_completion")
    .eq("id", user.id)
    .maybeSingle();

  const completion = (profile?.cross_profile_completion ?? null) as Record<string, unknown> | null;
  if (!completion || typeof completion !== "object") {
    return NextResponse.json({ ok: true });
  }

  const next = {
    ...completion,
    show_badge_animation: false,
  };

  const { error } = await db
    .from("profiles")
    .update({ cross_profile_completion: next })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
