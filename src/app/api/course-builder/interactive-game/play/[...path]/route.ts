import { NextResponse } from "next/server";

import {
  interactiveGameContentType,
  sanitizeInteractiveGamePath,
} from "@/lib/course-builder/interactive-game";

export const dynamic = "force-dynamic";

const BUCKETS = ["public", "Public", "uploads"] as const;

/** Sert le jeu en text/html. Le stockage public renvoie souvent le fichier comme texte brut. */
export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const relative = sanitizeInteractiveGamePath(path.map((part) => decodeURIComponent(part)).join("/"));
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!relative || !base) {
    return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });
  }

  for (const bucket of BUCKETS) {
    const upstream = `${base}/storage/v1/object/public/${bucket}/interactive-games/${relative}`;
    const response = await fetch(upstream).catch(() => null);
    if (!response?.ok) continue;
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": interactiveGameContentType(relative),
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });
}
