"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const HEADER_OFFSET = 64;
const WHEEL_THRESHOLD = 40;
const SCROLL_COOLDOWN_MS = 900;

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function getPanels() {
  return gsap.utils.toArray<HTMLElement>("[data-landing-panel]");
}

function panelScrollTop(index: number) {
  const panels = getPanels();
  const panel = panels[index];
  if (!panel) return 0;
  return Math.max(0, panel.offsetTop - HEADER_OFFSET);
}

export function useLandingSnapScroll(
  enabled: boolean,
  onActiveChange?: Dispatch<SetStateAction<number>>
) {
  const activeIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const lastWheelRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("landing-no-scrollbar");

    const panels = getPanels();
    if (panels.length < 2) {
      return () => {
        document.documentElement.classList.remove("landing-no-scrollbar");
      };
    }

    const footer = document.querySelector<HTMLElement>("[data-landing-footer]");
    const footerTop = () =>
      footer ? Math.max(0, footer.offsetTop - HEADER_OFFSET) : Infinity;

    const goToPanel = (index: number) => {
      if (index < 0 || index >= panels.length || isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      activeIndexRef.current = index;
      onActiveChange?.(index);

      gsap.to(window, {
        scrollTo: { y: panelScrollTop(index), autoKill: false },
        duration: 0.55,
        ease: "power2.inOut",
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      });
    };

    const scrollToFooter = () => {
      if (isAnimatingRef.current || !footer) return;

      isAnimatingRef.current = true;
      gsap.to(window, {
        scrollTo: { y: footerTop(), autoKill: false },
        duration: 0.55,
        ease: "power2.inOut",
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      });
    };

    const getActiveIndex = () => {
      const scrollY = window.scrollY + HEADER_OFFSET + 20;
      let index = 0;

      panels.forEach((panel, i) => {
        if (scrollY >= panel.offsetTop) index = i;
      });

      return index;
    };

    const canScrollInner = (deltaY: number) => {
      const inner = document.querySelector<HTMLElement>("[data-panel-scroll]");
      if (!inner || getActiveIndex() !== 2) return false;

      if (deltaY > 0) {
        return inner.scrollTop + inner.clientHeight < inner.scrollHeight - 2;
      }
      return inner.scrollTop > 2;
    };

    const onWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      const now = Date.now();
      if (now - lastWheelRef.current < SCROLL_COOLDOWN_MS) {
        event.preventDefault();
        return;
      }

      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;

      const currentIndex = getActiveIndex();
      activeIndexRef.current = currentIndex;

      const inFooterZone =
        footer &&
        window.scrollY + HEADER_OFFSET >=
          panels[panels.length - 1]!.offsetTop +
            panels[panels.length - 1]!.offsetHeight -
            80;

      if (canScrollInner(event.deltaY)) return;

      if (inFooterZone) {
        if (event.deltaY < 0) {
          event.preventDefault();
          lastWheelRef.current = now;
          goToPanel(panels.length - 1);
        }
        return;
      }

      if (event.deltaY > 0) {
        if (currentIndex < panels.length - 1) {
          event.preventDefault();
          lastWheelRef.current = now;
          goToPanel(currentIndex + 1);
        } else {
          event.preventDefault();
          lastWheelRef.current = now;
          scrollToFooter();
        }
        return;
      }

      if (event.deltaY < 0 && currentIndex > 0) {
        event.preventDefault();
        lastWheelRef.current = now;
        goToPanel(currentIndex - 1);
      }
    };

    const activeTriggers = panels.map((panel, index) =>
      ScrollTrigger.create({
        trigger: panel,
        start: `top ${HEADER_OFFSET + 10}px`,
        end: `bottom ${HEADER_OFFSET + 10}px`,
        onEnter: () => {
          activeIndexRef.current = index;
          onActiveChange?.(index);
        },
        onEnterBack: () => {
          activeIndexRef.current = index;
          onActiveChange?.(index);
        },
      })
    );

    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      document.documentElement.classList.remove("landing-no-scrollbar");
      window.removeEventListener("wheel", onWheel);
      activeTriggers.forEach((trigger) => trigger.kill());
    };
  }, [enabled, onActiveChange]);
}

export function scrollToLandingPanel(index: number) {
  const panels = getPanels();
  const panel = panels[index];
  if (!panel) return;

  gsap.to(window, {
    scrollTo: { y: panelScrollTop(index), autoKill: false },
    duration: 0.55,
    ease: "power2.inOut",
  });
}
