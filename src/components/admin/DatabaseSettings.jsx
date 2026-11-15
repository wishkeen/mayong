import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Database, ShieldCheck, Pencil, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import DatabaseCredentialForm from "./DatabaseCredentialForm";

const PROVIDER_LABEL = { supabase: "Supabase", firebase: "Firebase" };

const STATUS = {
  connected: { cls: "bg-[#7fbf9a]/15 text-[#8fd6ab]", icon: CheckCircle2, text: "Connected" },
  failed: { cls: "bg-[#c97a7a]/15 text-[#e0a0a0]", icon: AlertCircle, text: "Failed" },
  untested: { cls: "bg-white/5 text-[#AAA5B5]", icon: Clock, text: "Not tested" },
};

function getRequestError(error, fallback, functionName) {
  const message = error?.response?.data?.error;
  if (message) return message;
  if (error?.response?.status === 404) {
    return `The Base44 backend function "${functionName}" was not found (404).`;
  }
  return error?.message || fallback;
}

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.untested;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${s.cls}`}>
      <Icon className="w-3 h-3" /> {s.text}
    </span>
  );
}

export default function DatabaseSettings() {
  const { demoMode } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("databaseCredentials", { action: "list" });
      setItems(res.data.items || []);
    } catch (e) {
      setError(getRequestError(e, "Could not load your database connections.", "databaseCredentials"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (demoMode) {
      setLoading(false);
      return;
    }
    load();
  }, [demoMode]);

  const test = async (item) => {
    setBusyId(item.id);
    setError("");
    try {
      const res = await base44.functions.invoke("testDatabaseConnection", { id: item.id });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...res.data.item } : i)));
    } catch (e) {
      setError(getRequestError(e, "The connection test could not run.", "testDatabaseConnection"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    if (!confirm(`Remove the ${PROVIDER_LABEL[item.provider]} connection "${item.label}"?`)) return;
    setBusyId(item.id);
    setError("");
    try {
      await base44.functions.invoke("databaseCredentials", { action: "remove", id: item.id });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError(getRequestError(e, "Could not remove this connection.", "databaseCredentials"));
    } finally {
      setBusyId(null);
    }
  };

  if (demoMode) {
    return (
      <div className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4">
        <p className="text-sm text-[#F5F1E8]">A connected Base44 backend is required.</p>
        <p className="text-[11px] leading-relaxed text-[#AAA5B5] mt-1">
          External database connections are unavailable in the local demo. Link this checkout to your Base44 app
          and run it with <code>base44 dev</code> to use the server-side connection functions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#D6B56A] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[#F5F1E8]">Database connections</p>
          <p className="text-[11px] leading-relaxed text-[#AAA5B5] mt-1">
            Your rituals, members and journals live in RitualOS's built-in database — nothing here changes that.
            Add a Supabase or Firebase project when a backend job needs to read or write your own external database.
            Keys are held server-side; only their last four characters are ever shown again.
          </p>
        </div>
      </div>

      <button
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm inline-flex items-center justify-center gap-2 glow-gold"
      >
        <Plus className="w-4 h-4" /> New connection
      </button>

      {error && <p className="text-xs text-[#e0a0a0]">{error}</p>}

      {loading ? (
        <div className="h-24 rounded-2xl bg-[#171522] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-6 text-center">
          <Database className="w-6 h-6 text-[#55506A] mx-auto mb-2" />
          <p className="text-sm text-[#AAA5B5]">No external database connected yet.</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/5 bg-[#171522] p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest text-[#D6B56A]">
                {PROVIDER_LABEL[item.provider] || item.provider}
              </span>
              <StatusPill status={item.status} />
            </div>
            <h3 className="font-display text-lg text-[#F5F1E8] truncate">{item.label}</h3>
            <p className="text-xs text-[#AAA5B5] truncate">{item.project_url || item.project_id || "—"}</p>
            <p className="text-[11px] text-[#AAA5B5] mt-1 font-mono">
              {item.has_key ? item.key_preview : "No key saved"}
            </p>

            {item.status_message && <p className="text-[11px] text-[#AAA5B5] mt-2">{item.status_message}</p>}
            {item.last_tested_at && (
              <p className="text-[10px] text-[#55506A] mt-1">
                Tested {new Date(item.last_tested_at).toLocaleString()}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => test(item)}
                disabled={busyId === item.id}
                className="px-3 py-1.5 rounded-lg border border-[#D6B56A]/40 text-[#D6B56A] text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${busyId === item.id ? "animate-spin" : ""}`} />
                {busyId === item.id ? "Testing…" : "Test"}
              </button>
              <button
                onClick={() => { setEditing(item); setFormOpen(true); }}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-[#AAA5B5] text-xs inline-flex items-center gap-1.5"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => remove(item)}
                disabled={busyId === item.id}
                className="px-3 py-1.5 rounded-lg border border-[#c97a7a]/30 text-[#c97a7a] text-xs inline-flex items-center gap-1.5 ml-auto disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        ))
      )}

      <DatabaseCredentialForm
        open={formOpen}
        credential={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); load(); }}
      />
    </div>
  );
}