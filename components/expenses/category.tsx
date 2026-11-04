import { ShoppingBasket, Zap, Pill, Tag, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/types";

export const CATEGORY_META: Record<
  Category,
  { icon: LucideIcon; tile: string; badge: string; bar: string }
> = {
  bazar: { icon: ShoppingBasket, tile: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700", bar: "from-emerald-500 to-teal-500" },
  bill: { icon: Zap, tile: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700", bar: "from-blue-500 to-cyan-500" },
  medicine: { icon: Pill, tile: "bg-purple-50 text-purple-600", badge: "bg-purple-50 text-purple-700", bar: "from-purple-500 to-fuchsia-500" },
  other: { icon: Tag, tile: "bg-orange-50 text-orange-600", badge: "bg-orange-50 text-orange-700", bar: "from-orange-500 to-amber-500" },
};
