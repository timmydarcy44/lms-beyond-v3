import { NextResponse } from "next/server";
import { unbakePng } from "@/lib/openbadges/baking/png";
import { unbakeSvg } from "@/lib/openbadges/baking/svg";

export async function POST(request: Request) {
  const payload = await request.json();
  const url = payload?.url as string | undefined;
  if (!url) {
    return NextResponse.json({ error: "MISSING_URL" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 400 });
  }

  const contentType = res.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await res.arrayBuffer());

  if (contentType.includes("svg") || url.endsWith(".svg")) {
    const value = unbakeSvg(buffer.toString("utf8"));
    return NextResponse.json({ ok: true, value });
  }

  const value = unbakePng(buffer);
  return NextResponse.json({ ok: true, value });
}
