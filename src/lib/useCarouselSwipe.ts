import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";

const SWIPE_THRESHOLD_PX = 48;
const HORIZONTAL_RATIO = 1.15;

function useIsBelowWidthPx(px: number) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${px}px)`).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [px]);
  return matches;
}

/**
 * Touch swipe to prev/next on narrow viewports. Same shape as tuscany's
 * helper — no changes.
 */
export function useCarouselSwipe(options: {
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  mobileOnly?: boolean;
  maxWidthPx?: number;
}) {
  const { onPrev, onNext, disabled = false, mobileOnly = true, maxWidthPx = 639 } = options;
  const narrow = useIsBelowWidthPx(maxWidthPx);
  const active = !disabled && (!mobileOnly || narrow);

  const x0 = useRef(0);
  const y0 = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      tracking.current = true;
      x0.current = e.touches[0].clientX;
      y0.current = e.touches[0].clientY;
    },
    [active]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!active || !tracking.current) {
        tracking.current = false;
        return;
      }
      tracking.current = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - x0.current;
      const dy = t.clientY - y0.current;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return;
      if (dx < 0) onNext();
      else onPrev();
    },
    [active, onNext, onPrev]
  );

  const onTouchCancel = useCallback(() => {
    tracking.current = false;
  }, []);

  const swipeHandlers = active
    ? ({
        onTouchStartCapture: onTouchStart,
        onTouchEndCapture: onTouchEnd,
        onTouchCancelCapture: onTouchCancel,
      } as const)
    : ({} as const);

  return {
    swipeHandlers,
    swipeTouchAction: active ? ("pan-y" as const) : undefined
  };
}
