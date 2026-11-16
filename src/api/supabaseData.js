import { requireSupabase } from "@/api/supabaseClient";

const entityTables = {
  Category: "categories",
  Ritual: "rituals",
  RitualStep: "ritual_steps",
  RitualSession: "ritual_sessions",
  Entitlement: "entitlements",
  Favorite: "favorites",
  JournalEntry: "journal_entries",
  Order: "orders",
  User: "profiles",
};

function getTable(entityName) {
  const table = entityTables[entityName];
  if (!table) throw new Error(`Unknown data model: ${entityName}`);
  return table;
}

function throwOnError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function applyFilters(query, filters = {}) {
  let next = query;
  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) {
      next = next.is(field, null);
    } else if (Array.isArray(value)) {
      next = next.in(field, value);
    } else {
      next = next.eq(field, value);
    }
  }
  return next;
}

function applySort(query, sort) {
  if (!sort) return query;
  const descending = sort.startsWith("-");
  const column = descending ? sort.slice(1) : sort;
  if (!column) throw new Error("A sort column is required.");
  return query.order(column, { ascending: !descending });
}

async function list(entityName, sort, limit) {
  let query = applySort(requireSupabase().from(getTable(entityName)).select("*"), sort);
  if (Number.isFinite(limit)) query = query.limit(limit);
  return throwOnError(await query) || [];
}

async function filter(entityName, filters, sort, limit) {
  let query = applyFilters(
    requireSupabase().from(getTable(entityName)).select("*"),
    filters
  );
  query = applySort(query, sort);
  if (Number.isFinite(limit)) query = query.limit(limit);
  return throwOnError(await query) || [];
}

async function get(entityName, id) {
  const result = await requireSupabase()
    .from(getTable(entityName))
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const row = throwOnError(result);
  if (!row) throw new Error(`${entityName} record not found.`);
  return row;
}

async function create(entityName, values) {
  return throwOnError(
    await requireSupabase()
      .from(getTable(entityName))
      .insert(values)
      .select("*")
      .single()
  );
}

async function update(entityName, id, values) {
  return throwOnError(
    await requireSupabase()
      .from(getTable(entityName))
      .update(values)
      .eq("id", id)
      .select("*")
      .single()
  );
}

async function remove(entityName, id) {
  return throwOnError(
    await requireSupabase()
      .from(getTable(entityName))
      .delete()
      .eq("id", id)
      .select("id")
      .single()
  );
}

async function deleteMany(entityName, filters) {
  return throwOnError(
    await applyFilters(
      requireSupabase().from(getTable(entityName)).delete(),
      filters
    ).select("id")
  ) || [];
}

async function bulkUpdate(entityName, rows) {
  if (!Array.isArray(rows)) throw new Error("Bulk updates must be an array.");
  return Promise.all(rows.map(({ id, ...values }) => update(entityName, id, values)));
}

export const supabaseEntities = Object.fromEntries(
  Object.keys(entityTables).map((entityName) => [
    entityName,
    {
      list: (sort, limit) => list(entityName, sort, limit),
      filter: (filters, sort, limit) => filter(entityName, filters, sort, limit),
      get: (id) => get(entityName, id),
      create: (values) => create(entityName, values),
      update: (id, values) => update(entityName, id, values),
      delete: (id) => remove(entityName, id),
      deleteMany: (filters) => deleteMany(entityName, filters),
      bulkUpdate: (rows) => bulkUpdate(entityName, rows),
    },
  ])
);

export async function getSupabaseAppUser() {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("No signed-in user.");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, email, full_name, role, preferred_language, avatar_url, created_date")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;

  return {
    ...profile,
    email: user.email || profile.email,
    full_name: profile.full_name || user.user_metadata?.full_name || "",
  };
}

export async function getUserProfileSummary(userId) {
  if (!userId) throw new Error("A signed-in user is required.");
  const client = requireSupabase();
  const countFor = async (table) => {
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw error;
    return count || 0;
  };

  const [ritualsCompleted, ritualsInProgress, favorites, journalEntries, purchases, recentResult] =
    await Promise.all([
      client.from("ritual_sessions").select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "completed"),
      client.from("ritual_sessions").select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "in_progress"),
      countFor("favorites"),
      countFor("journal_entries"),
      countFor("entitlements"),
      client.from("ritual_sessions")
        .select("id, ritual_name, status, completed_at, created_date")
        .eq("user_id", userId)
        .order("created_date", { ascending: false })
        .limit(5),
    ]);

  if (ritualsCompleted.error) throw ritualsCompleted.error;
  if (ritualsInProgress.error) throw ritualsInProgress.error;
  if (recentResult.error) throw recentResult.error;

  return {
    ritualsCompleted: ritualsCompleted.count || 0,
    ritualsInProgress: ritualsInProgress.count || 0,
    favorites,
    journalEntries,
    purchases,
    recentActivity: recentResult.data || [],
  };
}
