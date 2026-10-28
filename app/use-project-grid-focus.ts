"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/** Pointer tracking stays outside React so the live project previews keep playing. */
export function useProjectGridFocus(
  gridRef: RefObject<HTMLDivElement | null>,
) {
  const resetRef = useRef<() => void>(() => {});
  const resetFocus = useCallback(() => resetRef.current(), []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const mouse = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let active: HTMLElement | null = null;

    function clear() {
      active?.removeAttribute("data-focus-active");
      active = null;
      grid!.removeAttribute("data-grid-focus");
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
    }

    function focus(event: FocusEvent) {
      if (document.querySelector("dialog[open]")) return;
      const tile = tileFor(event.target);
      if (tile && event.target instanceof Element && event.target.matches(":focus-visible")) {
        activate(tile, "keyboard");
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
  }, [gridRef]);

  return { resetFocus };
}
