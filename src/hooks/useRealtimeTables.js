import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";

/** Subscribe to scoped Postgres changes and expose a revision for data queries. */
export default function useRealtimeTables(tables, channelKey = "app") {
  const [revision, setRevision] = useState(0);
  const tableKey = useMemo(() => JSON.stringify(tables || []), [tables]);

  useEffect(() => {
    if (!supabase) return undefined;
    const subscriptions = JSON.parse(tableKey);
    if (!subscriptions.length) return undefined;
    let refreshTimer;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => setRevision((value) => value + 1), 100);
    };
    const channel = supabase.channel(`app-data:${channelKey}`);
    for (const subscription of subscriptions) {
      channel.on("postgres_changes", {
        event: subscription.event || "*",
        schema: "public",
        table: subscription.table,
        ...(subscription.filter ? { filter: subscription.filter } : {}),
      }, scheduleRefresh);
    }
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") scheduleRefresh();
    });
    return () => {
      window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [tableKey, channelKey]);

  return revision;
}
