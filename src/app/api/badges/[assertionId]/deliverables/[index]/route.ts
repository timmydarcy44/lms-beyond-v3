import { NextResponse } from "next/server";
import { loadDeliverableAccess, signedDeliverableUrl } from "@/lib/openbadges/v3/badge-deliverable-access";
import { viewerIsCompanyAccount } from "@/lib/openbadges/v3/company-viewer";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ assertionId: string; index: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { assertionId, index } = await params;
  const fileIndex = Number(index);
  if (!Number.isInteger(fileIndex) || fileIndex < 0) return new NextResponse("Introuvable", { status: 404 });
  if (!(await viewerIsCompanyAccount())) return new NextResponse("Introuvable", { status: 404 });
  const db = getServiceRoleClient();
  if (!db) return new NextResponse("Introuvable", { status: 404 });
  const access = await loadDeliverableAccess(db, assertionId);
  const file = access?.files[fileIndex];
  if (!file) return new NextResponse("Introuvable", { status: 404 });
  const signed = await signedDeliverableUrl(db, file.url);
  if (!signed) return new NextResponse("Introuvable", { status: 404 });
  return NextResponse.redirect(signed, { status: 302 });
}
