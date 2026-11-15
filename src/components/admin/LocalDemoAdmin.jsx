import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_TABS } from "@/lib/adminTabs";
import LocalDemoCategoryForm from "@/components/admin/LocalDemoCategoryForm";
import LocalDemoRitualForm from "@/components/admin/LocalDemoRitualForm";
import { localDemoAccount } from "@/lib/localDemo";
import {
  getLocalDemoCatalog,
  resetLocalDemoCatalog,
  saveLocalDemoCatalog,
} from "@/lib/localDemoStore";
import { formatPrice } from "@/lib/rituals";

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#171522] p-4">
      <div className="font-display text-3xl text-[#F5F1E8] leading-none">{value}</div>
      <div className="text-[11px] text-[#AAA5B5] uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <p className="rounded-xl border border-white/5 bg-[#171522] p-5 text-sm text-[#AAA5B5]">
      {children}
    </p>
  );
}

export default function LocalDemoAdmin() {
  const [catalog, setCatalog] = useState(getLocalDemoCatalog);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  const commit = (nextCatalog) => {
    try {
      saveLocalDemoCatalog(nextCatalog);
      setCatalog(nextCatalog);
      setEditor(null);
      setError("");
    } catch (saveError) {
      console.error("Failed to save the local demo catalog:", saveError);
      setError("Could not save changes in this browser. Check local storage settings and try again.");
    }
  };

  const saveCategory = (values) => {
    const categoryId = editor.category?.id || `demo-category-${crypto.randomUUID()}`;
    if (catalog.categories.some((category) => category.id !== categoryId && category.slug === values.slug)) {
      setError("Each category must have a unique slug.");
      return;
    }
    const existing = catalog.categories.some((category) => category.id === categoryId);
    const category = { ...editor.category, ...values, id: categoryId, sort_order: editor.category?.sort_order ?? catalog.categories.length };
    const categories = existing
      ? catalog.categories.map((item) => item.id === categoryId ? category : item)
      : [...catalog.categories, category];
    commit({ ...catalog, categories });
  };

  const saveRitual = (values) => {
    const ritualId = editor.ritual?.id || `demo-ritual-${crypto.randomUUID()}`;
    const existing = catalog.rituals.some((ritual) => ritual.id === ritualId);
    const ritual = { ...editor.ritual, ...values, id: ritualId, sort_order: editor.ritual?.sort_order ?? catalog.rituals.length };
    const rituals = existing
      ? catalog.rituals.map((item) => item.id === ritualId ? ritual : item)
      : [...catalog.rituals, ritual];
    commit({ ...catalog, rituals });
  };

  const togglePublish = (ritual) => {
    commit({
      ...catalog,
      rituals: catalog.rituals.map((item) => item.id === ritual.id ? { ...item, is_published: !item.is_published } : item),
    });
  };

  const deleteRitual = (ritual) => {
    if (!window.confirm(`Delete "${ritual.name}" from this browser's demo catalog?`)) return;
    commit({ ...catalog, rituals: catalog.rituals.filter((item) => item.id !== ritual.id) });
  };

  const deleteCategory = (category) => {
    if (!window.confirm(`Delete "${category.name}"? Its rituals will become uncategorized.`)) return;
    commit({
      categories: catalog.categories.filter((item) => item.id !== category.id),
      rituals: catalog.rituals.map((ritual) => ritual.category_id === category.id
        ? { ...ritual, category_id: "", category_slug: "", category_name: "" }
        : ritual),
    });
  };

  const exportCatalog = () => {
    const file = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ritualos-demo-catalog.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetCatalog = () => {
    if (!window.confirm("Reset this browser's demo catalog to the original sample rituals and categories?")) return;
    try {
      setCatalog(resetLocalDemoCatalog());
      setError("");
    } catch (resetError) {
      console.error("Failed to reset the local demo catalog:", resetError);
      setError("Could not reset the local demo catalog. Check local storage settings and try again.");
    }
  };

  const publishedRituals = catalog.rituals.filter((ritual) => ritual.is_published);
  const revenue = 0;

  return (
    <div className="min-h-screen bg-mystic text-[#F5F1E8] max-w-3xl mx-auto px-5 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6B56A] to-[#8B6CCF] flex items-center justify-center glow-gold">
            <span className="text-sm text-[#08070D]">✦</span>
          </span>
          <div>
            <h1 className="font-display text-2xl leading-none">RitualOS Admin</h1>
            <p className="text-[11px] text-[#AAA5B5]">Signed in as {localDemoAccount.email} · Local demo admin</p>
          </div>
        </div>
        <Link to="/" className="text-xs text-[#AAA5B5] hover:text-[#D6B56A]">View app →</Link>
      </header>

      <div className="mb-5 rounded-xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-3 text-xs leading-relaxed text-[#AAA5B5]">
        Demo mode: changes are saved in this browser only. They do not update a live Base44 app.
      </div>

      <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-5 px-5">
        {ADMIN_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-current={tab === key ? "page" : undefined}
            onClick={() => { setTab(key); setEditor(null); setError(""); }}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border inline-flex items-center gap-1.5 transition-colors ${
              tab === key ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]" : "border-white/10 text-[#AAA5B5] bg-[#171522]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </nav>

      {error && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {editor?.type === "category" ? (
        <LocalDemoCategoryForm category={editor.category} onSave={saveCategory} onCancel={() => setEditor(null)} />
      ) : editor?.type === "ritual" ? (
        <LocalDemoRitualForm ritual={editor.ritual} categories={catalog.categories} onSave={saveRitual} onCancel={() => setEditor(null)} />
      ) : tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Rituals" value={catalog.rituals.length} />
            <Metric label="Users" value={1} />
            <Metric label="Purchases" value={0} />
            <Metric label="Completions" value={0} />
          </div>
          <div className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4">
            <div className="text-[11px] text-[#AAA5B5] uppercase tracking-widest">Revenue (paid orders)</div>
            <div className="font-display text-3xl text-[#D6B56A]">{formatPrice(revenue)}</div>
            <p className="mt-1 text-xs text-[#AAA5B5]">Purchases and revenue are not simulated in local demo mode.</p>
          </div>
          <section className="rounded-2xl border border-white/5 bg-[#171522] p-4">
            <h2 className="text-xs uppercase tracking-widest text-[#AAA5B5] mb-3">Recently published</h2>
            {publishedRituals.length === 0 ? <EmptyState>No published rituals yet.</EmptyState> : (
              <div className="space-y-2">
                {publishedRituals.slice(0, 5).map((ritual) => (
                  <div key={ritual.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{ritual.name}</span>
                    <span className="text-[#D6B56A] text-xs">{formatPrice(ritual.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : tab === "rituals" ? (
        <section className="space-y-3">
          <button onClick={() => setEditor({ type: "ritual" })} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm">
            + New Ritual
          </button>
          {catalog.rituals.length === 0 ? <EmptyState>No rituals yet. Create one to get started.</EmptyState> : catalog.rituals.map((ritual) => (
            <article key={ritual.id} className="rounded-2xl border border-white/5 bg-[#171522] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">{ritual.category_name || "Uncategorized"} · {ritual.difficulty}</p>
                  <h2 className="font-display text-lg truncate">{ritual.name}</h2>
                  <p className="text-xs text-[#AAA5B5]">{formatPrice(ritual.price)} · {ritual.duration_minutes}m · {ritual.steps?.length || 0} steps</p>
                  <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${ritual.is_published ? "bg-[#D6B56A]/15 text-[#D6B56A]" : "bg-white/5 text-[#AAA5B5]"}`}>
                    {ritual.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <button onClick={() => togglePublish(ritual)} className="shrink-0 rounded-lg border border-[#D6B56A]/40 px-3 py-2 text-xs text-[#D6B56A]">
                  {ritual.is_published ? "Unpublish" : "Publish"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <button onClick={() => setEditor({ type: "ritual", ritual })} className="text-[#D6B56A]">Edit</button>
                {ritual.is_published && <Link to={`/ritual/${ritual.id}`} className="text-[#AAA5B5]">View</Link>}
                <button onClick={() => deleteRitual(ritual)} className="ml-auto text-[#c97a7a]">Delete</button>
              </div>
            </article>
          ))}
        </section>
      ) : tab === "categories" ? (
        <section className="space-y-3">
          <button onClick={() => setEditor({ type: "category" })} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm">
            + New Category
          </button>
          {catalog.categories.length === 0 ? <EmptyState>No categories yet. Create one to organize rituals.</EmptyState> : catalog.categories.map((category) => (
            <article key={category.id} className="rounded-2xl border border-white/5 bg-[#171522] p-4 flex items-center gap-3">
              <span className="text-2xl">{category.icon || "✦"}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg truncate">{category.name}</h2>
                <p className="text-xs text-[#AAA5B5] truncate">/{category.slug} · {category.description || "No description"}</p>
              </div>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setEditor({ type: "category", category })} className="text-[#D6B56A]">Edit</button>
                <button onClick={() => deleteCategory(category)} className="text-[#c97a7a]">Delete</button>
              </div>
            </article>
          ))}
        </section>
      ) : tab === "users" ? (
        <section className="space-y-2">
          <div className="rounded-xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-3 text-xs text-[#AAA5B5]">
            This list contains the local demo identity only; it is not connected to Base44 accounts.
          </div>
          <article className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171522] px-4 py-3">
            <div>
              <p className="text-sm">{localDemoAccount.email}</p>
              <p className="text-xs text-[#AAA5B5]">{localDemoAccount.full_name}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6B56A]/15 text-[#D6B56A]">admin</span>
          </article>
        </section>
      ) : tab === "orders" ? (
        <EmptyState>No purchases in this local demo. Payments are not connected or simulated.</EmptyState>
      ) : tab === "sessions" ? (
        <EmptyState>No completed ritual sessions in this local demo.</EmptyState>
      ) : tab === "reminders" ? (
        <section className="space-y-3">
          <div className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4">
            <h2 className="text-sm text-[#F5F1E8]">Ritual reminders</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#AAA5B5]">
              The live dashboard sends reminders through a backend function. Local demo mode has no email service or ritual sessions, so it will not send or pretend to send messages.
            </p>
          </div>
          <EmptyState>No incomplete ritual sessions to remind.</EmptyState>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4">
            <h2 className="text-sm text-[#F5F1E8]">Local demo storage</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#AAA5B5]">
              Rituals and categories are stored in this browser's local storage. This is separate from the live Base44 database and is not shared across browsers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Categories" value={catalog.categories.length} />
            <Metric label="Rituals" value={catalog.rituals.length} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportCatalog} className="rounded-lg border border-[#D6B56A]/40 px-4 py-2 text-sm text-[#D6B56A]">Export demo catalog</button>
            <button onClick={resetCatalog} className="rounded-lg border border-[#c97a7a]/40 px-4 py-2 text-sm text-[#c97a7a]">Reset demo data</button>
          </div>
        </section>
      )}
    </div>
  );
}
