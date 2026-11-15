import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/api/supabaseClient";

export default function DatabaseSettings() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const checkConnection = async () => {
      if (!isSupabaseConfigured) {
        setStatus("unconfigured");
        setMessage("Set the Supabase URL and publishable key in the deployment environment.");
        return;
      }

      const { error } = await supabase.from("categories").select("id").limit(1);
      if (!active) return;
      if (error) {
        console.error("Supabase database check failed:", error);
        setStatus("failed");
        setMessage(error.message || "The database schema could not be reached.");
      } else {
        setStatus("connected");
        setMessage("Supabase is reachable and the app schema is available.");
      }
    };

    checkConnection();
    return () => { active = false; };
  }, []);

  const isConnected = status === "connected";
  const Icon = status === "checking" ? Loader2 : isConnected ? CheckCircle2 : AlertCircle;
  const label = status === "checking" ? "Checking" : isConnected ? "Connected" : "Needs setup";

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#171522] p-5">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-[#D6B56A]" />
        <h3 className="text-sm font-medium text-[#F5F1E8]">Primary database</h3>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Icon className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : isConnected ? "text-[#8fd6ab]" : "text-[#e0a0a0]"}`} />
        <span className="text-[#F5F1E8]">{label}</span>
      </div>
      <p className="text-xs leading-relaxed text-[#AAA5B5]">{message}</p>
      <p className="text-[11px] leading-relaxed text-[#AAA5B5]">
        This app uses Supabase for its data and authentication. Never put a Supabase service-role key in the browser or a VITE_ variable.
      </p>
    </section>
  );
}
