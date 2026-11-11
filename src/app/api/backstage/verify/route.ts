import { NextRequest, NextResponse } from "next/server";
import { verifyBackstageToken } from "@/lib/formation-documents/backstage-signed-url";

/** Vérifie un jeton Backstage (émargement / docs). */
export async function GET(req: NextRequest) {
  const bt = req.nextUrl.searchParams.get("bt")?.trim() || "";
  const sig = req.nextUrl.searchParams.get("sig")?.trim() || "";
  const slot = req.nextUrl.searchParams.get("slot")?.trim() || "";
  const verified = verifyBackstageToken(bt, sig);
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.error }, { status: 401 });
  }
  if (slot && verified.payload.slot && verified.payload.slot !== slot) {
    return NextResponse.json({ ok: false, error: "slot_mismatch" }, { status: 401 });
  }
  if (verified.payload.k === "emarger" && slot && !verified.payload.slot) {
    return NextResponse.json({ ok: false, error: "slot_missing" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, kind: verified.payload.k, exp: verified.payload.exp });
}
