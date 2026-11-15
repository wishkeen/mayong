import { Bell, CheckCircle, Database, ListTree, Moon, ShoppingBag, Tags, Users } from "lucide-react";

export const ADMIN_TABS = [
  { key: "overview", label: "Overview", icon: Moon },
  { key: "rituals", label: "Rituals", icon: ListTree },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "users", label: "Users", icon: Users },
  { key: "orders", label: "Purchases", icon: ShoppingBag },
  { key: "sessions", label: "Completions", icon: CheckCircle },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "database", label: "Database", icon: Database },
];
