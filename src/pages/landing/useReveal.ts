import { useEffect, type RefObject } from "react";

/**
 * Revela una sola vez los elementos `[data-reveal]` dentro de `root` cuando
 * entran en pantalla. Lo que ya está visible al montar se marca al instante
 * (sin parpadeo), y recién ahí se activa el estado oculto con `.lp-js`.
 */
export function useRevealOnScroll(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    const fold = window.innerHeight * 0.92;
    const pending = targets.filter((t) => {
      if (t.getBoundingClientRect().top < fold) {
        t.classList.add("is-in");
        return false;
      }
      return true;
    });
    el.classList.add("lp-js");

    if (!("IntersectionObserver" in window)) {
      pending.forEach((t) => t.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    pending.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [root]);
}

/** Dispara `onEnter` una vez cuando `target` entra en pantalla. */
export function useInViewOnce(target: RefObject<Element | null>, onEnter: () => void) {
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      onEnter();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onEnter();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // onEnter se lee una sola vez a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
