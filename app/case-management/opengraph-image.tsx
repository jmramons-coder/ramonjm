import { ImageResponse } from "next/og";

export const alt = "Case Management Platform — Task in focus. Case in context.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "60px",
        background: "#0b0d11",
        color: "#f4f6fa",
        fontFamily: "sans-serif",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 21,
          color: "#a0aec1",
        }}
      >
        <span>Ramon JM / Product design</span>
        <span>Amplify · Case Management</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 80,
          fontWeight: 500,
          letterSpacing: -5,
          lineHeight: 1.05,
        }}
      >
        <span>Task in focus.</span>
        <span style={{ color: "#91b8f0" }}>Case in context.</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 18,
          color: "#a0aec1",
        }}
      >
        {["Request", "Case", "Task", "Requirement", "Galia"].map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              padding: "15px 25px",
              border: "1px solid #3b4d68",
              borderRadius: 12,
              background: "#151e2c",
              color: "#c8dcf8",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
