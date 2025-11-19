import { NextResponse } from "next/server";
import { getAlertCount } from "@/lib/queries/alerts";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ count: 0 }, { status: 403 });
  }

  const count = await getAlertCount();
  return NextResponse.json({ count });
}





