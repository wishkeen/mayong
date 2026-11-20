import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import RitualForm from "@/components/admin/RitualForm";
import StepEditor from "@/components/admin/StepEditor";
import { Plus, Pencil, ListTree, Trash2, ExternalLink, Moon, Users, ShoppingBag, CheckCircle, Bell, Tags, GripVertical, Database, Palette, KeyRound, LockKeyhole } from "lucide-react";
import DatabaseSettings from "@/components/admin/DatabaseSettings";
import BrandingSettings from "@/components/admin/BrandingSettings";
import SocialAuthSettings from "@/components/admin/SocialAuthSettings";
import RitualAccessSettings from "@/components/admin/RitualAccessSettings";
import BrandLogo from "@/components/BrandLogo";
import { useBranding } from "@/lib/BrandingContext";
import { formatPrice, difficultyColor, PRACTICE_LABELS } from "@/lib/rituals";
import ReorderableList from "@/components/admin/ReorderableList";
import CategoryForm from "@/components/admin/CategoryForm";
import RitualCover from "@/components/RitualCover";
import TranslatedText from "@/components/TranslatedText";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";

const TABS = [
  { key: "overview", label: "Overview", icon: Moon },
  { key: "rituals", label: "Rituals", icon: ListTree },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "users", label: "Users", icon: Users },
  { key: "orders", label: "Purchases", icon: ShoppingBag },
  { key: "ritual-access", label: "Ritual access", icon: LockKeyhole },
  { key: "sessions", label: "Completions", icon: CheckCircle },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "social-auth", label: "Social sign-in", icon: KeyRound },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "database", label: "Database", icon: Database },
];

