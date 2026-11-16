import React, { useRef, useState } from "react";
import { AlertTriangle, Database, Download, ShieldCheck, Upload } from "lucide-react";
import {
  exportSupabaseBackup,
  importLegacySupabaseBackup,
  MAX_BACKUP_FILE_SIZE_BYTES,
  restoreSupabaseBackup,
  validateRitualOSBackup,
} from "@/api/databaseBackup";
import { useBranding } from "@/lib/BrandingContext";

function backupErrorMessage(error) {
  if (
    error?.code === "PGRST202" ||
    /restore_ritualos_backup.*not found|import_ritualos_legacy_backup.*not found|could not find the function/i.test(error?.message || "")
  ) {
    return "A required Supabase migration is not applied yet. Apply all SQL files in supabase/migrations in filename order, then retry.";
  }
  return error?.message || "The database backup operation could not be completed.";
}

function downloadBackup(backup, fileName) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DatabaseSettings() {
  const { refreshBranding } = useBranding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [restoreMode, setRestoreMode] = useState("merge");
  const [pendingRestore, setPendingRestore] = useState(null);
  const [pendingLegacyImport, setPendingLegacyImport] = useState(null);
  const fileInputRef = useRef(null);
  const legacyFileInputRef = useRef(null);

  const exportBackup = async () => {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const backup = await exportSupabaseBackup();
      const date = new Date().toISOString().slice(0, 10);
      downloadBackup(backup, `ritualos-backup-${date}.json`);
      setStatus(`Backup downloaded. ${backup.total} records exported.`);
    } catch (exportError) {
      console.error("Supabase database backup export failed:", exportError);
      setError(backupErrorMessage(exportError));
    } finally {
      setBusy(false);
    }
  };

  const chooseRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setStatus("");
    try {
      if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
        throw new Error("Backup files must be 5 MB or smaller.");
      }
      const backup = validateRitualOSBackup(JSON.parse(await file.text()));
      setPendingRestore({ backup, fileName: file.name });
    } catch (restoreError) {
      console.error("The selected database backup could not be validated:", restoreError);
      setError(backupErrorMessage(restoreError));
    }
  };

  const chooseLegacyFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setStatus("");
    try {
      if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
        throw new Error("Backup files must be 5 MB or smaller.");
      }
      const backup = validateRitualOSBackup(JSON.parse(await file.text()));
      setPendingLegacyImport({ backup, fileName: file.name });
    } catch (importError) {
      console.error("The selected legacy backup could not be validated:", importError);
      setError(backupErrorMessage(importError));
    }
  };

  const importLegacyData = async () => {
    if (!pendingLegacyImport) return;

    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await importLegacySupabaseBackup(pendingLegacyImport.backup);
      if (result.branding_imported) await refreshBranding();
      const content = result.content || {};
      const staged = Object.values(result.activity_staged || {}).reduce((sum, count) => sum + count, 0);
      setStatus(
        `Import complete: ${content.categories || 0} categories, ${content.rituals || 0} rituals, ` +
        `${content.steps || 0} steps, ${staged} activity records staged. Orders did not grant access.`
      );
      setPendingLegacyImport(null);
    } catch (importError) {
      console.error("Legacy Supabase data import failed:", importError);
      setError(backupErrorMessage(importError));
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async () => {
    if (!pendingRestore) return;

    setBusy(true);
    setError("");
    setStatus("");
    try {
      if (restoreMode === "replace") {
        const currentBackup = await exportSupabaseBackup();
        const date = new Date().toISOString().slice(0, 10);
        downloadBackup(currentBackup, `ritualos-before-restore-${date}.json`);
      }

      const result = await restoreSupabaseBackup(pendingRestore.backup, restoreMode);
      const summary = [
        `${result.categories ?? 0} categories`,
        `${result.rituals ?? 0} rituals`,
        `${result.steps ?? 0} steps`,
      ].join(", ");
      const skipped = result.skipped_steps
        ? ` ${result.skipped_steps} orphaned steps were skipped.`
        : "";
      setStatus(`Restore complete (${restoreMode}): ${summary}.${skipped}`);
      setPendingRestore(null);
    } catch (restoreError) {
      console.error("Supabase database backup restore failed:", restoreError);
      setError(backupErrorMessage(restoreError));
    } finally {
      setBusy(false);
    }
  };

  const cancelRestore = () => setPendingRestore(null);
  const cancelLegacyImport = () => setPendingLegacyImport(null);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-4 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#D6B56A] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[#F5F1E8]">RitualOS Supabase database</p>
          <p className="text-[11px] leading-relaxed text-[#AAA5B5] mt-1">
            This app is connected directly to Supabase. External database connections and their former Base44
            functions are not available in this deployment.
          </p>
        </div>
        <Database className="w-4 h-4 text-[#D6B56A] ml-auto shrink-0" />
      </section>

      <section className="space-y-4 rounded-2xl border border-white/5 bg-[#171522] p-4">
        <div>
          <h3 className="text-[11px] uppercase tracking-widest text-[#AAA5B5]">Backup & restore</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#AAA5B5]">
            Restore imports app content only. To migrate the provided Base44 export, use the separate legacy import:
            it stages activity because old owner IDs cannot be matched to Supabase accounts. It never imports
            credentials or grants access from historical orders.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={exportBackup}
            disabled={busy}
            className="w-full py-2.5 rounded-xl border border-[#D6B56A]/40 text-[#D6B56A] text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {busy ? "Working…" : "Export backup"}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="w-full py-2.5 rounded-xl border border-[#8B6CCF]/40 text-[#B9A6E6] text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> Choose backup file
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={chooseRestoreFile}
        />
        <button
          type="button"
          onClick={() => legacyFileInputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-xl border border-[#8B6CCF]/40 px-4 py-2.5 text-sm text-[#B9A6E6] inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {busy ? "Importing…" : "Import legacy Base44 data"}
        </button>
        <input
          ref={legacyFileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={chooseLegacyFile}
        />

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Restore behavior</span>
          <select
            value={restoreMode}
            onChange={(event) => setRestoreMode(event.target.value)}
            disabled={busy}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2 text-sm text-[#F5F1E8]"
          >
            <option value="merge">Merge backup into current content</option>
            <option value="replace">Replace current content</option>
          </select>
        </label>

        {restoreMode === "replace" && (
          <p className="text-[11px] leading-relaxed text-[#D6B56A]">
            Replace deletes categories, rituals, and steps not in the selected backup. Before applying it, the app
            will download a backup of the current content. Activity rows remain, though references to deleted rituals
            may be cleared by the database.
          </p>
        )}

        {error && <p role="alert" className="text-xs text-[#e0a0a0]">{error}</p>}
        {status && <p role="status" className="text-xs text-[#D6B56A]">{status}</p>}
      </section>

      {pendingRestore && (
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="restore-confirm-title"
          className="rounded-2xl border border-[#c97a7a]/30 bg-[#171522] p-4 space-y-3"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#c97a7a] mt-0.5 shrink-0" />
            <div>
              <h3 id="restore-confirm-title" className="text-sm font-medium text-[#F5F1E8]">Confirm backup restore</h3>
              <p className="mt-1 text-xs text-[#AAA5B5]">
                Restore <span className="text-[#F5F1E8]">{pendingRestore.fileName}</span> using{" "}
                <span className="text-[#F5F1E8]">{restoreMode}</span> mode?
                {restoreMode === "replace" &&
                  " Current content will be removed if it is absent from the backup, which can clear links from activity records. A current-content backup is downloaded first."}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelRestore}
              disabled={busy}
              className="px-3 py-2 rounded-lg border border-white/10 text-[#AAA5B5] text-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={restoreBackup}
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-[#c97a7a] text-[#08070D] text-xs font-semibold disabled:opacity-50"
            >
              {busy ? "Restoring…" : "Restore backup"}
            </button>
          </div>
        </section>
      )}
      {pendingLegacyImport && (
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="legacy-import-title"
          className="space-y-3 rounded-2xl border border-[#D6B56A]/30 bg-[#171522] p-4"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B56A]" />
            <div>
              <h3 id="legacy-import-title" className="text-sm font-medium text-[#F5F1E8]">Confirm legacy data import</h3>
              <p className="mt-1 text-xs text-[#AAA5B5]">
                Import <span className="text-[#F5F1E8]">{pendingLegacyImport.fileName}</span> into this Supabase project?
                Categories, rituals, steps, and branding will be merged into the live app. Sessions, journal entries,
                favorites, orders, and entitlements will be kept in the restricted legacy holding table because their
                owner IDs do not match Supabase users.
              </p>
              <p className="mt-2 text-xs text-[#D6B56A]">
                Legacy order and entitlement records are historical only and will not grant ritual access.
                User accounts and passwords are not contained in this file and cannot be migrated by this import.
              </p>
            </div>
          </div>
          {error && <p role="alert" className="text-xs text-[#e0a0a0]">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelLegacyImport}
              disabled={busy}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#AAA5B5] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={importLegacyData}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] px-3 py-2 text-xs font-semibold text-[#08070D] disabled:opacity-50"
            >
              {busy ? "Importing…" : "Import legacy data"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
