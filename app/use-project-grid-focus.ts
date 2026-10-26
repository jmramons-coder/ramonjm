"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** Pointer tracking stays outside React so the live project previews keep playing. */
export function useProjectGridFocus(
  gridRef: RefObject<HTMLDivElement | null>,
  hintRef: RefObject<HTMLDivElement | null>,
) {
  const [hintVisible, setHintVisible] = useState(false);
  const resetRef = useRef<() => void>(() => {});
  const resetFocus = useCallback(() => resetRef.current(), []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const mouse = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let active: HTMLElement | null = null;
    let hintShown = false;
    let frame = 0;
    let x = 0;
    let y = 0;

    function showHint(visible: boolean) {
      visible = visible && Boolean(hintRef.current?.showPopover);
      if (visible === hintShown) return;
      hintShown = visible;
      grid!.toggleAttribute("data-discovery-hint-visible", visible);
      setHintVisible(visible);
    }

    function clear() {
      active?.removeAttribute("data-focus-active");
      active = null;
      grid!.removeAttribute("data-grid-focus");
      showHint(false);
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function tileFor(target: EventTarget | null) {
      const tile = target instanceof Element
        ? target.closest<HTMLElement>('[data-piece][role="listitem"]')
        : null;
      return tile?.parentElement === grid ? tile : null;
    }

    function activate(tile: HTMLElement, mode: "pointer" | "keyboard") {
      if (active !== tile) {
        active?.removeAttribute("data-focus-active");
        active = tile;
        active.setAttribute("data-focus-active", "");
      }
      grid!.dataset.gridFocus = mode;
    }

    function openerFor(target: EventTarget | null) {
      const opener = target instanceof Element
        ? target.closest<HTMLButtonElement>('button[aria-haspopup="dialog"]')
        : null;
      return opener && !opener.disabled && opener.getAttribute("aria-disabled") !== "true"
        && grid!.contains(opener) ? opener : null;
    }

    function positionHint() {
      frame = 0;
      const hint = hintRef.current;
      if (!hint) return;
      const width = hint.offsetWidth || 204;
      const height = hint.offsetHeight || 72;
      const left = Math.max(16, Math.min(x + 20, innerWidth - width - 16));
      const top = y + height + 40 > innerHeight ? y - height - 24 : y + 24;
      hint.style.setProperty("--discover-x", `${left}px`);
      hint.style.setProperty("--discover-y", `${Math.max(16, top)}px`);
    }

    function pointer(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !mouse.matches || document.querySelector("dialog[open]")) {
        clear();
        return;
      }
      const tile = tileFor(event.target);
      if (!tile) {
        clear();
        return;
      }
      activate(tile, "pointer");
      x = event.clientX;
      y = event.clientY;
      const discover = Boolean(openerFor(event.target));
      if (discover && !hintShown) positionHint();
      showHint(discover);
      if (discover && !frame) frame = requestAnimationFrame(positionHint);
    }

    function focus(event: FocusEvent) {
      if (document.querySelector("dialog[open]")) return;
      const tile = tileFor(event.target);
      if (tile && event.target instanceof Element && event.target.matches(":focus-visible")) {
        activate(tile, "keyboard");
        showHint(false);
      }
    }

    function blur(event: FocusEvent) {
      if (!(event.relatedTarget instanceof Node) || !grid!.contains(event.relatedTarget)) clear();
    }

    function click(event: MouseEvent) {
      // Restore colors before a project measures its opening animation.
      if (openerFor(event.target)) clear();
    }

    function scroll() {
      if (grid!.dataset.gridFocus === "pointer") clear();
    }

    function key(event: KeyboardEvent) {
      if (event.key === "Escape") clear();
    }

    resetRef.current = clear;
    grid.addEventListener("pointerover", pointer);
    grid.addEventListener("pointermove", pointer);
    grid.addEventListener("pointerleave", clear);
    grid.addEventListener("focusin", focus);
    grid.addEventListener("focusout", blur);
    grid.addEventListener("click", click, true);
    window.addEventListener("blur", clear);
    window.addEventListener("resize", clear);
    window.addEventListener("scroll", scroll, true);
    document.addEventListener("visibilitychange", clear);
    document.addEventListener("keydown", key);
    mouse.addEventListener("change", clear);

    return () => {
      resetRef.current = () => {};
      active?.removeAttribute("data-focus-active");
      grid.removeAttribute("data-grid-focus");
      grid.removeAttribute("data-discovery-hint-visible");
      cancelAnimationFrame(frame);
      grid.removeEventListener("pointerover", pointer);
      grid.removeEventListener("pointermove", pointer);
      grid.removeEventListener("pointerleave", clear);
      grid.removeEventListener("focusin", focus);
      grid.removeEventListener("focusout", blur);
      grid.removeEventListener("click", click, true);
      window.removeEventListener("blur", clear);
      window.removeEventListener("resize", clear);
      window.removeEventListener("scroll", scroll, true);
      document.removeEventListener("visibilitychange", clear);
      document.removeEventListener("keydown", key);
      mouse.removeEventListener("change", clear);
    };
  }, [gridRef, hintRef]);

  return { hintVisible, resetFocus };
}
