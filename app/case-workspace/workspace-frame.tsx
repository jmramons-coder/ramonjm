"use client";

import { useState } from "react";
import { CaseConceptDemo } from "../case-workspace-prototype";
import { useCaseFrameEvents } from "./frame-events";

export function CaseWorkspaceFrame() {
  const [paused, setPaused] = useState(false);
  useCaseFrameEvents(setPaused);
  return <CaseConceptDemo paused={paused} />;
}
