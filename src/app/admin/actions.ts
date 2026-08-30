"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Create a new wheel with 10 default slices
export async function createWheelAction(
  name: string,
  slicesJson?: string,
  isPublic = true
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
      },
    });

    revalidatePath("/admin/wheels");
    revalidatePath("/");
    return { success: true, wheelId: wheel.id };
  } catch (e) {
    return { error: "Không thể tạo vòng quay mới." };
  }
}

// Update a wheel configurations (name, slices, isPublic, customWinnerId, hideOnWin)
export async function updateWheelAction(
  id: string,
  name: string,
  slicesJson: string,
  isPublic: boolean,
  customWinnerId?: string,
  hideOnWin?: boolean
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
      },
    });

    revalidatePath("/admin/wheels");
    revalidatePath(`/wheels/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: "Không thể cập nhật vòng quay." };
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
