"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveSpinAction(wheelId: string, resultLabel: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập và nhập mã quay để quay." };
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

export async function redeemSpinCodeAction(code: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Vui lòng đăng nhập trước khi nhập mã quay." };
  const normalized = code.trim().toUpperCase();
  try {
    const result = await db.$transaction(async (tx) => {
      const spinCode = await tx.spinCode.findUnique({ where: { code: normalized } });
      if (!spinCode || spinCode.status !== "unused") return { error: "Mã quay không hợp lệ hoặc đã được sử dụng." };
      await tx.spinCode.update({ where: { id: spinCode.id }, data: { status: "used" } });
      const redemption = await tx.spinCodeRedemption.create({ data: { codeId: spinCode.id, userId: user.id, remaining: spinCode.amount } });
      return { success: true, remaining: redemption.remaining };
    });
    return result;
  } catch { return { error: "Không thể sử dụng mã quay. Vui lòng thử lại." }; }
}

export async function consumeSpinCreditAction() {
  const user = await getCurrentUser();
  if (!user) return { error: "Vui lòng đăng nhập và nhập mã quay." };
  if (user.role === "admin") return { success: true, remaining: -1 };
  try {
    const redemption = await db.spinCodeRedemption.findFirst({ where: { userId: user.id, remaining: { gt: 0 } }, orderBy: { createdAt: "asc" } });
    if (!redemption) return { error: "Bạn không còn lượt quay. Hãy nhập mã quay mới." };
    const updated = await db.spinCodeRedemption.update({ where: { id: redemption.id }, data: { remaining: { decrement: 1 } } });
    return { success: true, remaining: updated.remaining };
  } catch { return { error: "Không thể xác nhận lượt quay." }; }
}
