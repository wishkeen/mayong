import {
  localDemoCategories,
  localDemoRituals,
} from "@/lib/localDemo";

export const LOCAL_DEMO_CATALOG_KEY = "ritualos_local_demo_catalog";
export const LOCAL_DEMO_CATALOG_EVENT = "ritualos-local-demo-catalog-change";

function copyCatalog(catalog) {
  return JSON.parse(JSON.stringify(catalog));
}

export function getLocalDemoCatalog() {
  const stored = window.localStorage.getItem(LOCAL_DEMO_CATALOG_KEY);
  if (!stored) {
    const seed = copyCatalog({ categories: localDemoCategories, rituals: localDemoRituals });
    saveLocalDemoCatalog(seed);
    return seed;
  }

  const catalog = JSON.parse(stored);
  if (!Array.isArray(catalog.categories) || !Array.isArray(catalog.rituals)) {
    throw new Error("The saved local demo catalog is invalid. Clear this browser's local demo data and reload.");
  }
  return catalog;
}

export function saveLocalDemoCatalog(catalog) {
  window.localStorage.setItem(LOCAL_DEMO_CATALOG_KEY, JSON.stringify(catalog));
  window.dispatchEvent(new Event(LOCAL_DEMO_CATALOG_EVENT));
}

export function resetLocalDemoCatalog() {
  const seed = copyCatalog({ categories: localDemoCategories, rituals: localDemoRituals });
  saveLocalDemoCatalog(seed);
  return seed;
}

export function subscribeToLocalDemoCatalog(callback) {
  window.addEventListener(LOCAL_DEMO_CATALOG_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LOCAL_DEMO_CATALOG_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
