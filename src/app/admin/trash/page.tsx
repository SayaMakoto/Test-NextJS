import React from "react";
import { db } from "@/lib/db";
import TrashClient from "./TrashClient";

export const metadata = {
  title: "Thùng rác vòng quay - Bảng quản trị",
  description: "Khôi phục hoặc xoá vĩnh viễn các vòng quay đã bị xoá tạm thời."
};

export default async function AdminTrashPage() {
  const wheels = await db.wheel.findMany({
    where: { isDeleted: true },
    include: {
      user: { select: { username: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  const serializedWheels = wheels.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <TrashClient initialWheels={serializedWheels} />;
}
