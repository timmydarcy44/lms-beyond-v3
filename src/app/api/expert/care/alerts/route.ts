import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listUnreadCareExpertAlerts, markCareExpertAlertRead } from "@/lib/care/expert-alert";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ alerts: [] });
  const alerts = await listUnreadCareExpertAlerts(session.id);
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });
  await markCareExpertAlertRead(session.id, body.id);
  return NextResponse.json({ ok: true });
}
