"use client";

import ShaderOrb from "./shader-orb";

type AbeamVideoProps = {
  alwaysPlay?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/** The current aBeam identity, with the original media component API retained. */
export function AbeamVideo({ className = "" }: AbeamVideoProps) {
  return (
    <span
      className={`abeam-video${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <ShaderOrb tone="blue" animated edge="smooth" />
    </span>
  );
}
