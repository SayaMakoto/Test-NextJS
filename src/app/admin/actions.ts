"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function getWheelSaveError(error: unknown) {
  const prismaError = error as { code?: string };
  if (prismaError?.code === "P2022") {
    return "Database chưa có cột ảnh nền. Hãy deploy migration mới lên Vercel hoặc chạy prisma migrate deploy ở máy local.";
  }
  console.error("Wheel save failed:", error);
  return "Không thể lưu vòng quay. Vui lòng thử lại với ảnh nhỏ hơn.";
}

// Create a new wheel with 10 default slices
export async function createWheelAction(
  name: string,
  slicesJson?: string,
  isPublic = true,
  backgroundImage?: string | null
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện hành động này." };
  }

  const defaultSlices = Array.from({ length: 8 }, (_, i) => ({
    id: (i + 1).toString(),
    label: `Mục số ${i + 1}`,
    color: i % 2 === 0 ? "#8b5cf6" : "#ec4899",
    weight: 1,
    enabled: true,
  }));

  try {
    const wheel = await db.wheel.create({
      data: {
        name: name || "Vòng quay mới",
        userId: user.id,
        slices: slicesJson || JSON.stringify(defaultSlices),
        isPublic,
        isDeleted: false,
        backgroundImage: backgroundImage || null,
      },
    });

    revalidatePath("/admin/wheels");
    revalidatePath("/");
    return { success: true, wheelId: wheel.id };
  } catch (error) {
    return { error: getWheelSaveError(error) };
  }
}

// Update a wheel configurations (name, slices, isPublic, customWinnerId, hideOnWin)
export async function updateWheelAction(
  id: string,
  name: string,
  slicesJson: string,
  isPublic: boolean,
  customWinnerId?: string,
  hideOnWin?: boolean,
  backgroundImage?: string | null
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện hành động này." };
  }

  try {
    await db.wheel.update({
      where: { id },
      data: {
        name,
        slices: slicesJson,
        isPublic,
        customWinnerId: customWinnerId ?? "random",
        hideOnWin: hideOnWin ?? false,
        backgroundImage: backgroundImage || null,
      },
    });

    revalidatePath("/admin/wheels");
    revalidatePath(`/wheels/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: getWheelSaveError(error) };
  }
}

// Soft delete (move to trash bin)
export async function softDeleteWheelAction(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện hành động này." };
  }

  try {
    await db.wheel.update({
      where: { id },
      data: { isDeleted: true },
    });

    revalidatePath("/admin/wheels");
    revalidatePath("/admin/trash");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: "Không thể xóa vòng quay." };
  }
}

// Restore from trash bin
export async function restoreWheelAction(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện hành động này." };
  }

  try {
    await db.wheel.update({
      where: { id },
      data: { isDeleted: false },
    });

    revalidatePath("/admin/wheels");
    revalidatePath("/admin/trash");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: "Không thể khôi phục vòng quay." };
  }
}

// Permanent delete
export async function hardDeleteWheelAction(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện hành động này." };
  }

  try {
    await db.wheel.delete({
      where: { id },
    });

    revalidatePath("/admin/trash");
    return { success: true };
  } catch (e) {
    return { error: "Không thể xóa vĩnh viễn vòng quay." };
  }
}

// Update a user's role (admin toggle)
export async function updateUserRoleAction(userId: string, newRole: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện hành động này." };
  }

  if (user.id === userId) {
    return { error: "Bạn không thể tự hạ quyền của chính mình." };
  }

  if (newRole !== "admin" && newRole !== "member") {
    return { error: "Vai trò không hợp lệ." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { error: "Không thể thay đổi vai trò người dùng." };
  }
}

export async function setUserBlacklistAction(userId: string, isBanned: boolean) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return { error: "Bạn không có quyền thực hiện hành động này." };
  if (admin.id === userId) return { error: "Bạn không thể đưa chính mình vào danh sách đen." };

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { error: "Không tìm thấy người dùng." };
  if (target.role === "admin") return { error: "Không thể đưa tài khoản quản trị vào danh sách đen." };

  try {
    await db.user.update({ where: { id: userId }, data: { isBanned } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "Không thể cập nhật danh sách đen." };
  }
}

export async function deleteBlacklistedUserAction(userId: string) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return { error: "Bạn không có quyền thực hiện hành động này." };
  if (admin.id === userId) return { error: "Bạn không thể xóa tài khoản của chính mình." };

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true, isBanned: true } });
  if (!target) return { error: "Không tìm thấy người dùng." };
  if (target.role === "admin") return { error: "Không thể xóa tài khoản quản trị." };
  if (!target.isBanned) return { error: "Chỉ có thể xóa tài khoản đang ở danh sách đen." };

  try {
    await db.user.delete({ where: { id: userId } });
    revalidatePath("/admin/users");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Không thể xóa tài khoản người dùng." };
  }
}

export async function createSpinCodeAction(code: string, amount: number) {
  const user = await getCurrentUser();
  const normalized = code.trim().toUpperCase();
  if (!user || user.role !== "admin") return { error: "Bạn không có quyền thực hiện hành động này." };
  if (!/^[A-Z0-9]{1,10}$/.test(normalized)) return { error: "Mã quay chỉ gồm chữ/số, tối đa 10 ký tự." };
  if (!Number.isInteger(amount) || amount < 1) return { error: "Số lượt quay phải lớn hơn 0." };
  try { await db.spinCode.create({ data: { code: normalized, amount } }); revalidatePath("/admin/spin-codes"); return { success: true }; }
  catch { return { error: "Mã quay này đã tồn tại." }; }
}

export async function deleteSpinCodeAction(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Bạn không có quyền thực hiện hành động này." };
  try { await db.spinCode.delete({ where: { id } }); revalidatePath("/admin/spin-codes"); return { success: true }; }
  catch { return { error: "Không thể xóa mã quay." }; }
}
