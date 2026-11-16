import { requireSupabase } from "@/api/supabaseClient";

export const BACKUP_FORMAT = "ritualos-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_ROWS_PER_COLLECTION = 5000;
export const MAX_BACKUP_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const PAGE_SIZE = 1000;

const COLLECTIONS = [
  { name: "Category", table: "categories", fields: ["id", "name", "slug", "icon", "description", "sort_order"] },
  {
    name: "Ritual",
    table: "rituals",
    fields: [
      "id", "name", "category_id", "category_slug", "category_name", "description",
      "duration_minutes", "difficulty", "source", "price", "image_url", "is_published",
      "is_featured", "practice_type", "sort_order",
    ],
  },
  {
    name: "RitualStep",
    table: "ritual_steps",
    fields: [
      "id", "ritual_id", "order", "type", "title", "content", "duration_seconds",
      "repetitions", "audio_url", "translations",
    ],
  },
  {
    name: "RitualSession",
    table: "ritual_sessions",
    fields: [
      "id", "user_id", "ritual_id", "ritual_name", "current_step", "total_steps",
      "status", "completed_at", "progress_log", "created_date",
    ],
    activity: true,
  },
  {
    name: "JournalEntry",
    table: "journal_entries",
    fields: [
      "id", "user_id", "session_id", "ritual_id", "ritual_name", "notes",
      "rating", "mood", "created_date",
    ],
    activity: true,
  },
  { name: "Favorite", table: "favorites", fields: ["id", "user_id", "ritual_id", "created_date"], activity: true },
  {
    name: "Order",
    table: "orders",
    fields: [
      "id", "user_id", "ritual_id", "ritual_name", "amount", "status", "payment_mode", "created_date",
    ],
    activity: true,
  },
  {
    name: "Entitlement",
    table: "entitlements",
    fields: ["id", "user_id", "ritual_id", "order_id", "created_date"],
    activity: true,
  },
];

async function readCollection(client, collection) {
  const rows = [];
  for (let offset = 0; offset < MAX_BACKUP_ROWS_PER_COLLECTION; offset += PAGE_SIZE) {
    const end = Math.min(offset + PAGE_SIZE, MAX_BACKUP_ROWS_PER_COLLECTION) - 1;
    const { data, error } = await client
      .from(collection.table)
      .select(collection.fields.join(","))
      .order("id", { ascending: true })
      .range(offset, end);

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < end - offset + 1) return rows;
  }

  const { data, error } = await client
    .from(collection.table)
    .select("id")
    .order("id", { ascending: true })
    .range(MAX_BACKUP_ROWS_PER_COLLECTION, MAX_BACKUP_ROWS_PER_COLLECTION);
  if (error) throw error;
  if (data?.length) {
    throw new Error(
      `${collection.name} has more than ${MAX_BACKUP_ROWS_PER_COLLECTION} records. Reduce the dataset before exporting.`
    );
  }
  return rows;
}

export function validateRitualOSBackup(backup) {
  if (
    !backup ||
    typeof backup !== "object" ||
    Array.isArray(backup) ||
    backup.format !== BACKUP_FORMAT ||
    backup.version !== BACKUP_VERSION ||
    !backup.data ||
    typeof backup.data !== "object" ||
    Array.isArray(backup.data)
  ) {
    throw new Error("This file is not a supported RitualOS backup.");
  }

  for (const collection of COLLECTIONS) {
    const rows = backup.data[collection.name];
    if (rows !== undefined && !Array.isArray(rows)) {
      throw new Error(`The ${collection.name} section in this backup is invalid.`);
    }
    if ((rows?.length || 0) > MAX_BACKUP_ROWS_PER_COLLECTION) {
      throw new Error(`The ${collection.name} section exceeds the supported backup size.`);
    }
  }

  const hasContent = ["Category", "Ritual", "RitualStep"].some(
    (name) => Array.isArray(backup.data[name]) && backup.data[name].length > 0
  );
  if (!hasContent) throw new Error("This backup contains no app content to restore.");
  return backup;
}

export async function exportSupabaseBackup() {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in as an administrator to export a backup.");

  const { data: isAdmin, error: roleError } = await client.rpc("is_admin");
  if (roleError) throw roleError;
  if (!isAdmin) throw new Error("Administrator access is required to export a database backup.");

  const data = {};
  const counts = {};
  for (const collection of COLLECTIONS) {
    data[collection.name] = await readCollection(client, collection);
    counts[collection.name] = data[collection.name].length;
  }

  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    created_at: new Date().toISOString(),
    created_by: user.email || "",
    content_collections: COLLECTIONS.filter((item) => !item.activity).map((item) => item.name),
    activity_collections: COLLECTIONS.filter((item) => item.activity).map((item) => item.name),
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    truncated: [],
    data,
  };
  if (new Blob([JSON.stringify(backup)]).size > MAX_BACKUP_FILE_SIZE_BYTES) {
    throw new Error("This backup is larger than the supported 5 MB file size.");
  }
  return backup;
}

export async function restoreSupabaseBackup(backup, mode) {
  validateRitualOSBackup(backup);
  if (!["merge", "replace"].includes(mode)) throw new Error("Choose a supported restore mode.");

  const { data, error } = await requireSupabase().rpc("restore_ritualos_backup", {
    p_backup: backup,
    p_mode: mode,
  });
  if (error) throw error;
  return data;
}

export async function importLegacySupabaseBackup(backup) {
  validateRitualOSBackup(backup);
  const { data, error } = await requireSupabase().rpc("import_ritualos_legacy_backup", {
    p_backup: backup,
  });
  if (error) throw error;
  return data;
}
