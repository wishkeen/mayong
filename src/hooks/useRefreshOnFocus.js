import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/** Change when navigation or window focus should refresh a page's data. */
export default function useRefreshOnFocus() {
  const [refreshKey, setRefreshKey] = useState(0);
  const lastRefresh = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastRefresh.current < 500) return;
      lastRefresh.current = now;
      setRefreshKey((key) => key + 1);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return `${location.key}:${refreshKey}`;
}
