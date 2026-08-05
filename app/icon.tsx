import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#315cf5",
          color: "#f3f1ea",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          fontSize: 25,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-2px",
          width: "100%",
        }}
      >
        RJ
      </div>
    ),
    size,
  );
}
