import { ImageResponse } from "next/og";

export const alt =
  "aBeam — Be present. Keep every detail. An AI copilot for travel advisors, by Ramon JM.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AbeamOpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: "60px 66px",
        background: "#f1f6fc",
        color: "#132c43",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-1px",
          }}
        >
          aBeam
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 16,
            color: "#65788a",
          }}
        >
          A copilot for travel advisors
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 63,
            fontSize: 78,
            letterSpacing: "-4px",
            lineHeight: 1.06,
          }}
        >
          <span>Be present.</span>
          <span style={{ color: "#176de5" }}>Keep every detail.</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 22,
            borderTop: "1px solid #d5e0ed",
            justifyContent: "space-between",
            fontSize: 16,
            color: "#65788a",
          }}
        >
          <span>Product design & development</span>
          <span>Ramon JM</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 70,
          top: 95,
          width: 265,
          height: 265,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 28% 20%, #d4eeff, #2787f5 58%, #075cc4)",
          boxShadow: "0 25px 60px #287be52b",
        }}
      />
    </div>,
    size,
  );
}
