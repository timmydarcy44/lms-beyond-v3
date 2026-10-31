import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { formatBadgeLongDate, formatPersonName } from "@/lib/openbadges/v3/badge-page-display";
import { badgeCertificatePdf } from "@/lib/openbadges/certificate-pdf";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ assertionId: string }> };

const STATUS = {
  verified: "Authenticité vérifiée",
  expired: "Expiré",
  revoked: "Révoqué",
  invalid: "Signature invalide",
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  if (!badge) return new NextResponse("Introuvable", { status: 404 });

  const pageUrl = `${BADGE_PUBLIC_ORIGIN}/badges/${badge.assertionId}`;
  const qrPng = await QRCode.toBuffer(pageUrl, {
    type: "png",
    margin: 1,
    width: 240,
    color: { dark: "#F2F2F4", light: "#1A1B22" },
  });
  const pdf = badgeCertificatePdf({
    name: badge.name,
    recipientName: formatPersonName(badge.recipientName) || badge.recipientName,
    issuedLabel: formatBadgeLongDate(badge.issuedAt),
    assertionId: badge.assertionId,
    pageUrl,
    stateLabel: STATUS[badge.state],
    qrPng,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="badge-${badge.assertionId}.pdf"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}
