import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "PDF requis" }, { status: 400 });
  const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const result = await parser.getText();
    const text = String(result.text ?? "").slice(0, 20000);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "PDF illisible" }, { status: 400 });
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
