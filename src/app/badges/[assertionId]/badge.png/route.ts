import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { renderDefaultBadgePng } from "@/lib/openbadges/baking/default-badge-png";
import { bakePng } from "@/lib/openbadges/baking/png";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

async function loadBadgeImage(imageUrl: string): Promise<Buffer | null> {
  if (imageUrl.startsWith("/")) {
    try {
      return await readFile(path.join(process.cwd(), "public", imageUrl));
    } catch {
      const remote = await fetch(`${BADGE_PUBLIC_ORIGIN}${imageUrl}`).catch(() => null);
      if (!remote?.ok) return null;
      return Buffer.from(await remote.arrayBuffer());
    }
  }
  if (!/^https?:\/\//i.test(imageUrl)) return null;
  const remote = await fetch(imageUrl).catch(() => null);
  if (!remote?.ok) return null;
  return Buffer.from(await remote.arrayBuffer());
}

type RouteParams = { assertionId: string };

export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { assertionId } = await context.params;
  const db = getServiceRoleClient();
  if (!db) return new NextResponse("Not found", { status: 404 });
  const badge = await loadPublicBadgeDocument(db, assertionId);
  if (!badge) return new NextResponse("Not found", { status: 404 });

  const artwork = badge.imageUrl ? await loadBadgeImage(badge.imageUrl) : null;
  const fallback = () => renderDefaultBadgePng(badge.name);
  let baked: Buffer;
  try {
    baked = bakePng(artwork ?? fallback(), badge.credentialJwt);
  } catch {
    baked = bakePng(fallback(), badge.credentialJwt);
  }

  return new NextResponse(new Uint8Array(baked), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="badge.png"',
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}
