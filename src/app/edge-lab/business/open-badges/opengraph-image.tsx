import { ImageResponse } from "next/og";

export const alt = "Badge Byound — Négociation commerciale, Camille R.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
            width: 820,
            height: 460,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 44,
            borderRadius: 36,
            color: "#F2F2F4",
            background: "linear-gradient(125deg, #1A1B22, #2C2D36 28%, #15161C 52%, #33343F 74%, #17181E)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 800 }}>
            <span>Byound</span>
            <span style={{ display: "flex", alignItems: "center", color: "#2FD08A" }}>
              <span style={{ width: 16, height: 16, borderRadius: 8, background: "#2FD08A", marginRight: 8 }} />
              Vérifié
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 22,
                background: "linear-gradient(135deg, #C9C2FF, #7E6CFF 40%, #8FF2C4 72%, #F5C85C)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, color: "rgba(255,255,255,0.65)" }}>Open Badge</span>
              <span style={{ fontSize: 46, fontWeight: 800 }}>Négociation commerciale</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Titulaire</span>
              <span style={{ fontWeight: 800 }}>Camille R.</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Date</span>
              <span style={{ fontWeight: 800 }}>Mars 2026</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
