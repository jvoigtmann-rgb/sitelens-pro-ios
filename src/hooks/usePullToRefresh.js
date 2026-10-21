import { useEffect, useRef, useState } from "react";

/**
 * Simple pull-to-refresh hook for mobile WebView.
 * @param {Function} onRefresh - async callback to call on pull
 * @param {number} threshold - px to pull before triggering (default 72)
 */
export function usePullToRefresh(onRefresh, threshold = 72) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullDistance = useRef(0);

  useEffect(() => {
    const el = document.documentElement;

    const onTouchStart = (e) => {
      // Don't hijack gestures that start inside an interactive map
      if (e.target?.closest?.(".leaflet-container")) return;
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && el.scrollTop === 0) {
        pullDistance.current = delta;
        if (delta > 20) setPulling(true);
      }
    };

    const onTouchEnd = async () => {
      if (pullDistance.current >= threshold && !refreshing) {
        setRefreshing(true);
        setPulling(false);
        await onRefresh();
        setRefreshing(false);
      } else {
        setPulling(false);
      }
      startY.current = null;
      pullDistance.current = 0;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, threshold, refreshing]);

  return { pulling, refreshing };
}
