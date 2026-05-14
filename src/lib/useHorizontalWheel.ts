import { useEffect, useRef } from 'react';

/**
 * Attach to a horizontally-scrolling container to translate vertical mouse
 * wheel deltas into horizontal scroll. Lets desktop users scroll chip rows
 * with a normal scroll wheel.
 */
export function useHorizontalWheel<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Already a horizontal scroll (trackpad, shift+wheel) — let it through
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      // No room to scroll horizontally — let the page scroll
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return ref;
}
