import { NextResponse } from "next/server";

/**
 * Route de debug désactivée — ne jamais exposer d'informations sur les clés API.
 */
export async function GET() {
  return NextResponse.json({ error: "Route désactivée" }, { status: 404 });
}
