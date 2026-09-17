import { ImageResponse } from "next/og";
import { portfolio, projects } from "./portfolio-content";

export const alt = `${portfolio.name} — ${portfolio.headline} ${portfolio.intro.join(" ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "56px 64px", background: "#f7f7f7", color: "#0e0e0e", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 14, background: "#000", color: "#fff", fontSize: 42, fontWeight: 700 }}>R</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 24 }}>{portfolio.name}</div>
            <div style={{ fontSize: 19, color: "#646464" }}>{portfolio.role}</div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 64, fontSize: 76, fontWeight: 700, letterSpacing: "-3px", lineHeight: 1.1 }}>{portfolio.headline}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 24, fontSize: 28, lineHeight: 1.5, color: "#646464" }}>
          {portfolio.intro.map((line) => <div key={line}>{line}</div>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingTop: 24, borderTop: "1px solid #dedede", gap: 14 }}>
          <div style={{ fontSize: 18, color: "#646464" }}>Side projects · Design & development</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
            {projects.map((project) => <div key={project.slug}>{project.name}</div>)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
