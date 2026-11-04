export type Role = "admin" | "member";
export type Category = "bazar" | "bill" | "medicine" | "other";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "bazar", label: "বাজার" },
  { value: "bill", label: "বিল" },
  { value: "medicine", label: "ওষুধ" },
  { value: "other", label: "অন্যান্য" },
];

export const categoryLabel = (c: string) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c;

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  paid_by: string;
  category: Category;
  title: string;
  amount: number;
  expense_date: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  requested_by: string;
  is_bought: boolean;
  bought_at: string | null;
  created_at: string;
}

export interface SummaryRow {
  member_id: string;
  full_name: string;
  paid: number;
  share: number;
  balance: number;
}
