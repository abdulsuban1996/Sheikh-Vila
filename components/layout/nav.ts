import {
  LayoutDashboard,
  Receipt,
  ShoppingBasket,
  Calculator,
  Users,
  Settings,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

/**
 * Extension point: later versions can add মিল, বিল, নোটিশ here
 * (e.g. { href: "/meals", label: "মিল", icon: UtensilsCrossed }).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/expenses", label: "বাজার ও খরচ", icon: Receipt },
  { href: "/fund", label: "ফান্ড", icon: PiggyBank },
  { href: "/shopping", label: "বাজারের তালিকা", icon: ShoppingBasket },
  { href: "/summary", label: "মাসিক হিসাব", icon: Calculator },
  { href: "/members", label: "সদস্য তালিকা", icon: Users, adminOnly: true },
  { href: "/settings", label: "সেটিংস", icon: Settings },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/expenses", label: "খরচ", icon: Receipt },
  { href: "/shopping", label: "তালিকা", icon: ShoppingBasket },
  { href: "/summary", label: "হিসাব", icon: Calculator },
];

export function pageTitle(pathname: string): string {
  const hit = NAV_ITEMS.find((n) => pathname.startsWith(n.href));
  return hit ? hit.label : "শেখ ভিলা";
}
