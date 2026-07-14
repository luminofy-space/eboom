"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

const HEADER_OFFSET = 64;
const WHEEL_THRESHOLD = 72;
const WHEEL_RESET_MS = 200;
const SCROLL_DURATION = 1.05;
const SCROLL_EASE = "power1.inOut";

function getPanels() {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-landing-panel]")
  );
}

function panelTop(panel: HTMLElement) {
  return panel.getBoundingClientRect().top + window.scrollY;
}

function panelScrollTop(index: number) {
  const panels = getPanels();
  const panel = panels[index];
  if (!panel) return 0;
  return Math.max(0, panelTop(panel) - HEADER_OFFSET);
}

export function useLandingSnapScroll(
  enabled: boolean,
  onActiveChange?: Dispatch<SetStateAction<number>>
) {
  const activeIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollToPlugin }, { ScrollTrigger }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollToPlugin"),
          import("gsap/ScrollTrigger"),
        ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

      document.documentElement.classList.add("landing-no-scrollbar");

      const panels = getPanels();
      if (panels.length < 2) {
        cleanup = () => {
          document.documentElement.classList.remove("landing-no-scrollbar");
        };
        return;
      }

      const footer = document.querySelector<HTMLElement>("[data-landing-footer]");
      const footerScrollTop = () =>
        footer
          ? Math.max(0, panelTop(footer) - HEADER_OFFSET)
          : Infinity;

      const goToPanel = (index: number) => {
        if (index < 0 || index >= panels.length || isAnimatingRef.current) return;

        isAnimatingRef.current = true;
        activeIndexRef.current = index;
        onActiveChangeRef.current?.(index);
        wheelDeltaRef.current = 0;

        gsap.to(window, {
          scrollTo: { y: panelScrollTop(index), autoKill: false },
          duration: SCROLL_DURATION,
          ease: SCROLL_EASE,
          onComplete: () => {
            isAnimatingRef.current = false;
          },
        });
      };

      const scrollToFooter = () => {
        if (isAnimatingRef.current || !footer) return;

        isAnimatingRef.current = true;
        wheelDeltaRef.current = 0;

        gsap.to(window, {
          scrollTo: { y: footerScrollTop(), autoKill: false },
          duration: SCROLL_DURATION,
          ease: SCROLL_EASE,
          onComplete: () => {
            isAnimatingRef.current = false;
          },
        });
      };

      const getActiveIndex = () => {
        const marker = window.scrollY + HEADER_OFFSET + 20;
        let index = 0;

        panels.forEach((panel, i) => {
          if (marker >= panelTop(panel)) index = i;
        });

        return index;
      };

      const navigate = (direction: 1 | -1) => {
        const currentIndex = getActiveIndex();
        activeIndexRef.current = currentIndex;

        const inFooterZone =
          footer &&
          window.scrollY + HEADER_OFFSET >=
            panelTop(panels[panels.length - 1]!) +
              panels[panels.length - 1]!.offsetHeight -
              80;

        if (direction > 0) {
          if (inFooterZone) return;
          if (currentIndex < panels.length - 1) {
            goToPanel(currentIndex + 1);
          } else {
            scrollToFooter();
          }
          return;
        }

        if (inFooterZone) {
          goToPanel(panels.length - 1);
          return;
        }

        if (currentIndex > 0) {
          goToPanel(currentIndex - 1);
        }
      };

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();

        if (isAnimatingRef.current) return;

        wheelDeltaRef.current += event.deltaY;

        if (wheelResetTimerRef.current) {
          clearTimeout(wheelResetTimerRef.current);
        }
        wheelResetTimerRef.current = setTimeout(() => {
          wheelDeltaRef.current = 0;
        }, WHEEL_RESET_MS);

        if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) return;

        const direction = wheelDeltaRef.current > 0 ? 1 : -1;
        wheelDeltaRef.current = 0;
        navigate(direction);
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        if (isAnimatingRef.current) return;

        const direction = event.key === "ArrowDown" ? 1 : -1;
        event.preventDefault();
        navigate(direction);
      };

      const activeTriggers = panels.map((panel, index) =>
        ScrollTrigger.create({
          trigger: panel,
          start: `top ${HEADER_OFFSET + 10}px`,
          end: `bottom ${HEADER_OFFSET + 10}px`,
          onEnter: () => {
            activeIndexRef.current = index;
            onActiveChangeRef.current?.(index);
          },
          onEnterBack: () => {
            activeIndexRef.current = index;
            onActiveChangeRef.current?.(index);
          },
        })
      );

      ScrollTrigger.refresh();

      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKeyDown);

      cleanup = () => {
        document.documentElement.classList.remove("landing-no-scrollbar");
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKeyDown);
        if (wheelResetTimerRef.current) {
          clearTimeout(wheelResetTimerRef.current);
        }
        activeTriggers.forEach((trigger) => trigger.kill());
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [enabled]);
}

export function scrollToLandingPanel(index: number) {
  const panels = getPanels();
  const panel = panels[index];
  if (!panel) return;

  void (async () => {
    const [{ gsap }, { ScrollToPlugin }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollToPlugin"),
    ]);
    gsap.registerPlugin(ScrollToPlugin);
    gsap.to(window, {
      scrollTo: { y: panelScrollTop(index), autoKill: false },
      duration: SCROLL_DURATION,
      ease: SCROLL_EASE,
    });
  })();
}