function AdminInner() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const refreshKey = useRefreshOnFocus();
  const [tab, setTab] = useState("overview");
  const [rituals, setRituals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(null);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [r, c, u, o, s, ip] = await Promise.all([
        supabaseEntities.Ritual.list("sort_order", 100),
        supabaseEntities.Category.list("sort_order", 20),
        supabaseEntities.User.list("-created_date", 100).catch(() => []),
        supabaseEntities.Order.list("-created_date", 100).catch(() => []),
        supabaseEntities.RitualSession.filter({ status: "completed" }, "-completed_at", 100).catch(() => []),
        supabaseEntities.RitualSession.filter({ status: "in_progress" }, "-created_date", 100).catch(() => []),
      ]);
      setRituals(r);
      setCategories(c);
      setUsers(u);
      setOrders(o);
      setSessions(s);
      setInProgress(ip);
    } catch (error) {
      console.error("Could not load admin data:", error);
      setLoadError(error?.message || "Admin data could not be loaded. Check your access and database setup, then retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll, tab, refreshKey]);

  const runAdminAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      console.error("Admin action failed:", error);
      setActionError(error?.message || "The admin action could not be completed.");
    }
  };

  const catMap = {};
  categories.forEach((c) => (catMap[c.id] = c));
  const userMap = {};
  users.forEach((u) => (userMap[u.id] = u));

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (ritual) => { setEditing(ritual); setFormOpen(true); };

  const togglePublish = async (ritual) => {
    await supabaseEntities.Ritual.update(ritual.id, { is_published: !ritual.is_published });
    loadAll();
  };

  const removeRitual = async (ritual) => {
    if (!confirm(`Delete "${ritual.name}"? This also removes its steps.`)) return;
    await supabaseEntities.RitualStep.deleteMany({ ritual_id: ritual.id });
    await supabaseEntities.Ritual.delete(ritual.id);
    loadAll();
  };

  const reorderRituals = async (nextList) => {
    setRituals(nextList);
    try {
      await supabaseEntities.Ritual.bulkUpdate(
        nextList.map((r, i) => ({ id: r.id, sort_order: i }))
      );
    } catch (error) {
      setActionError(error?.message || "Ritual order could not be saved.");
      await loadAll();
    }
  };

  const reorderCategories = async (nextList) => {
    setCategories(nextList);
    try {
      await supabaseEntities.Category.bulkUpdate(
        nextList.map((c, i) => ({ id: c.id, sort_order: i }))
      );
    } catch (error) {
      setActionError(error?.message || "Category order could not be saved.");
      await loadAll();
    }
  };

  const openNewCat = () => { setEditingCat(null); setCatFormOpen(true); };
  const openEditCat = (cat) => { setEditingCat(cat); setCatFormOpen(true); };

  const removeCategory = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? Rituals in it will remain but lose their category link.`)) return;
    await supabaseEntities.Category.delete(cat.id);
    loadAll();
  };

  const completedCount = sessions.length;
  const revenue = orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + (o.amount || 0), 0);

  if (managing) {
    return (
      <div className="min-h-screen bg-mystic text-[#F5F1E8] max-w-3xl mx-auto px-5 py-6">
        <StepEditor ritual={managing} onBack={() => { setManaging(null); loadAll(); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mystic text-[#F5F1E8] max-w-3xl mx-auto px-5 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BrandLogo
            logoUrl={branding.logo_url}
            mark={branding.app_name?.charAt(0)}
            accentColor={branding.accent_color}
            alt={`${branding.app_name} logo`}
            className="w-8 h-8"
            iconClassName="w-4 h-4"
          />
          <div>
            <h1 className="font-display text-2xl leading-none">{branding.app_name} <TranslatedText> Admin</TranslatedText></h1>
            <p className="text-[11px] text-[#AAA5B5]"><TranslatedText>Signed in as </TranslatedText>{user?.email}</p>
          </div>
        </div>
        <Link to="/" className="text-xs text-[#AAA5B5] hover:text-[#D6B56A]"><TranslatedText>View app →</TranslatedText></Link>
      </header>

      <nav className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-5 px-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border inline-flex items-center gap-1.5 transition-colors ${
                tab === t.key ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]" : "border-white/10 text-[#AAA5B5] bg-[#171522]"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </nav>

      {(loadError || actionError) && (
        <div role="alert" className="mb-4 rounded-xl border border-[#c97a7a]/30 bg-[#c97a7a]/10 p-3 text-xs text-[#e2a0a0]">
          <p>{loadError || actionError}</p>
          {loadError && (
            <button type="button" onClick={loadAll} className="mt-2 underline underline-offset-2">
              <TranslatedText>Retry loading admin data</TranslatedText>
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="h-48 rounded-2xl bg-[#171522] animate-pulse" />
      ) : tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Rituals", value: rituals.length, icon: ListTree },
              { label: "Users", value: users.length, icon: Users },
              { label: "Purchases", value: orders.length, icon: ShoppingBag },
              { label: "Completions", value: completedCount, icon: CheckCircle },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl border border-white/5 bg-[#171522] p-4">
                  <Icon className="w-4 h-4 text-[#D6B56A] mb-2" />
                  <div className="font-display text-3xl text-[#F5F1E8] leading-none">{s.value}</div>
                  <div className="text-[11px] text-[#AAA5B5] uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#AAA5B5] uppercase tracking-widest">Revenue (paid orders)</div>
              <div className="font-display text-3xl text-[#D6B56A]">{formatPrice(revenue)}</div>
            </div>
            <ShoppingBag className="w-8 h-8 text-[#D6B56A]/40" />
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#171522] p-4">
            <h3 className="text-xs uppercase tracking-widest text-[#AAA5B5] mb-3">Recently published</h3>
            <div className="space-y-2">
              {rituals.filter((r) => r.is_published).slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#F5F1E8] truncate">{r.name}</span>
                  <span className="text-[#D6B56A] text-xs">{formatPrice(r.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === "rituals" ? (
        <div className="space-y-3">
          <button onClick={openNew} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm inline-flex items-center justify-center gap-2 glow-gold">
            <Plus className="w-4 h-4" /> New Ritual
          </button>
          <ReorderableList items={rituals} onReorder={reorderRituals} droppableId="rituals" renderItem={(r, _i, handleProps) => (
            <div className="rounded-2xl border border-white/5 bg-[#171522] p-4">
              <div className="flex items-start gap-3">
                <span {...handleProps} className="cursor-grab active:cursor-grabbing pt-1">
                  <GripVertical className="w-4 h-4 text-[#55506A]" />
                </span>
                <RitualCover ritual={r} className="h-14 w-14 rounded-xl flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">{catMap[r.category_id]?.name || r.category_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${difficultyColor(r.difficulty)}`}>{r.difficulty}</span>
                  </div>
                  <h3 className="font-display text-lg text-[#F5F1E8] leading-tight truncate">{r.name}</h3>
                  <p className="text-xs text-[#AAA5B5] mt-0.5">{formatPrice(r.price)} · {r.duration_minutes}m · {PRACTICE_LABELS[r.practice_type]}</p>
                  <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${r.is_published ? "bg-[#D6B56A]/15 text-[#D6B56A]" : "bg-white/5 text-[#AAA5B5]"}`}>
                    {r.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => openEdit(r)} className="px-3 py-1.5 rounded-lg border border-white/10 text-[#AAA5B5] text-xs inline-flex items-center gap-1.5"><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => setManaging(r)} className="px-3 py-1.5 rounded-lg border border-white/10 text-[#AAA5B5] text-xs inline-flex items-center gap-1.5"><ListTree className="w-3 h-3" /> Steps</button>
                <button onClick={() => runAdminAction(() => togglePublish(r))} className="px-3 py-1.5 rounded-lg border border-white/10 text-[#AAA5B5] text-xs">{r.is_published ? "Unpublish" : "Publish"}</button>
                <Link to={`/ritual/${r.id}`} className="px-3 py-1.5 rounded-lg border border-white/10 text-[#AAA5B5] text-xs inline-flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> View</Link>
                <button onClick={() => runAdminAction(() => removeRitual(r))} className="px-3 py-1.5 rounded-lg border border-[#c97a7a]/30 text-[#c97a7a] text-xs inline-flex items-center gap-1.5 ml-auto"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          )} />
        </div>
      ) : tab === "categories" ? (
        <div className="space-y-3">
          <button onClick={openNewCat} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm inline-flex items-center justify-center gap-2 glow-gold">
            <Plus className="w-4 h-4" /> New Category
          </button>
          <ReorderableList items={categories} onReorder={reorderCategories} droppableId="categories" renderItem={(c, _i, handleProps) => (
            <div className="rounded-2xl border border-white/5 bg-[#171522] p-4 flex items-center gap-3">
              <span {...handleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-[#55506A]" />
              </span>
              <span className="text-2xl">{c.icon || "✦"}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg text-[#F5F1E8] leading-tight truncate">{c.name}</h3>
                <p className="text-xs text-[#AAA5B5] truncate">/{c.slug} · {c.description || "No description"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditCat(c)} className="px-3 py-1.5 rounded-lg border border-white/10 text-[#AAA5B5] text-xs inline-flex items-center gap-1.5"><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => runAdminAction(() => removeCategory(c))} className="px-3 py-1.5 rounded-lg border border-[#c97a7a]/30 text-[#c97a7a] text-xs inline-flex items-center gap-1.5"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          )} />
        </div>
      ) : tab === "users" ? (
        <div className="space-y-2">
          {users.length === 0 ? <p className="text-sm text-[#AAA5B5]">No users found.</p> : users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171522] px-4 py-3">
              <div>
                <p className="text-sm text-[#F5F1E8]">{u.email}</p>
                <p className="text-xs text-[#AAA5B5]">{u.full_name || "—"}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-[#D6B56A]/15 text-[#D6B56A]" : "bg-white/5 text-[#AAA5B5]"}`}>{u.role || "user"}</span>
            </div>
          ))}
        </div>
      ) : tab === "orders" ? (
        <div className="space-y-2">
          {orders.length === 0 ? <p className="text-sm text-[#AAA5B5]">No purchases yet.</p> : orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-white/5 bg-[#171522] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#F5F1E8]">{o.ritual_name || "—"}</p>
                <p className="text-xs text-[#AAA5B5]">{userMap[o.created_by_id]?.email || "—"} · {new Date(o.created_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#D6B56A]">{formatPrice(o.amount)}</p>
                <p className="text-[10px] text-[#AAA5B5] uppercase">{o.payment_mode} · {o.status}</p>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "ritual-access" ? (
        <RitualAccessSettings users={users} rituals={rituals} />
      ) : tab === "sessions" ? (
        <div className="space-y-2">
          {sessions.length === 0 ? <p className="text-sm text-[#AAA5B5]">No completed rituals yet.</p> : sessions.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/5 bg-[#171522] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#F5F1E8]">{s.ritual_name || "—"}</p>
                <p className="text-xs text-[#AAA5B5]">{userMap[s.created_by_id]?.email || "—"}</p>
              </div>
              <span className="text-xs text-[#D6B56A]">{s.completed_at ? new Date(s.completed_at).toLocaleDateString() : ""}</span>
            </div>
          ))}
        </div>
      ) : tab === "social-auth" ? (
        <SocialAuthSettings />
      ) : tab === "branding" ? (
        <BrandingSettings />
      ) : tab === "database" ? (
        <DatabaseSettings />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-3">
            <p className="text-xs leading-relaxed text-[#AAA5B5]">
              Reminder delivery is not configured for this Supabase deployment. Connect an email provider and a server-side reminder function before sending emails.
            </p>
          </div>
          <p className="text-xs text-[#AAA5B5]">Users who started a ritual but haven't completed it.</p>
          {inProgress.length === 0 ? (
            <p className="text-sm text-[#AAA5B5]">No incomplete rituals right now.</p>
          ) : inProgress.map((s) => {
            const u = userMap[s.created_by_id];
            const days = Math.floor((Date.now() - new Date(s.created_date).getTime()) / 86400000);
            return (
              <div key={s.id} className="rounded-xl border border-white/5 bg-[#171522] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#F5F1E8] truncate">{s.ritual_name || "—"}</p>
                  <p className="text-xs text-[#AAA5B5] truncate">{u?.email || s.created_by_id || "—"}</p>
                  <p className="text-[10px] text-[#AAA5B5] mt-0.5">Started {days === 0 ? "today" : `${days}d ago`} · step {(s.current_step || 0) + 1}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RitualForm open={formOpen} ritual={editing} categories={categories} onClose={() => setFormOpen(false)} onSaved={loadAll} />
      <CategoryForm open={catFormOpen} category={editingCat} onClose={() => setCatFormOpen(false)} onSaved={loadAll} />
    </div>
  );
}

export default function Admin() {
  return (
    <AdminGuard>
      <AdminInner />
    </AdminGuard>
  );
}
