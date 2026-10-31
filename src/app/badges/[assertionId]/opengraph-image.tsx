import { ImageResponse } from "next/og";
import { formatBadgeCardDate, formatPersonName } from "@/lib/openbadges/v3/badge-page-display";
import { loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type RouteParams = { params: Promise<{ assertionId: string }> };

export default async function BadgeOpenGraphImage({ params }: RouteParams) {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  const name = badge?.name ?? "Open Badge";
  const holder = formatPersonName(badge?.recipientName) || badge?.recipientName || "Byound";
  const level = badge?.level != null ? `Niveau ${badge.level}` : "Open Badge 3.0";
  const issued = badge ? formatBadgeCardDate(badge.issuedAt) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050608",
        }}
      >
        <div
          style={{
            width: 760,
            height: 420,
            borderRadius: 30,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 40,
            color: "rgba(240,240,246,0.92)",
            background: "linear-gradient(135deg, #3B3C47 0%, #1C1D24 22%, #2F303A 41%, #121318 63%, #2B2C35 83%, #17181E 100%)",
            transform: "rotate(-8deg)",
            boxShadow: "18px 28px 50px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 800 }}>
            <span>Byound</span>
            <span style={{ display: "flex", color: "rgba(240,240,246,0.8)", fontSize: 18 }}>Open Badge 3.0</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>{name}</div>
            <div style={{ display: "flex", color: "#B9AEFF", fontSize: 22 }}>{level}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
            <span>{holder}</span>
            <span>{issued}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
