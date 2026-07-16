import { ImageResponse } from "next/og";

export const alt = "Vim Ustası — Oyunla Vim Öğren";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#070c08",
        color: "#86efac",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
      }}
    >
      <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: 8 }}>VIM USTASI</div>
      <div style={{ color: "#cde8d5", fontSize: 32, marginTop: 24 }}>
        Oyunla Vim öğren · Gerçek editör · Tamamen ücretsiz
      </div>
    </div>,
    size
  );
}
