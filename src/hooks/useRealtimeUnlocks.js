import { useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";

/** Refreshes protected access data when the signed-in user's access changes. */
export default function useRealtimeUnlocks(userId, onChange) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!userId || !supabase) return undefined;
    const refresh = (payload) => onChangeRef.current?.(payload);
    const channel = supabase
      .channel(`unlock-access:${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "entitlements",
        filter: `user_id=eq.${userId}`,
      }, refresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "ritual_unlock_requests",
        filter: `user_id=eq.${userId}`,
      }, refresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refresh();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
