import { ImageResponse } from "next/og";
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
  const holder = badge?.recipientName ?? "Byound";
  const level = badge?.level != null ? `Niveau ${badge.level}` : "Open Badge";

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
            width: 860,
            height: 460,
            borderRadius: 30,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 48,
            color: "#F2F2F4",
            background: "linear-gradient(125deg, #1A1B22, #2C2D36 28%, #15161C 52%, #33343F 74%, #17181E)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
            <span style={{ fontWeight: 700 }}>Byound</span>
            <span style={{ color: "rgba(242,242,244,0.6)" }}>{level}</span>
          </div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, letterSpacing: -1.5 }}>{name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
            <span>{holder}</span>
            <span style={{ color: "#A99BFF" }}>Open Badge</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
