import * as React from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const MOBILE_MQ = "(max-width: 767px)";

function getInitialIsMobile() {
  if (typeof window === "undefined") return true;
  return window.matchMedia(MOBILE_MQ).matches;
}

/** True when landing should skip heavy GPU/motion (mobile or reduced-motion). */
export function useLandingLightEffects() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isMobile, setIsMobile] = React.useState(getInitialIsMobile);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MQ);
    const onChange = () => setIsMobile(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion || isMobile;
}
