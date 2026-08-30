"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveSpinAction(wheelId: string, resultLabel: string) {
  const user = await getCurrentUser();
  try {
    await db.spinHistory.create({
      data: {
        wheelId,
        userId: user ? user.id : null,
        resultLabel,
      },
    });
    // Trigger Server Component re-validation to update the spin history list instantly
    revalidatePath(`/wheels/${wheelId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to save spin history:", e);
    return { error: "Không thể lưu lịch sử quay" };
  }
}
