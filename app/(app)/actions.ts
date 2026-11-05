"use server";

import { revalidatePath } from "next/cache";

/** Called after any expense / fund write so every affected page refetches. */
export async function revalidateAll() {
  for (const p of ["/dashboard", "/fund", "/expenses", "/summary"]) {
    revalidatePath(p);
  }
}

/** Called after any shopping-list write. */
export async function revalidateShopping() {
  for (const p of ["/shopping", "/dashboard"]) {
    revalidatePath(p);
  }
}
